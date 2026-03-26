import Link from 'next/link';
import { requireSession } from '@/lib/auth/session';

const links: [string, string][] = [
  ['Dashboard', '/dashboard'],
  ['Praxe', '/practice'],
  ['Nový zápis', '/practice/new'],
  ['Pozdní zápisy', '/late'],
  ['Poznámky', '/notes'],
  ['Uživatelé', '/users'],
  ['Reporty', '/reports'],
  ['Audit', '/audit'],
  ['Nastavení', '/settings']
];

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b bg-white/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold tracking-tight">EMS Praxe — administrace</p>
            <p className="text-sm text-slate-600">{session.user.name} · {session.user.role}</p>
          </div>
          <a href="/api/auth/signout" className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">Odhlásit</a>
        </div>
        <nav className="mx-auto mt-3 flex max-w-7xl flex-wrap gap-2 text-sm">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 transition hover:bg-slate-100">
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}
