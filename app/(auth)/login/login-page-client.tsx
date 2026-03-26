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
  ForcePasswordReset: 'Účet vyžaduje reset hesla před dalším použitím.'
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
    <main className="mx-auto mt-16 max-w-md rounded-lg border bg-white p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Systém zápisu praxí</h1>
      <p className="text-sm">Primární přihlášení běží přes Discord. Pokud účet není aktivní, požádejte administrátora o schválení.</p>

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
