import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { Roles, type Role } from '@/lib/auth/roles';

export default async function LatePage() {
  const session = await requireSession();
  if (session.user.role !== Roles.ADMIN) return <p>Přístup pouze pro admin.</p>;
  const records = await prisma.practiceRecord.findMany({ where: { status: 'LATE_PENDING' }, include: { trainee: true, supervisor: true } });
  return <div>
    <h1 className="mb-3 text-xl font-semibold">Pozdní submissions</h1>
    {records.length === 0 ? <p>Bez pozdních záznamů.</p> : records.map((r: any)=><div key={r.id} className="mb-2 rounded border bg-white p-3">{r.trainee.fullName} - {r.durationMinutes} min - {r.supervisor.fullName}</div>)}
  </div>;
}
