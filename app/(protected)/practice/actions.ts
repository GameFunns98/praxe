'use server';

import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { createPracticeSchema, approveSchema, rejectSchema } from '@/lib/schemas/practice';
import { calculateDurationMinutes, canApprove, computeDeduction, isSubmittedWithinOneHour, resolveInitialStatus } from '@/lib/services/practice';
import { Roles } from '@/lib/auth/roles';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/services/audit';
import { notifyPracticeApproved, notifyPracticeRejected } from '@/lib/services/discord';

export async function createPracticeRecord(formData: FormData) {
  const session = await requireSession();
  if (session.user.role !== Roles.TRAINEE) throw new Error('Nemáte oprávnění.');
  const parsed = createPracticeSchema.parse(Object.fromEntries(formData.entries()));

  const supervisor = await prisma.user.findUnique({ where: { id: parsed.supervisorId } });
  if (!supervisor || supervisor.role !== Roles.TRAINING_OFFICER) throw new Error('Praxe může být pouze s Training Officer.');

  const startAt = new Date(parsed.startAt);
  const endAt = new Date(parsed.endAt);
  const duration = calculateDurationMinutes(startAt, endAt);
  if (duration <= 0 || duration > 24 * 60) throw new Error('Neplatná délka praxe.');

  const overlap = await prisma.practiceRecord.findFirst({
    where: {
      traineeId: session.user.id,
      status: { in: ['APPROVED', 'LATE_APPROVED'] },
      startAt: { lt: endAt },
      endAt: { gt: startAt }
    }
  });
  if (overlap) throw new Error('Překryv schválené praxe není povolen.');

  const within = isSubmittedWithinOneHour(endAt, new Date());
  const status = resolveInitialStatus(within);

  const record = await prisma.practiceRecord.create({
    data: {
      traineeId: session.user.id,
      supervisorId: parsed.supervisorId,
      startAt,
      endAt,
      durationMinutes: duration,
      submittedWithinOneHour: within,
      status,
      traineeSignature: parsed.traineeSignature
    }
  });

  await logAudit(session.user.id, 'PracticeRecord', record.id, 'CREATE', undefined, record);
  revalidatePath('/practice');
}

export async function approvePracticeRecord(formData: FormData) {
  const session = await requireSession();
  const parsed = approveSchema.parse(Object.fromEntries(formData.entries()));

  const record = await prisma.practiceRecord.findUnique({ where: { id: parsed.id }, include: { trainee: true, supervisor: true } });
  if (!record) throw new Error('Záznam nenalezen.');

  const isOfficer = session.user.role === Roles.TRAINING_OFFICER && record.supervisorId === session.user.id;
  const isAdmin = session.user.role === Roles.ADMIN;
  if (!isOfficer && !isAdmin) throw new Error('Nemáte oprávnění schválit záznam.');
  if (!canApprove(record.status, record.deductedMinutes)) throw new Error('Záznam již byl zpracován.');

  const requirement = await prisma.practiceRequirement.findUnique({ where: { userId: record.traineeId } });
  if (!requirement) throw new Error('Požadavek praxe nebyl nalezen.');

  const { deducted, nextRemaining } = computeDeduction(requirement.remainingMinutes, record.durationMinutes);
  const nextStatus = record.status === 'LATE_PENDING' ? 'LATE_APPROVED' : 'APPROVED';

  await prisma.$transaction(async (tx) => {
    await tx.practiceRecord.update({
      where: { id: record.id },
      data: {
        status: nextStatus,
        supervisorSignature: parsed.supervisorSignature,
        supervisorComment: parsed.supervisorComment,
        deductedMinutes: deducted
      }
    });
    await tx.practiceRequirement.update({ where: { userId: record.traineeId }, data: { remainingMinutes: nextRemaining } });
  });

  const after = { status: nextStatus, deductedMinutes: deducted, remainingMinutes: nextRemaining };
  await logAudit(session.user.id, 'PracticeRecord', record.id, 'APPROVE', record, after);

  try {
    const notified = await notifyPracticeApproved(
      { ...record, status: nextStatus, supervisorSignature: parsed.supervisorSignature, supervisorComment: parsed.supervisorComment ?? null },
      nextRemaining
    );
    console.info(`[Discord] Schválení záznamu ${record.id}: ${notified ? 'odesláno' : 'přeskočeno'}`);
  } catch (error) {
    console.error('[Discord] Chyba při odeslání schvalovací notifikace', error);
  }

  revalidatePath('/practice');
  revalidatePath('/dashboard');
}

export async function rejectPracticeRecord(formData: FormData) {
  const session = await requireSession();
  const parsed = rejectSchema.parse(Object.fromEntries(formData.entries()));
  const record = await prisma.practiceRecord.findUnique({ where: { id: parsed.id }, include: { trainee: true, supervisor: true } });
  if (!record) throw new Error('Záznam nenalezen.');

  const isOfficer = session.user.role === Roles.TRAINING_OFFICER && record.supervisorId === session.user.id;
  const isAdmin = session.user.role === Roles.ADMIN;
  if (!isOfficer && !isAdmin) throw new Error('Nemáte oprávnění zamítnout záznam.');
  if (!canApprove(record.status, record.deductedMinutes)) throw new Error('Záznam již byl zpracován.');

  await prisma.practiceRecord.update({ where: { id: parsed.id }, data: { status: 'REJECTED', supervisorComment: parsed.supervisorComment } });
  await logAudit(session.user.id, 'PracticeRecord', record.id, 'REJECT', record, { status: 'REJECTED', supervisorComment: parsed.supervisorComment });

  try {
    const notified = await notifyPracticeRejected({ ...record, status: 'REJECTED', supervisorComment: parsed.supervisorComment });
    console.info(`[Discord] Zamítnutí záznamu ${record.id}: ${notified ? 'odesláno' : 'přeskočeno'}`);
  } catch (error) {
    console.error('[Discord] Chyba při odeslání zamítací notifikace', error);
  }

  revalidatePath('/practice');
}
