import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { Roles, type Role } from '@/lib/auth/roles';
import { redirect } from 'next/navigation';
import { createPracticeRecord } from '../actions';

export default async function NewPracticePage() {
  const session = await requireSession();
  if (session.user.role !== Roles.TRAINEE) redirect('/practice');

  const officers = await prisma.user.findMany({ where: { role: Roles.TRAINING_OFFICER, active: true } });
  const requirement = await prisma.practiceRequirement.findUnique({ where: { userId: session.user.id } });

  return <div className="max-w-2xl rounded border bg-white p-4">
    <h1 className="mb-4 text-xl font-semibold">Zápis praxe - {session.user.name}</h1>
    <p className="mb-2 text-sm">Zbývající čas praxí: {requirement?.remainingMinutes ?? 0} min</p>
    <form action={createPracticeRecord} className="space-y-3">
      <div><label>Datum a čas počátku praxe</label><input type="datetime-local" name="startAt" className="w-full rounded border p-2" required /></div>
      <div><label>Datum a čas ukončení praxe</label><input type="datetime-local" name="endAt" className="w-full rounded border p-2" required /></div>
      <div><label>Jméno a volačka dohlížejícího důstojníka</label><select name="supervisorId" className="w-full rounded border p-2" required>{officers.map((o: any)=><option key={o.id} value={o.id}>{o.fullName} ({o.callsign})</option>)}</select></div>
      <div><label>Podpis</label><input name="traineeSignature" className="w-full rounded border p-2" required /></div>
      <button className="rounded bg-primary px-4 py-2 text-white">Uložit zápis</button>
    </form>
  </div>;
}
