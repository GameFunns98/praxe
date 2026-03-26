'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [error, setError] = useState('');

  async function onSubmit(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const result = await signIn('credentials', { email, password, callbackUrl: '/dashboard', redirect: false });
    if (result?.error) setError('Neplatné přihlašovací údaje.');
    else window.location.href = '/dashboard';
  }

  return (
    <main className="mx-auto mt-16 max-w-md rounded-lg border bg-white p-6">
      <h1 className="mb-3 text-2xl font-semibold">Systém zápisu praxí</h1>
      <p className="mb-4 text-sm">Praxi si musíte zapsat vždy do 1 hodiny po dané službě.</p>
      <form action={onSubmit} className="space-y-3">
        <Input name="email" placeholder="Email" required />
        <Input name="password" type="password" placeholder="Heslo" required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full">Přihlásit</Button>
      </form>
    </main>
  );
}
