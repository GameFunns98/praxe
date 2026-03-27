import Link from 'next/link';
import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { Roles } from '@/lib/auth/roles';

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireSession();
  if (session.user.role !== Roles.ADMIN) return <p>Přístup pouze pro admin.</p>;

  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  const role = typeof params.role === 'string' ? params.role : 'ALL';
  const active = typeof params.active === 'string' ? params.active : 'ALL';

  const users = await prisma.user.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { callsign: { contains: q, mode: 'insensitive' } }
            ]
          }
        : {}),
      ...(role !== 'ALL' ? { role: role as any } : {}),
      ...(active !== 'ALL' ? { active: active === 'true' } : {})
    },
    orderBy: { createdAt: 'desc' }
  });

  const activeCount = users.filter((u) => u.active).length;

  return <div className="space-y-4">
    <h1 className="text-xl font-semibold">Správa uživatelů</h1>

    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded border bg-white p-3"><p className="text-xs text-slate-500">Výsledky filtru</p><p className="text-2xl font-semibold">{users.length}</p></div>
      <div className="rounded border bg-white p-3"><p className="text-xs text-slate-500">Aktivní</p><p className="text-2xl font-semibold text-green-700">{activeCount}</p></div>
      <div className="rounded border bg-white p-3"><p className="text-xs text-slate-500">Neaktivní</p><p className="text-2xl font-semibold text-amber-700">{users.length - activeCount}</p></div>
    </div>

    <form className="grid gap-2 md:grid-cols-4" method="GET">
      <input name="q" defaultValue={q} placeholder="Hledat jméno/email/callsign" className="rounded border px-3 py-2" />
      <select name="role" defaultValue={role} className="rounded border px-3 py-2">
        <option value="ALL">Všechny role</option>
        <option value="ADMIN">ADMIN</option>
        <option value="COMMAND_STAFF">COMMAND_STAFF</option>
        <option value="TRAINING_OFFICER">TRAINING_OFFICER</option>
        <option value="TRAINEE">TRAINEE</option>
      </select>
      <select name="active" defaultValue={active} className="rounded border px-3 py-2">
        <option value="ALL">Všechny stavy</option>
        <option value="true">Pouze aktivní</option>
        <option value="false">Pouze neaktivní</option>
      </select>
      <button className="rounded border bg-white px-3 py-2">Filtrovat</button>
    </form>

    {users.length === 0 ? (
      <div className="rounded border border-dashed bg-white p-8 text-center text-sm text-slate-500">Žádní uživatelé neodpovídají filtru.</div>
    ) : (
      <table className="w-full rounded border bg-white text-sm">
        <thead>
          <tr>
            <th className="p-2 text-left">Uživatel</th><th>Role</th><th>Auth</th><th>Email</th><th>Aktivní</th><th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => <tr key={u.id} className="border-t">
            <td className="p-2">
              <div className="flex items-center gap-2">
                {u.discordAvatar ? <img src={u.discordAvatar} alt={u.fullName} className="h-8 w-8 rounded-full" /> : <div className="h-8 w-8 rounded-full bg-slate-200" />}
                <div>
                  <p>{u.fullName}</p>
                  <p className="text-xs text-slate-500">{u.callsign}</p>
                </div>
              </div>
            </td>
            <td>{u.role}</td>
            <td><span className="rounded bg-slate-100 px-2 py-1 text-xs">{u.authProvider}</span></td>
            <td>{u.email}</td>
            <td>{u.active ? <span className="text-green-700">Ano</span> : <span className="text-amber-700">Ne</span>}</td>
            <td><Link className="text-blue-600 underline" href={`/users/${u.id}`}>Detail</Link></td>
          </tr>)}
        </tbody>
      </table>
    )}
  </div>;
}
