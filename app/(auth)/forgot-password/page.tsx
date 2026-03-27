import Link from 'next/link';
import { requestPasswordReset } from './actions';

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto mt-16 max-w-md rounded-lg border bg-white p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Obnova hesla</h1>
      <p className="text-sm text-slate-600">Zadejte email účtu. Pokud existuje, vygenerujeme reset token (zatím do server logu).</p>
      <form action={requestPasswordReset} className="space-y-3">
        <input name="email" type="email" required className="w-full rounded border px-3 py-2" placeholder="Email" />
        <button className="w-full rounded border px-3 py-2">Vygenerovat reset</button>
      </form>
      <p className="text-xs text-slate-500">Po odeslání se podívejte do server logu na reset URL.</p>
      <Link href="/login" className="text-sm text-blue-600 underline">Zpět na login</Link>
    </main>
  );
}
