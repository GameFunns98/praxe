export default function SettingsPage() {
  return <div className="space-y-4">
    <header>
      <p className="text-sm text-slate-500">Nastavení systému</p>
      <h1 className="text-2xl font-semibold">Pravidla a integrace</h1>
    </header>

    <section className="max-w-3xl space-y-2 rounded-xl border bg-white p-4">
      <h2 className="font-semibold">Pravidla praxí</h2>
      <p>Praxi je nutné zapsat do 1 hodiny po službě.</p>
      <p>Praxe lze vykonávat pouze s Training Officer.</p>
      <p>Každý nový člen má 15 hodin praxí.</p>
      <p>Negativní zbývající čas není povolen — systém odečte maximálně dostupný čas.</p>
    </section>

    <section className="max-w-3xl space-y-2 rounded-xl border bg-white p-4">
      <h2 className="font-semibold">Nápověda: Discord webhook</h2>
      <p>Pro zasílání notifikací po schválení nebo zamítnutí nastavte proměnnou prostředí <code>DISCORD_WEBHOOK_URL</code>.</p>
      <p>Webhook musí být platná URL z Discord kanálu (Nastavení kanálu → Integrace → Webhooky).</p>
      <p>Pokud proměnná není nastavena, schvalování a zamítání funguje dál bez přerušení. Událost se pouze neodešle na Discord.</p>
    </section>
  </div>;
}
