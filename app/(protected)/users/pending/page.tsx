import Link from 'next/link';
import { Roles } from '@/lib/auth/roles';
import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export default async function PendingUsersPage() {
  const session = await requireSession();
  if (session.user.role !== Roles.ADMIN) return <p>Přístup pouze pro admin.</p>;

  const users = await prisma.user.findMany({
    where: { active: false },
    orderBy: { createdAt: 'asc' }
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Čekající účty na schválení</h1>
      {users.length === 0 ? <p className="text-sm text-slate-500">Bez pending účtů.</p> : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="rounded border bg-white p-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{u.fullName} ({u.email})</p>
                <p className="text-xs text-slate-500">Discord: {u.discordUsername ?? u.discordGlobalName ?? 'nepropojeno'}</p>
              </div>
              <Link href={`/users/${u.id}`} className="rounded border px-3 py-1 text-sm">Otevřít detail + schválit</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
