import Link from 'next/link';
import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { Roles } from '@/lib/auth/roles';
import { PracticeStatusBadge } from '@/components/practice-status-badge';
import { formatMinutes } from '@/lib/utils';

export default async function LatePage() {
  const session = await requireSession();
  if (session.user.role !== Roles.ADMIN) return <p>Přístup pouze pro admin.</p>;

  const records = await prisma.practiceRecord.findMany({ where: { status: 'LATE_PENDING' }, include: { trainee: true, supervisor: true }, orderBy: { submittedAt: 'desc' } });

  return <div className="space-y-4">
    <header>
      <p className="text-sm text-slate-500">Kontrola / Pozdní záznamy</p>
      <h1 className="text-2xl font-semibold">Pozdní podání praxe</h1>
    </header>
    {records.length === 0 ? <div className="rounded-xl border border-dashed bg-white p-8 text-center text-slate-500">Bez pozdních záznamů.</div> : records.map((r: (typeof records)[number]) => <div key={r.id} className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{r.trainee.fullName}</p><PracticeStatusBadge status={r.status} /></div><p className="text-sm text-slate-600">Dohlížející: {r.supervisor.fullName}</p><p className="text-sm text-slate-600">Délka: {formatMinutes(r.durationMinutes)}</p><Link href={`/practice/${r.id}`} className="mt-3 inline-flex rounded-md border px-3 py-1.5 text-sm">Otevřít detail</Link></div>)}
  </div>;
}
