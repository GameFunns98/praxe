import { Card } from '@/components/ui/card';
import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { formatMinutes } from '@/lib/utils';
import { Roles, type Role } from '@/lib/auth/roles';

export default async function DashboardPage() {
  const session = await requireSession();

  if (session.user.role === Roles.TRAINEE) {
    const req = await prisma.practiceRequirement.findUnique({ where: { userId: session.user.id } });
    const stats = await prisma.practiceRecord.groupBy({ by: ['status'], where: { traineeId: session.user.id }, _count: { status: true } });
    const approved = await prisma.practiceRecord.aggregate({ where: { traineeId: session.user.id, status: { in: ['APPROVED', 'LATE_APPROVED'] } }, _sum: { deductedMinutes: true } });
    const recent = await prisma.practiceRecord.findMany({ where: { traineeId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 5, include: { supervisor: true } });

    return <div className="grid gap-4">
      <Card><h2 className="font-semibold">Trainee dashboard</h2><p>Zbývá: {formatMinutes(req?.remainingMinutes ?? 0)}</p><p>Schváleno: {formatMinutes(approved._sum.deductedMinutes ?? 0)}</p></Card>
      <Card><p>Každý nový člen má 15 hodin praxí.</p><p>Praxe můžete vykonávat pouze s Training Officer.</p></Card>
      <Card><h3 className="font-semibold">Poslední zápisy</h3>{recent.map((r: any) => <p key={r.id}>{r.status} - {r.supervisor.fullName}</p>)}</Card>
      <Card><h3 className="font-semibold">Statistiky stavů</h3>{stats.map((s: any) => <p key={s.status}>{s.status}: {s._count.status}</p>)}</Card>
    </div>;
  }

  if (session.user.role === Roles.TRAINING_OFFICER) {
    const pending = await prisma.practiceRecord.count({ where: { supervisorId: session.user.id, status: { in: ['PENDING', 'LATE_PENDING'] } } });
    const approvedToday = await prisma.practiceRecord.count({ where: { supervisorId: session.user.id, status: { in: ['APPROVED', 'LATE_APPROVED'] } } });
    const rejectedToday = await prisma.practiceRecord.count({ where: { supervisorId: session.user.id, status: 'REJECTED' } });
    return <div className="grid gap-4 md:grid-cols-3">
      <Card>Čeká na potvrzení: {pending}</Card><Card>Schváleno: {approvedToday}</Card><Card>Zamítnuto: {rejectedToday}</Card>
    </div>;
  }

  const totalTrainees = await prisma.user.count({ where: { role: Roles.TRAINEE } });
  const late = await prisma.practiceRecord.count({ where: { status: 'LATE_PENDING' } });
  const pending = await prisma.practiceRecord.count({ where: { status: { in: ['PENDING', 'LATE_PENDING'] } } });
  const sanctions = await prisma.excuseOrNote.count({ where: { type: 'SANCTION' } });

  return <div className="grid gap-4 md:grid-cols-4">
    <Card>Celkem trainee: {totalTrainees}</Card>
    <Card>Čekající schválení: {pending}</Card>
    <Card>Pozdní zápisy: {late}</Card>
    <Card>Sankce: {sanctions}</Card>
  </div>;
}
