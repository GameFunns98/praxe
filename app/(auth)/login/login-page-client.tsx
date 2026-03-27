'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const errorMap: Record<string, string> = {
  AwaitingApproval: 'Účet byl vytvořen, ale čeká na aktivaci administrátorem. Kontaktujte admin tým.',
  AccountDisabled: 'Účet je deaktivovaný. Kontaktujte administrátora.',
  DiscordEmailMissing: 'Discord účet nemá dostupný email. Nelze vytvořit přihlášení.',
  ForcePasswordReset: 'Účet vyžaduje reset hesla před dalším použitím.',
  TooManyAttempts: 'Příliš mnoho pokusů o přihlášení. Zkuste to za chvíli znovu.'
};

export function LoginPageClient({ callbackError }: { callbackError?: string }) {
  const [error, setError] = useState('');

  async function onSubmit(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const result = await signIn('credentials', { email, password, callbackUrl: '/dashboard', redirect: false });

    if (result?.error) {
      setError(errorMap[result.error] ?? 'Neplatné přihlašovací údaje pro nouzový local login.');
      return;
    }

    window.location.href = '/dashboard';
  }

  return (
    <main className="mx-auto mt-16 max-w-lg rounded-xl border bg-white p-6 shadow-sm space-y-5">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Systém zápisu praxí</h1>
        <p className="text-sm text-slate-600">Primární přihlášení je přes Discord. Účty bez aktivace adminem se nepustí dál.</p>
      </header>

      <section className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        <p className="font-medium">Doporučený postup</p>
        <ol className="ml-5 mt-1 list-decimal space-y-1 text-xs">
          <li>Klikněte na „Přihlásit se přes Discord“.</li>
          <li>Pokud účet čeká na schválení, kontaktujte administrátora.</li>
          <li>Nouzový local login používejte pouze jako superadmin fallback.</li>
        </ol>
      </section>

      <Button type="button" className="w-full" onClick={() => signIn('discord', { callbackUrl: '/dashboard' })}>
        Přihlásit se přes Discord
      </Button>

      <details className="rounded border p-3">
        <summary className="cursor-pointer text-sm font-medium">Nouzový superadmin login</summary>
        <p className="mt-2 text-xs text-slate-600">Pouze pro emergency přístup administrátora.</p>
        <form action={onSubmit} className="mt-3 space-y-3">
          <Input name="email" placeholder="Email" required />
          <Input name="password" type="password" placeholder="Heslo" required />
          <Button type="submit" variant="outline" className="w-full">Přihlásit lokálně</Button>
        </form>
        <Link href="/forgot-password" className="mt-2 inline-block text-xs text-blue-600 underline">Zapomenuté heslo / reset přístupu</Link>
      </details>

      {(error || callbackError) && (
        <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {error || errorMap[callbackError ?? ''] || 'Přihlášení se nezdařilo.'}
        </div>
      )}
    </main>
  );
}
