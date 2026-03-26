import Link from 'next/link';
import { requireSession } from '@/lib/auth/session';

const links: [string, string][] = [
  ['Dashboard', '/dashboard'],
  ['Praxe', '/practice'],
  ['Nový záznam', '/practice/new'],
  ['Pozdní zápisy', '/late'],
  ['Poznámky', '/notes'],
  ['Uživatelé', '/users'],
  ['Reporty', '/reports'],
  ['Audit log', '/audit'],
  ['Nastavení', '/settings']
];

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Systém zápisu praxí</p>
            <p className="text-sm text-slate-600">{session.user.name} ({session.user.role})</p>
          </div>
          <a href="/api/auth/signout" className="rounded border px-3 py-1">Odhlásit</a>
        </div>
        <nav className="mt-3 flex flex-wrap gap-3 text-sm">
          {links.map(([label, href]) => <Link key={href} href={href} className="rounded bg-slate-100 px-2 py-1">{label}</Link>)}
        </nav>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
