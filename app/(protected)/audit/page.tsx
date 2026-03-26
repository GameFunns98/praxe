import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { Roles, type Role } from '@/lib/auth/roles';

export default async function AuditPage() {
  const session = await requireSession();
  if (session.user.role !== Roles.ADMIN) return <p>Přístup pouze pro admin.</p>;
  const items = await prisma.auditLog.findMany({ include: { actor: true }, orderBy: { createdAt: 'desc' }, take: 200 });
  return <div>
    <h1 className="mb-4 text-xl font-semibold">Audit log</h1>
    {items.map((i: any)=><div key={i.id} className="mb-2 rounded border bg-white p-2 text-sm">{i.createdAt.toISOString()} | {i.action} | {i.entityType} | {i.actor?.fullName ?? 'Systém'}</div>)}
  </div>;
}
