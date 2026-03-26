import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { Roles } from '@/lib/auth/roles';
import { PracticeDetailSheet } from '@/components/practice/practice-detail-sheet';
import { getPracticeStatusLabel } from '@/lib/practice-status';

const statusOptions = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'LATE_PENDING', 'LATE_APPROVED', 'CANCELLED'] as const;

type StatusFilter = (typeof statusOptions)[number];

export default async function PracticeListPage({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  const session = await requireSession();
  const params = await searchParams;
  const selectedStatus = (params?.status?.toUpperCase() as StatusFilter) || 'ALL';

  const roleScope =
    session.user.role === Roles.TRAINEE
      ? { traineeId: session.user.id }
      : session.user.role === Roles.TRAINING_OFFICER
        ? { supervisorId: session.user.id }
        : {};

  const where = selectedStatus === 'ALL' ? roleScope : { ...roleScope, status: selectedStatus };

  const records = await prisma.practiceRecord.findMany({
    where,
    include: { trainee: true, supervisor: true },
    orderBy: { createdAt: 'desc' }
  });

  const recordsWithDetails = await Promise.all(
    records.map(async (record) => {
      const [auditItems, requirement] = await Promise.all([
        prisma.auditLog.findMany({ where: { entityType: 'PracticeRecord', entityId: record.id }, orderBy: { createdAt: 'desc' }, take: 10 }),
        prisma.practiceRequirement.findUnique({ where: { userId: record.traineeId } })
      ]);

      return { ...record, auditItems, requirement };
    })
  );

  return (
    <div className="space-y-5">
      <header className="sticky top-0 z-20 -mx-6 border-b bg-slate-50/95 px-6 py-4 backdrop-blur">
        <p className="text-sm text-slate-500">Praxe / Přehled</p>
        <h1 className="text-2xl font-semibold tracking-tight">Záznamy praxe</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-slate-500">Celkem záznamů</p>
          <p className="text-2xl font-semibold">{records.length}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-slate-500">Čeká na schválení</p>
          <p className="text-2xl font-semibold">{records.filter((r) => r.status === 'PENDING' || r.status === 'LATE_PENDING').length}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-slate-500">Schváleno</p>
          <p className="text-2xl font-semibold">{records.filter((r) => r.status === 'APPROVED' || r.status === 'LATE_APPROVED').length}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-slate-500">Zamítnuto</p>
          <p className="text-2xl font-semibold">{records.filter((r) => r.status === 'REJECTED').length}</p>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <p className="mb-2 text-sm font-medium text-slate-700">Filtry statusu</p>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((status) => {
            const label = status === 'ALL' ? 'Všechny stavy' : getPracticeStatusLabel(status);
            const active = selectedStatus === status;
            return (
              <a
                key={status}
                href={status === 'ALL' ? '/practice' : `/practice?status=${status}`}
                className={`rounded-full border px-3 py-1.5 text-sm ${active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                {label}
              </a>
            );
          })}
        </div>
      </section>

      {recordsWithDetails.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white p-8 text-center text-slate-500">Žádné záznamy neodpovídají zvoleným filtrům.</div>
      ) : (
        <PracticeDetailSheet records={recordsWithDetails} currentUserId={session.user.id} currentUserRole={session.user.role} />
      )}
    </div>
  );
}
