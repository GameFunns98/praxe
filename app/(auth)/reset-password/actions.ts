'use server';

import { resetPasswordWithToken } from '@/lib/auth/password-reset';
import { hitRateLimit } from '@/lib/security/rate-limit';

export async function completePasswordReset(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  const passwordAgain = String(formData.get('passwordAgain') ?? '');

  const limiter = hitRateLimit(`reset:${token.slice(0, 12)}`, 8, 10 * 60 * 1000);
  if (limiter.blocked) throw new Error('Příliš mnoho pokusů.');

  if (!token || password.length < 8 || password !== passwordAgain) {
    throw new Error('Neplatný token nebo heslo.');
  }

  const result = await resetPasswordWithToken(token, password);
  if (!result.ok) throw new Error('Token je neplatný nebo expirovaný.');
}
