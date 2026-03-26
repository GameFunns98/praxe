'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const errorMap: Record<string, string> = {
  AwaitingApproval: 'Účet byl vytvořen, ale čeká na aktivaci administrátorem.',
  AccountDisabled: 'Účet je deaktivovaný. Kontaktujte administrátora.',
  DiscordEmailMissing: 'Discord účet nemá dostupný email. Nelze vytvořit přihlášení.'
};

export default function LoginPage() {
  const [error, setError] = useState('');
  const params = useSearchParams();
  const callbackError = params.get('error');

  async function onSubmit(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const result = await signIn('credentials', { email, password, callbackUrl: '/dashboard', redirect: false });
    if (result?.error) setError('Neplatné přihlašovací údaje nebo vyžadována změna hesla.');
    else window.location.href = '/dashboard';
  }

  return (
    <main className="mx-auto mt-16 max-w-md rounded-lg border bg-white p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Systém zápisu praxí</h1>
      <p className="text-sm">Primární přihlášení běží přes Discord. Lokální login je pouze pro nouzový superadmin přístup.</p>

      <Button type="button" className="w-full" onClick={() => signIn('discord', { callbackUrl: '/dashboard' })}>
        Přihlásit se přes Discord
      </Button>

      <section className="rounded border p-3 space-y-2">
        <p className="text-sm font-medium">Nouzový superadmin login</p>
        <form action={onSubmit} className="space-y-3">
          <Input name="email" placeholder="Email" required />
          <Input name="password" type="password" placeholder="Heslo" required />
          <Button type="submit" variant="outline" className="w-full">Přihlásit lokálně</Button>
        </form>
      </section>

      {(error || callbackError) && <p className="text-sm text-red-600">{error || errorMap[callbackError ?? ''] || 'Přihlášení se nezdařilo.'}</p>}
    </main>
  );
}
