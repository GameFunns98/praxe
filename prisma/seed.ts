import { PrismaClient, PracticeStatus, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addHours, subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(process.env.DEMO_PASSWORD ?? 'Demo1234!', 10);

  await prisma.auditLog.deleteMany();
  await prisma.excuseOrNote.deleteMany();
  await prisma.practiceRecord.deleteMany();
  await prisma.practiceRequirement.deleteMany();
  await prisma.discordSettings.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      fullName: 'Jan Novák',
      callsign: 'ADMIN-1',
      rankTitle: 'Superadmin',
      email: 'admin@ems.local',
      passwordHash,
      role: Role.ADMIN,
      isSuperadmin: true,
      authProvider: 'LOCAL'
    }
  });

  const officers = await Promise.all([
    prisma.user.create({ data: { fullName: 'Petr Dvořák', callsign: 'TO-101', rankTitle: 'Training Officer', email: 'to1@ems.local', passwordHash, role: Role.TRAINING_OFFICER, authProvider: 'DISCORD' } }),
    prisma.user.create({ data: { fullName: 'Lucie Svobodová', callsign: 'TO-102', rankTitle: 'Training Officer', email: 'to2@ems.local', passwordHash, role: Role.TRAINING_OFFICER, authProvider: 'DISCORD' } })
  ]);

  await prisma.user.create({ data: { fullName: 'Karel Velitel', callsign: 'CS-1', rankTitle: 'Command Staff', email: 'command@ems.local', passwordHash, role: Role.COMMAND_STAFF, authProvider: 'DISCORD' } });

  const trainees = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      prisma.user.create({
        data: {
          fullName: `Trainee ${i + 1}`,
          callsign: `TR-${i + 1}`,
          rankTitle: 'Nováček',
          email: `trainee${i + 1}@ems.local`,
          passwordHash,
          role: Role.TRAINEE,
          authProvider: 'DISCORD'
        }
      })
    )
  );

  await prisma.practiceRequirement.createMany({
    data: trainees.map((t) => ({ userId: t.id, requiredMinutes: 900, remainingMinutes: 900 }))
  });

  const now = new Date();
  for (const trainee of trainees) {
    await prisma.practiceRecord.createMany({
      data: [
        {
          traineeId: trainee.id,
          supervisorId: officers[0].id,
          startAt: subDays(now, 2),
          endAt: addHours(subDays(now, 2), 2),
          durationMinutes: 120,
          submittedAt: addHours(subDays(now, 2), 2.5),
          submittedWithinOneHour: true,
          status: PracticeStatus.APPROVED,
          traineeSignature: trainee.fullName,
          supervisorSignature: officers[0].fullName,
          deductedMinutes: 120
        },
        {
          traineeId: trainee.id,
          supervisorId: officers[1].id,
          startAt: subDays(now, 1),
          endAt: addHours(subDays(now, 1), 1),
          durationMinutes: 60,
          submittedAt: addHours(subDays(now, 1), 3),
          submittedWithinOneHour: false,
          status: PracticeStatus.LATE_PENDING,
          traineeSignature: trainee.fullName,
          deductedMinutes: 0
        }
      ]
    });

    await prisma.practiceRequirement.update({
      where: { userId: trainee.id },
      data: { remainingMinutes: 780 }
    });
  }

  console.log('Seed completed');
  console.log('Demo password:', process.env.DEMO_PASSWORD ?? 'Demo1234!');
  console.log('Superadmin local fallback: admin@ems.local');
}

main().finally(() => prisma.$disconnect());
