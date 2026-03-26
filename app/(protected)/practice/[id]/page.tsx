import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { formatMinutes } from '@/lib/utils';
import { PracticeStatusBadge } from '@/components/practice-status-badge';

function formatDate(value: Date) {
  return value.toLocaleString('cs-CZ', {
    timeZone: 'Europe/Prague',
    dateStyle: 'full',
    timeStyle: 'short',
    hour12: false
  });
}

export default async function PracticeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireSession();
  const record = await prisma.practiceRecord.findUnique({ where: { id }, include: { trainee: true, supervisor: true } });
  if (!record) notFound();

  const [req, audit] = await Promise.all([
    prisma.practiceRequirement.findUnique({ where: { userId: record.traineeId } }),
    prisma.auditLog.findMany({ where: { entityType: 'PracticeRecord', entityId: record.id }, orderBy: { createdAt: 'desc' }, take: 20 })
  ]);

  return (
    <article className="mx-auto max-w-3xl space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
      <header>
        <p className="text-sm text-slate-500">Praxe / Detail</p>
        <h1 className="text-2xl font-semibold">Detail záznamu praxe</h1>
      </header>

      {!record.submittedWithinOneHour ? (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">Pozdní odeslání: zápis byl podán po více než 1 hodině od ukončení praxe.</div>
      ) : null}

      <section className="grid gap-2 rounded-xl border p-4">
        <p><strong>Trainee:</strong> {record.trainee.fullName}</p>
        <p><strong>Dohlížející důstojník:</strong> {record.supervisor.fullName} ({record.supervisor.callsign})</p>
        <p><strong>Role / hodnost / volačka:</strong> {record.trainee.role} / {record.trainee.rankTitle} / {record.trainee.callsign}</p>
        <p><strong>Začátek:</strong> {formatDate(record.startAt)}</p>
        <p><strong>Konec:</strong> {formatDate(record.endAt)}</p>
        <p><strong>Délka:</strong> {formatMinutes(record.durationMinutes)}</p>
        <p><strong>Stav:</strong> <PracticeStatusBadge status={record.status} /></p>
        <p><strong>Zbývající čas praxí:</strong> {formatMinutes(req?.remainingMinutes ?? 0)}</p>
      </section>

      <section className="grid gap-2 rounded-xl border p-4 md:grid-cols-2">
        <div>
          <h2 className="font-semibold">Sekce podpisů</h2>
          <p><strong>Podpis trainee:</strong> {record.traineeSignature}</p>
          <p><strong>Podpis dohlížejícího:</strong> {record.supervisorSignature ?? 'Nevyplněno'}</p>
        </div>
        <div>
          <h2 className="font-semibold">Poznámky</h2>
          <p>{record.supervisorComment ?? 'Bez poznámky.'}</p>
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">Auditní historie</h2>
        {audit.length === 0 ? (
          <p className="text-sm text-slate-500">Bez auditních záznamů.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {audit.map((item) => <li key={item.id} className="rounded border p-2">{formatDate(item.createdAt)} — {item.action}</li>)}
          </ul>
        )}
      </section>
    </article>
  );
}
