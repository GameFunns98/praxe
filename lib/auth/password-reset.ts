import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { addHours } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/services/audit';

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createPasswordResetToken(email: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return null;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = addHours(new Date(), 2);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt
    }
  });

  await logAudit(null, 'User', user.id, 'PASSWORD_RESET_REQUEST', undefined, { expiresAt });
  return { rawToken, userId: user.id, email: user.email, expiresAt };
}

export async function resetPasswordWithToken(rawToken: string, nextPassword: string) {
  const tokenHash = hashToken(rawToken);
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { ok: false as const, reason: 'INVALID_OR_EXPIRED' };
  }

  const passwordHash = await bcrypt.hash(nextPassword, 10);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: resetToken.userId }, data: { passwordHash, forcePasswordReset: false } });
    await tx.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } });
  });

  await logAudit(null, 'User', resetToken.userId, 'PASSWORD_RESET_COMPLETE', undefined, { via: 'token' });
  return { ok: true as const };
}
