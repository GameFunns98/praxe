import Link from 'next/link';
import { completePasswordReset } from './actions';

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : '';

  return (
    <main className="mx-auto mt-16 max-w-md rounded-lg border bg-white p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Nastavit nové heslo</h1>
      <form action={completePasswordReset} className="space-y-3">
        <input type="hidden" name="token" value={token} />
        <input name="password" type="password" minLength={8} required className="w-full rounded border px-3 py-2" placeholder="Nové heslo" />
        <input name="passwordAgain" type="password" minLength={8} required className="w-full rounded border px-3 py-2" placeholder="Potvrzení hesla" />
        <button className="w-full rounded border px-3 py-2">Uložit nové heslo</button>
      </form>
      <Link href="/login" className="text-sm text-blue-600 underline">Zpět na login</Link>
    </main>
  );
}
