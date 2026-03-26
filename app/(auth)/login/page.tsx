import { Suspense } from 'react';
import { LoginPageClient } from './login-page-client';

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = typeof params.error === 'string' ? params.error : undefined;

  return (
    <Suspense fallback={<main className="mx-auto mt-16 max-w-md rounded-lg border bg-white p-6">Načítání přihlášení…</main>}>
      <LoginPageClient callbackError={error} />
    </Suspense>
  );
}
