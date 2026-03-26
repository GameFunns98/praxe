import { notFound } from 'next/navigation';
import { Roles } from '@/lib/auth/roles';
import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import {
  adjustPracticeRequirement,
  approvePendingUser,
  disconnectDiscordAccount,
  forcePasswordResetNextLogin,
  setTemporaryPassword,
  setUserActive,
  updateUserRole
} from '../actions';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session.user.role !== Roles.ADMIN) return <p>Přístup pouze pro admin.</p>;

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, include: { practiceRequirement: true } });
  if (!user) notFound();

  const audit = await prisma.auditLog.findMany({ where: { entityId: id, entityType: { in: ['User', 'PracticeRequirement'] } }, orderBy: { createdAt: 'desc' }, take: 25 });

  return <div className="space-y-4">
    <h1 className="text-2xl font-semibold">Detail uživatele</h1>
    <section className="rounded border bg-white p-4 grid gap-1">
      <div className="flex items-center gap-3">
        {user.discordAvatar ? <img src={user.discordAvatar} alt={user.fullName} className="h-12 w-12 rounded-full" /> : <div className="h-12 w-12 rounded-full bg-slate-200" />}
        <div>
          <p className="font-semibold">{user.fullName}</p>
          <p className="text-sm text-slate-600">{user.email}</p>
        </div>
      </div>
      <p>Role: <strong>{user.role}</strong></p>
      <p>Auth provider: <span className="rounded bg-slate-100 px-2 py-1 text-xs">{user.authProvider}</span></p>
      <p>Discord: {user.discordUserId ? `Propojeno (${user.discordUsername ?? user.discordGlobalName})` : 'Nepropojeno'}</p>
      <p>Poslední přihlášení: {user.lastLoginAt ? user.lastLoginAt.toLocaleString('cs-CZ') : 'Nikdy'}</p>
    </section>

    <section className="rounded border bg-white p-4 grid gap-3 md:grid-cols-2">
      <form action={updateUserRole} className="space-y-2">
        <input type="hidden" name="userId" value={user.id} />
        <p className="font-medium">Změna role</p>
        <select name="role" defaultValue={user.role} className="w-full rounded border px-2 py-1">
          <option value="ADMIN">ADMIN</option>
          <option value="COMMAND_STAFF">COMMAND_STAFF</option>
          <option value="TRAINING_OFFICER">TRAINING_OFFICER</option>
          <option value="TRAINEE">TRAINEE</option>
        </select>
        <button className="rounded border px-3 py-1">Uložit roli</button>
      </form>

      <form action={setUserActive} className="space-y-2">
        <input type="hidden" name="userId" value={user.id} />
        <input type="hidden" name="active" value={String(!user.active)} />
        <p className="font-medium">Stav účtu</p>
        <button className="rounded border px-3 py-1">{user.active ? 'Deaktivovat účet' : 'Aktivovat účet'}</button>
      </form>

      {!user.active && <form action={approvePendingUser} className="space-y-2">
        <input type="hidden" name="userId" value={user.id} />
        <p className="font-medium">Rychlé schválení pending účtu</p>
        <select name="role" defaultValue={user.role} className="w-full rounded border px-2 py-1">
          <option value="TRAINEE">TRAINEE</option>
          <option value="TRAINING_OFFICER">TRAINING_OFFICER</option>
          <option value="COMMAND_STAFF">COMMAND_STAFF</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <button className="rounded border px-3 py-1">Aktivovat + nastavit roli</button>
      </form>}

      <form action={setTemporaryPassword} className="space-y-2">
        <input type="hidden" name="userId" value={user.id} />
        <p className="font-medium">Dočasné heslo</p>
        <input name="tempPassword" minLength={8} required className="w-full rounded border px-2 py-1" placeholder="Nové dočasné heslo" />
        <button className="rounded border px-3 py-1">Nastavit dočasné heslo</button>
      </form>

      <form action={forcePasswordResetNextLogin} className="space-y-2">
        <input type="hidden" name="userId" value={user.id} />
        <input type="hidden" name="forcePasswordReset" value={String(!user.forcePasswordReset)} />
        <p className="font-medium">Force reset hesla</p>
        <button className="rounded border px-3 py-1">{user.forcePasswordReset ? 'Zrušit force reset' : 'Vynutit reset při dalším loginu'}</button>
      </form>

      <form action={disconnectDiscordAccount} className="space-y-2">
        <input type="hidden" name="userId" value={user.id} />
        <p className="font-medium">Discord link</p>
        <button disabled={!user.discordUserId} className="rounded border px-3 py-1 disabled:opacity-40">Odpojit Discord účet</button>
      </form>

      {user.practiceRequirement && <form action={adjustPracticeRequirement} className="space-y-2">
        <input type="hidden" name="userId" value={user.id} />
        <p className="font-medium">Manuální úprava praxí</p>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" name="requiredMinutes" defaultValue={user.practiceRequirement.requiredMinutes} className="rounded border px-2 py-1" />
          <input type="number" name="remainingMinutes" defaultValue={user.practiceRequirement.remainingMinutes} className="rounded border px-2 py-1" />
        </div>
        <input name="reason" required className="w-full rounded border px-2 py-1" placeholder="Důvod změny" />
        <button className="rounded border px-3 py-1">Uložit úpravu</button>
      </form>}
    </section>

    <section className="rounded border bg-white p-4">
      <h2 className="mb-2 text-lg font-semibold">Audit log (uživatel)</h2>
      <div className="space-y-2 text-sm">
        {audit.map((entry) => (
          <div key={entry.id} className="rounded border p-2">
            <p><strong>{entry.action}</strong> · {entry.createdAt.toLocaleString('cs-CZ')}</p>
            <p className="text-xs text-slate-600">before: {entry.beforeJson ? JSON.stringify(entry.beforeJson) : '-'}</p>
            <p className="text-xs text-slate-600">after: {entry.afterJson ? JSON.stringify(entry.afterJson) : '-'}</p>
          </div>
        ))}
      </div>
    </section>
  </div>;
}
