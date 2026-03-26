import { Card } from '@/components/ui/card';
import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { formatMinutes } from '@/lib/utils';
import { Roles } from '@/lib/auth/roles';
import { getPracticeStatusLabel } from '@/lib/practice-status';

export default async function DashboardPage() {
  const session = await requireSession();

  if (session.user.role === Roles.TRAINEE) {
    const req = await prisma.practiceRequirement.findUnique({ where: { userId: session.user.id } });
    const stats = await prisma.practiceRecord.groupBy({ by: ['status'], where: { traineeId: session.user.id }, _count: { status: true } });
    const approved = await prisma.practiceRecord.aggregate({ where: { traineeId: session.user.id, status: { in: ['APPROVED', 'LATE_APPROVED'] } }, _sum: { deductedMinutes: true } });
    const recent = await prisma.practiceRecord.findMany({ where: { traineeId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 5, include: { supervisor: true } });

    return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card><p className="text-sm text-slate-500">Zbývající čas</p><p className="text-2xl font-semibold">{formatMinutes(req?.remainingMinutes ?? 0)}</p></Card>
      <Card><p className="text-sm text-slate-500">Celkem schváleno</p><p className="text-2xl font-semibold">{formatMinutes(approved._sum.deductedMinutes ?? 0)}</p></Card>
      <Card className="md:col-span-2"><h3 className="font-semibold">Poslední zápisy</h3>{recent.length === 0 ? <p className="text-sm text-slate-500">Bez záznamů.</p> : recent.map((r) => <p key={r.id} className="text-sm">{getPracticeStatusLabel(r.status)} · {r.supervisor.fullName}</p>)}</Card>
      <Card className="md:col-span-2 xl:col-span-4"><h3 className="font-semibold">Statistiky stavů</h3><div className="mt-2 grid gap-2 md:grid-cols-3">{stats.map((s) => <p key={s.status} className="rounded-md bg-slate-50 p-2 text-sm">{getPracticeStatusLabel(s.status)}: <strong>{s._count.status}</strong></p>)}</div></Card>
    </div>;
  }

  if (session.user.role === Roles.TRAINING_OFFICER) {
    const pending = await prisma.practiceRecord.count({ where: { supervisorId: session.user.id, status: { in: ['PENDING', 'LATE_PENDING'] } } });
    const approvedToday = await prisma.practiceRecord.count({ where: { supervisorId: session.user.id, status: { in: ['APPROVED', 'LATE_APPROVED'] } } });
    const rejectedToday = await prisma.practiceRecord.count({ where: { supervisorId: session.user.id, status: 'REJECTED' } });
    return <div className="grid gap-4 md:grid-cols-3">
      <Card><p className="text-sm text-slate-500">Čeká na potvrzení</p><p className="text-3xl font-semibold">{pending}</p></Card>
      <Card><p className="text-sm text-slate-500">Schváleno</p><p className="text-3xl font-semibold">{approvedToday}</p></Card>
      <Card><p className="text-sm text-slate-500">Zamítnuto</p><p className="text-3xl font-semibold">{rejectedToday}</p></Card>
    </div>;
  }

  const totalTrainees = await prisma.user.count({ where: { role: Roles.TRAINEE } });
  const late = await prisma.practiceRecord.count({ where: { status: 'LATE_PENDING' } });
  const pending = await prisma.practiceRecord.count({ where: { status: { in: ['PENDING', 'LATE_PENDING'] } } });
  const sanctions = await prisma.excuseOrNote.count({ where: { type: 'SANCTION' } });

  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <Card><p className="text-sm text-slate-500">Celkem trainee</p><p className="text-3xl font-semibold">{totalTrainees}</p></Card>
    <Card><p className="text-sm text-slate-500">Čekající schválení</p><p className="text-3xl font-semibold">{pending}</p></Card>
    <Card><p className="text-sm text-slate-500">Pozdní zápisy</p><p className="text-3xl font-semibold">{late}</p></Card>
    <Card><p className="text-sm text-slate-500">Sankce</p><p className="text-3xl font-semibold">{sanctions}</p></Card>
  </div>;
}
