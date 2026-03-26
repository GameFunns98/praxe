import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  await requireSession();
  const rows = await prisma.practiceRecord.findMany({ include: { trainee: true, supervisor: true }, orderBy: { createdAt: 'desc' } });
  const header = 'id,trainee,supervisor,status,durationMinutes,submittedAt';
  const csv = [header, ...rows.map((r: any) => `${r.id},${r.trainee.fullName},${r.supervisor.fullName},${r.status},${r.durationMinutes},${r.submittedAt.toISOString()}`)].join('\n');
  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="report.csv"' } });
}
