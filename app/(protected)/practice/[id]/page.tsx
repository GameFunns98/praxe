import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { formatMinutes } from '@/lib/utils';

export default async function PracticeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireSession();
  const record = await prisma.practiceRecord.findUnique({ where: { id }, include: { trainee: true, supervisor: true, } });
  if (!record) notFound();
  const req = await prisma.practiceRequirement.findUnique({ where: { userId: record.traineeId } });

  return <article className="max-w-2xl space-y-2 rounded border bg-white p-6">
    <h1 className="text-xl font-semibold">Zápis praxe - {record.trainee.fullName}</h1>
    <p>Datum a čas počátku praxe: {record.startAt.toLocaleString('cs-CZ', { timeZone: 'Europe/Prague', hour12: false })}</p>
    <p>Datum a čas ukončení praxe: {record.endAt.toLocaleString('cs-CZ', { timeZone: 'Europe/Prague', hour12: false })}</p>
    <p>Jméno a volačka dohlížejícího důstojníka: {record.supervisor.fullName} ({record.supervisor.callsign})</p>
    <p>Zbývající čas praxí: {formatMinutes(req?.remainingMinutes ?? 0)}</p>
    <p>Podpis: {record.traineeSignature}</p>
    <h2 className="pt-4 text-lg font-semibold">Potvrzení Praxe - {record.supervisor.fullName}</h2>
    <p>Podpis Dohlížejícího Důstojníka: {record.supervisorSignature ?? '-'}</p>
    <p>Status: {record.status}</p>
  </article>;
}
