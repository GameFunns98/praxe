import { notFound } from 'next/navigation';
import { Roles } from '@/lib/auth/roles';
import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import {
  adjustPracticeRequirement,
  approvePendingUser,
  disconnectDiscordAccount,
  forcePasswordResetNextLogin,
  sendResetLinkToUser,
  setTemporaryPassword,
  setUserActive,
  updateUserProfile,
  updateUserRole
} from '../actions';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session.user.role !== Roles.ADMIN) return <p>Přístup pouze pro admin.</p>;

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, include: { practiceRequirement: true } });
  if (!user) notFound();

  const audit = await prisma.auditLog.findMany({ where: { entityId: id, entityType: { in: ['User', 'PracticeRequirement'] } }, orderBy: { createdAt: 'desc' }, take: 25 });

  return <div className="space-y-5">
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        {user.discordAvatar ? <img src={user.discordAvatar} alt={user.fullName} className="h-16 w-16 rounded-full border" /> : <div className="h-16 w-16 rounded-full bg-slate-200" />}
        <div>
          <h1 className="text-2xl font-semibold">{user.fullName}</h1>
          <p className="text-sm text-slate-600">{user.email}</p>
          <div className="mt-1 flex gap-2 text-xs">
            <span className="rounded bg-slate-100 px-2 py-1">{user.role}</span>
            <span className="rounded bg-slate-100 px-2 py-1">{user.authProvider}</span>
            <span className={`rounded px-2 py-1 ${user.active ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{user.active ? 'AKTIVNÍ' : 'NEAKTIVNÍ'}</span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">Discord: {user.discordUserId ? `Propojeno (${user.discordUsername ?? user.discordGlobalName})` : 'Nepropojeno'} · Poslední přihlášení: {user.lastLoginAt ? user.lastLoginAt.toLocaleString('cs-CZ') : 'Nikdy'}</p>
    </section>

    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Editace profilu uživatele (admin)</h2>
      <form action={updateUserProfile} className="grid gap-3 md:grid-cols-2">
        <input type="hidden" name="userId" value={user.id} />
        <label className="text-sm">Jméno<input name="fullName" defaultValue={user.fullName} className="mt-1 w-full rounded border px-2 py-1" /></label>
        <label className="text-sm">Callsign<input name="callsign" defaultValue={user.callsign} className="mt-1 w-full rounded border px-2 py-1" /></label>
        <label className="text-sm">Hodnost<input name="rankTitle" defaultValue={user.rankTitle} className="mt-1 w-full rounded border px-2 py-1" /></label>
        <label className="text-sm">Email<input name="email" type="email" defaultValue={user.email} className="mt-1 w-full rounded border px-2 py-1" /></label>
        <label className="text-sm">Role
          <select name="role" defaultValue={user.role} className="mt-1 w-full rounded border px-2 py-1">
            <option value="ADMIN">ADMIN</option>
            <option value="COMMAND_STAFF">COMMAND_STAFF</option>
            <option value="TRAINING_OFFICER">TRAINING_OFFICER</option>
            <option value="TRAINEE">TRAINEE</option>
          </select>
        </label>
        <label className="text-sm">Auth provider
          <select name="authProvider" defaultValue={user.authProvider} className="mt-1 w-full rounded border px-2 py-1">
            <option value="LOCAL">LOCAL</option>
            <option value="DISCORD">DISCORD</option>
            <option value="HYBRID">HYBRID</option>
          </select>
        </label>
        <label className="text-sm">Discord username<input name="discordUsername" defaultValue={user.discordUsername ?? ''} className="mt-1 w-full rounded border px-2 py-1" /></label>
        <label className="text-sm">Discord global name<input name="discordGlobalName" defaultValue={user.discordGlobalName ?? ''} className="mt-1 w-full rounded border px-2 py-1" /></label>
        <label className="text-sm">Aktivní
          <select name="active" defaultValue={String(user.active)} className="mt-1 w-full rounded border px-2 py-1">
            <option value="true">Ano</option>
            <option value="false">Ne</option>
          </select>
        </label>
        <div className="md:col-span-2"><button className="rounded border px-3 py-1">Uložit profil</button></div>
      </form>
    </section>

    <section className="rounded-xl border bg-white p-5 shadow-sm grid gap-3 md:grid-cols-2">
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

      <form action={updateUserRole} className="space-y-2">
        <input type="hidden" name="userId" value={user.id} />
        <p className="font-medium">Změna role (quick action)</p>
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

      <form action={setTemporaryPassword} className="space-y-2">
        <input type="hidden" name="userId" value={user.id} />
        <p className="font-medium">Dočasné heslo</p>
        <input name="tempPassword" minLength={8} required className="w-full rounded border px-2 py-1" placeholder="Nové dočasné heslo" />
        <button className="rounded border px-3 py-1">Nastavit dočasné heslo</button>
      </form>

      <form action={sendResetLinkToUser} className="space-y-2">
        <input type="hidden" name="userId" value={user.id} />
        <p className="font-medium">Reset link emailem</p>
        <button className="rounded border px-3 py-1">Poslat reset link</button>
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

      {user.practiceRequirement && <form action={adjustPracticeRequirement} className="space-y-2 md:col-span-2">
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

    <section className="rounded-xl border bg-white p-4 shadow-sm">
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
