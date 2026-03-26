import Link from 'next/link';
import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { Roles, type Role } from '@/lib/auth/roles';
import { approvePracticeRecord, rejectPracticeRecord } from './actions';

export default async function PracticeListPage() {
  const session = await requireSession();
  const where = session.user.role === Roles.TRAINEE ? { traineeId: session.user.id } : session.user.role === Roles.TRAINING_OFFICER ? { supervisorId: session.user.id } : {};
  const records = await prisma.practiceRecord.findMany({ where, include: { trainee: true, supervisor: true }, orderBy: { createdAt: 'desc' } });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Záznamy praxe</h1>
      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-sm">
          <thead><tr className="border-b"><th className="p-2 text-left">Trainee</th><th>Supervisor</th><th>Status</th><th>Délka</th><th /></tr></thead>
          <tbody>
            {records.map((r: any) => <tr key={r.id} className="border-b">
              <td className="p-2">{r.trainee.fullName}</td><td>{r.supervisor.fullName}</td><td>{r.status}</td><td>{r.durationMinutes} min</td>
              <td className="space-x-2 p-2">
                <Link href={`/practice/${r.id}`} className="rounded border px-2 py-1">Detail</Link>
                {(session.user.role === Roles.ADMIN || (session.user.role === Roles.TRAINING_OFFICER && r.supervisorId === session.user.id)) && (r.status === 'PENDING' || r.status === 'LATE_PENDING') && (
                  <>
                    <form action={approvePracticeRecord} className="inline-flex gap-1">
                      <input type="hidden" name="id" value={r.id} />
                      <input name="supervisorSignature" placeholder="Podpis" className="rounded border px-1" required />
                      <button className="rounded bg-emerald-600 px-2 py-1 text-white">Schválit</button>
                    </form>
                    <form action={rejectPracticeRecord} className="inline-flex gap-1">
                      <input type="hidden" name="id" value={r.id} />
                      <input name="supervisorComment" placeholder="Důvod" className="rounded border px-1" required />
                      <button className="rounded bg-red-600 px-2 py-1 text-white">Zamítnout</button>
                    </form>
                  </>
                )}
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
