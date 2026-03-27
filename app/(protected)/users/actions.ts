'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { Roles, type Role } from '@/lib/auth/roles';
import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/services/audit';
import { createPasswordResetToken } from '@/lib/auth/password-reset';
import { sendPasswordResetEmail } from '@/lib/services/email';

async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== Roles.ADMIN) throw new Error('Pouze admin.');
  return session;
}

export async function updateUserRole(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get('userId'));
  const role = String(formData.get('role')) as Role;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Uživatel nenalezen.');

  await prisma.user.update({ where: { id: userId }, data: { role } });
  await logAudit(session.user.id, 'User', userId, 'ROLE_CHANGE', { role: user.role }, { role });
  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
}

export async function setUserActive(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get('userId'));
  const active = String(formData.get('active')) === 'true';
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Uživatel nenalezen.');

  await prisma.user.update({ where: { id: userId }, data: { active } });
  await logAudit(session.user.id, 'User', userId, active ? 'ACTIVATE' : 'DEACTIVATE', { active: user.active }, { active });
  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
}

export async function setTemporaryPassword(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get('userId'));
  const tempPassword = String(formData.get('tempPassword'));
  if (tempPassword.length < 8) throw new Error('Dočasné heslo musí mít min. 8 znaků.');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Uživatel nenalezen.');

  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash, forcePasswordReset: true } });
  await logAudit(session.user.id, 'User', userId, 'TEMP_PASSWORD_SET', { forcePasswordReset: user.forcePasswordReset }, { forcePasswordReset: true });
  revalidatePath(`/users/${userId}`);
}

export async function forcePasswordResetNextLogin(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get('userId'));
  const forcePasswordReset = String(formData.get('forcePasswordReset')) === 'true';
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Uživatel nenalezen.');

  await prisma.user.update({ where: { id: userId }, data: { forcePasswordReset } });
  await logAudit(session.user.id, 'User', userId, 'FORCE_PASSWORD_RESET_TOGGLE', { forcePasswordReset: user.forcePasswordReset }, { forcePasswordReset });
  revalidatePath(`/users/${userId}`);
}

export async function disconnectDiscordAccount(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get('userId'));
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Uživatel nenalezen.');

  await prisma.user.update({
    where: { id: userId },
    data: {
      discordUserId: null,
      discordUsername: null,
      discordGlobalName: null,
      discordAvatar: null,
      authProvider: 'LOCAL'
    }
  });
  await logAudit(session.user.id, 'User', userId, 'DISCORD_UNLINK', { discordUserId: user.discordUserId }, { discordUserId: null });
  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
}



export async function sendResetLinkToUser(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get('userId'));
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Uživatel nenalezen.');

  const reset = await createPasswordResetToken(user.email);
  if (!reset) throw new Error('Reset token nelze vytvořit.');

  const resetUrl = `${process.env.NEXTAUTH_URL ?? ''}/reset-password?token=${reset.rawToken}`;
  const delivered = await sendPasswordResetEmail({ to: user.email, resetUrl });
  await logAudit(session.user.id, 'User', userId, 'PASSWORD_RESET_LINK_SENT', undefined, { delivered: delivered.delivered });
  revalidatePath(`/users/${userId}`);
}

export async function approvePendingUser(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get('userId'));
  const role = String(formData.get('role')) as Role;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Uživatel nenalezen.');

  await prisma.user.update({ where: { id: userId }, data: { active: true, role } });
  await logAudit(session.user.id, 'User', userId, 'PENDING_APPROVED', { active: user.active, role: user.role }, { active: true, role });
  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
}

export async function adjustPracticeRequirement(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get('userId'));
  const requiredMinutes = Number(formData.get('requiredMinutes'));
  const remainingMinutes = Number(formData.get('remainingMinutes'));
  const reason = String(formData.get('reason') ?? '').trim();
  if (!reason) throw new Error('Je nutné uvést důvod změny.');

  const req = await prisma.practiceRequirement.findUnique({ where: { userId } });
  if (!req) throw new Error('Požadavek praxe nenalezen.');

  await prisma.practiceRequirement.update({ where: { userId }, data: { requiredMinutes, remainingMinutes } });
  await logAudit(session.user.id, 'PracticeRequirement', userId, 'MANUAL_ADJUST', req, { requiredMinutes, remainingMinutes, reason });
  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
}
