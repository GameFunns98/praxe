import Link from 'next/link';
import { requireSession } from '@/lib/auth/session';
import { Roles, type Role } from '@/lib/auth/roles';

type NavLink = {
  label: string;
  href: string;
  allowedRoles?: Role[];
};

const links: NavLink[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Praxe', href: '/practice' },
  { label: 'Nový zápis', href: '/practice/new', allowedRoles: [Roles.TRAINEE] },
  { label: 'Pozdní zápisy', href: '/late', allowedRoles: [Roles.ADMIN] },
  { label: 'Poznámky', href: '/notes' },
  { label: 'Uživatelé', href: '/users', allowedRoles: [Roles.ADMIN] },
  { label: 'Pending účty', href: '/users/pending', allowedRoles: [Roles.ADMIN] },
  { label: 'Reporty', href: '/reports', allowedRoles: [Roles.ADMIN] },
  { label: 'Audit', href: '/audit', allowedRoles: [Roles.ADMIN] },
  { label: 'Nastavení', href: '/settings', allowedRoles: [Roles.ADMIN] }
];

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const visibleLinks = links.filter((link) => !link.allowedRoles || link.allowedRoles.includes(session.user.role));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b bg-white/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {session.user.discordAvatar ? <img src={session.user.discordAvatar} alt={session.user.name ?? 'avatar'} className="h-10 w-10 rounded-full" /> : <div className="h-10 w-10 rounded-full bg-slate-200" />}
            <div>
              <p className="text-lg font-semibold tracking-tight">EMS Praxe — administrace</p>
              <p className="text-sm text-slate-600">{session.user.discordGlobalName ?? session.user.name} · {session.user.role} · {session.user.authProvider}</p>
            </div>
          </div>
          <a href="/api/auth/signout" className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">Odhlásit</a>
        </div>
        <nav className="mx-auto mt-3 flex max-w-7xl flex-wrap gap-2 text-sm">
          {visibleLinks.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 transition hover:bg-slate-100">
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}
