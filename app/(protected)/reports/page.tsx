import Link from 'next/link';
import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export default async function ReportsPage() {
  await requireSession();
  const completed = await prisma.practiceRequirement.count({ where: { remainingMinutes: 0 } });
  const outstanding = await prisma.practiceRequirement.count({ where: { remainingMinutes: { gt: 0 } } });
  const late = await prisma.practiceRecord.count({ where: { status: 'LATE_PENDING' } });
  return <div className="space-y-3">
    <h1 className="text-xl font-semibold">Reporty a export</h1>
    <p>Dokončení trainee: {completed}</p>
    <p>Nedokončení trainee: {outstanding}</p>
    <p>Pozdní zápisy: {late}</p>
    <Link href="/api/reports/csv" className="rounded bg-primary px-3 py-2 text-white">Stáhnout CSV</Link>
  </div>;
}
