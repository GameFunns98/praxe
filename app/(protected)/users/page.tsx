import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { Roles, type Role } from '@/lib/auth/roles';

export default async function UsersPage() {
  const session = await requireSession();
  if (session.user.role !== Roles.ADMIN) return <p>Přístup pouze pro admin.</p>;
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });

  return <div>
    <h1 className="mb-4 text-xl font-semibold">Správa uživatelů</h1>
    <table className="w-full rounded border bg-white text-sm"><thead><tr><th className="p-2 text-left">Jméno</th><th>Role</th><th>Email</th><th>Aktivní</th></tr></thead>
      <tbody>{users.map((u: any)=><tr key={u.id} className="border-t"><td className="p-2">{u.fullName}</td><td>{u.role}</td><td>{u.email}</td><td>{u.active ? 'Ano' : 'Ne'}</td></tr>)}</tbody></table>
  </div>;
}
