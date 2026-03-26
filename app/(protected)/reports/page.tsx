import Link from 'next/link';
import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export default async function ReportsPage() {
  await requireSession();
  const completed = await prisma.practiceRequirement.count({ where: { remainingMinutes: 0 } });
  const outstanding = await prisma.practiceRequirement.count({ where: { remainingMinutes: { gt: 0 } } });
  const late = await prisma.practiceRecord.count({ where: { status: 'LATE_PENDING' } });

  return <div className="space-y-4">
    <header>
      <p className="text-sm text-slate-500">Reporty</p>
      <h1 className="text-2xl font-semibold">Přehledy a exporty</h1>
    </header>
    <section className="grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border bg-white p-4"><p className="text-sm text-slate-500">Dokončené praxe</p><p className="text-3xl font-semibold">{completed}</p></div>
      <div className="rounded-xl border bg-white p-4"><p className="text-sm text-slate-500">Nedokončené praxe</p><p className="text-3xl font-semibold">{outstanding}</p></div>
      <div className="rounded-xl border bg-white p-4"><p className="text-sm text-slate-500">Pozdní zápisy</p><p className="text-3xl font-semibold">{late}</p></div>
    </section>
    <Link href="/api/reports/csv" className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800">Stáhnout CSV report</Link>
  </div>;
}
