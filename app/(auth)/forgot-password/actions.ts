'use server';

import { createPasswordResetToken } from '@/lib/auth/password-reset';
import { hitRateLimit } from '@/lib/security/rate-limit';
import { sendPasswordResetEmail } from '@/lib/services/email';

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') ?? '').toLowerCase().trim();
  if (!email) return;

  const limiter = hitRateLimit(`forgot:${email}`, 5, 10 * 60 * 1000);
  if (limiter.blocked) return;

  const reset = await createPasswordResetToken(email);
  if (!reset) return;

  const resetUrl = `${process.env.NEXTAUTH_URL ?? ''}/reset-password?token=${reset.rawToken}`;
  await sendPasswordResetEmail({ to: email, resetUrl });
}
