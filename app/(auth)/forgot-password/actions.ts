'use server';

import { createPasswordResetToken } from '@/lib/auth/password-reset';

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') ?? '').toLowerCase().trim();
  if (!email) return;

  const reset = await createPasswordResetToken(email);
  if (!reset) return;

  const resetUrl = `${process.env.NEXTAUTH_URL ?? ''}/reset-password?token=${reset.rawToken}`;
  console.info(`[Auth] Password reset link generated for ${email}: ${resetUrl}`);
}
