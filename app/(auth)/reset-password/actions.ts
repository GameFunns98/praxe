'use server';

import { resetPasswordWithToken } from '@/lib/auth/password-reset';

export async function completePasswordReset(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  const passwordAgain = String(formData.get('passwordAgain') ?? '');

  if (!token || password.length < 8 || password !== passwordAgain) {
    throw new Error('Neplatný token nebo heslo.');
  }

  const result = await resetPasswordWithToken(token, password);
  if (!result.ok) throw new Error('Token je neplatný nebo expirovaný.');
}
