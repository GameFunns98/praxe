import { Roles } from '@/lib/auth/roles';
import { requireSession } from '@/lib/auth/session';
import { getDiscordHealthStatus, getDiscordSettings, getGuildChannels, getSharedGuildsForAdmin } from '@/lib/services/discord';
import { saveDiscordSettingsAction, sendDiscordTestAction } from './actions';

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireSession();
  const params = await searchParams;
  const selectedGuildId = typeof params.guildId === 'string' ? params.guildId : '';

  if (session.user.role !== Roles.ADMIN) return <p>Přístup pouze pro admin.</p>;

  const settings = await getDiscordSettings();
  const health = await getDiscordHealthStatus();
  const guilds = session.user.discordAccessToken ? await getSharedGuildsForAdmin(session.user.discordAccessToken) : [];
  const activeGuildId = selectedGuildId || settings?.guildId || guilds[0]?.id || '';
  const channels = activeGuildId ? await getGuildChannels(activeGuildId) : [];
  const selectedGuild = guilds.find((g) => g.id === activeGuildId);

  return <div className="space-y-4">
    <header>
      <p className="text-sm text-slate-500">Nastavení systému</p>
      <h1 className="text-2xl font-semibold">Discord bot konfigurace</h1>
    </header>

    <section className="max-w-3xl space-y-3 rounded-xl border bg-white p-4">
      <h2 className="font-semibold">Guild a notifikační kanály</h2>
      {!session.user.discordAccessToken && <p className="text-sm text-amber-700">Pro výběr guild je potřeba přihlášení přes Discord.</p>}

      <form method="GET" className="space-y-2">
        <label className="text-sm">Vyberte server (guild), kde je bot nainstalován</label>
        <select name="guildId" defaultValue={activeGuildId} className="w-full rounded border px-3 py-2">
          {guilds.map((guild) => <option key={guild.id} value={guild.id}>{guild.name}</option>)}
        </select>
        <button className="rounded border px-3 py-1">Načíst kanály</button>
      </form>

      <form action={saveDiscordSettingsAction} className="space-y-2">
        <input type="hidden" name="guildId" value={activeGuildId} />
        <input type="hidden" name="guildName" value={selectedGuild?.name ?? settings?.guildName ?? ''} />

        <div>
          <label className="text-sm">Kanál pro schválení</label>
          <select name="approvalChannelId" defaultValue={settings?.approvalChannelId ?? ''} className="w-full rounded border px-3 py-2">
            <option value="">-- vyberte --</option>
            {channels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm">Kanál pro zamítnutí</label>
          <select name="rejectionChannelId" defaultValue={settings?.rejectionChannelId ?? ''} className="w-full rounded border px-3 py-2">
            <option value="">-- vyberte --</option>
            {channels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
          </select>
        </div>

        <button className="rounded border px-3 py-1">Uložit Discord nastavení</button>
      </form>

      <form action={sendDiscordTestAction}>
        <button className="rounded border px-3 py-1">Odeslat test notifikace</button>
      </form>
    </section>


    <section className="max-w-3xl space-y-2 rounded-xl border bg-white p-4">
      <h2 className="font-semibold">Stav Discord integrace</h2>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className={`rounded-full px-3 py-1 ${health.primaryReady ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
          Primární bot: {health.primaryReady ? 'Připraveno' : 'Nekompletní'}
        </span>
        <span className={`rounded-full px-3 py-1 ${health.fallbackReady ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}`}>
          Webhook fallback: {health.fallbackReady ? 'Připraveno' : 'Nenastaveno'}
        </span>
      </div>
      <ul className="grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
        <li>Bot token: {health.hasBotToken ? '✅ OK' : '⚠️ chybí'}</li>
        <li>Guild: {health.hasGuild ? '✅ OK' : '⚠️ chybí'}</li>
        <li>Approval channel: {health.hasApprovalChannel ? '✅ OK' : '⚠️ chybí'}</li>
        <li>Rejection channel: {health.hasRejectionChannel ? '✅ OK' : '⚠️ chybí'}</li>
      </ul>
    </section>

    <section className="max-w-3xl space-y-2 rounded-xl border bg-white p-4">
      <h2 className="font-semibold">Webhook fallback</h2>
      <p>Webhook (`DISCORD_WEBHOOK_URL`) zůstává pouze jako fallback, pokud není dostupná bot konfigurace nebo odeslání botem selže.</p>
    </section>
  </div>;
}
