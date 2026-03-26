import { authOptions } from '@/lib/auth/auth-options';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  return session;
}
