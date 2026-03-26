# Systém zápisu praxí

## Project overview
Produkční webová aplikace (Next.js + PostgreSQL) pro evidenci EMS praxí, schvalování Training Officerem, administrativní správu, poznámky/sankce a auditní log.

## Tech stack
- Next.js (App Router) + TypeScript
- Tailwind CSS + komponenty ve stylu shadcn/ui
- NextAuth (credentials)
- Prisma ORM + PostgreSQL
- Zod validace
- Vitest testy
- Vercel kompatibilní server actions + route handlers

## Local development setup
```bash
git clone <your-repo-url>
cd praxe
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```
Aplikace běží na `http://localhost:3000`.

## Database setup
1. Vytvořte PostgreSQL databázi (lokálně nebo cloud).
2. Nastavte `DATABASE_URL` v `.env`.
3. Spusťte migrace: `npm run prisma:migrate`.
4. Pro produkci (CI/Vercel): `npm run prisma:deploy`.

## Prisma migration workflow
- Lokální změna schématu:
  1. Upravte `prisma/schema.prisma`.
  2. `npx prisma migrate dev --name <nazev>`.
  3. Commitněte `prisma/migrations/*` + schema.
- Produkce (Vercel DB):
  - spusťte `npm run prisma:deploy` proti produkční `DATABASE_URL` (doporučeně CI job nebo jednorázově lokálně).

## Seed data setup
```bash
npm run prisma:seed
```
Seed vytvoří:
- 1 admin
- 2 training officers
- 5 trainees
- ukázkové záznamy v různých stavech

## Authentication setup
Použit je NextAuth credentials provider.
- Hesla jsou hashována přes bcrypt.
- Povinné proměnné: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL`.
- Chráněné route jsou zabezpečené middleware + server-side permission check.

## Vercel deployment guide (krok za krokem)
1. **Vytvoření Git repozitáře**
   ```bash
   git init
   git add .
   git commit -m "Initial EMS praxe app"
   git branch -M main
   git remote add origin <github-repo-url>
   git push -u origin main
   ```
2. **Soubory, které musí být commitnuté před deploy**
   - `app/`, `components/`, `lib/`
   - `prisma/schema.prisma`
   - `prisma/migrations/`
   - `prisma/seed.ts`
   - `package.json`, `README.md`, `.env.example`
3. **Import repo do Vercel**
   - Vercel dashboard → Add New… → Project → Import Git Repository.
4. **Framework detekce**
   - Vercel musí detekovat **Next.js** automaticky.
5. **Build settings kontrola**
   - Build Command: `npm run build`
   - Install Command: `npm install`
   - Output: `.next` (automaticky)
6. **Environment variables ve Vercel (Production + Preview + Development)**
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (pro Production např. `https://<project>.vercel.app`)
   - `DEMO_PASSWORD` (volitelné)
7. **Přidání proměnných podle prostředí**
   - Production: produkční DB URL a produkční URL aplikace
   - Preview: preview DB nebo oddělené schema
   - Development: lokální/dev DB
8. **Napojení PostgreSQL**
   - Použijte Vercel Postgres / Neon / Supabase / Railway.
   - Zkopírujte connection string do `DATABASE_URL`.
9. **Prisma migrace v produkci**
   - Po prvním deploy spusťte proti produkční DB:
     ```bash
     DATABASE_URL="..." npm run prisma:deploy
     ```
10. **Redeploy po změně env proměnných**
   - Vercel → Project → Deployments → poslední deployment → Redeploy.
11. **Ověření po deploy**
   - Otevřete URL
   - Přihlaste se demo účtem
   - Vytvořte nový záznam praxe
   - Ověřte zápis v tabulce a dashboardu
12. **Custom domain**
   - Vercel → Project → Settings → Domains → Add Domain → potvrdit DNS záznamy.
13. **Časté chyby a řešení**
   - `P1001/P1000`: špatná `DATABASE_URL` nebo firewall
   - `NEXTAUTH_URL` mismatch: nastavte správnou URL pro environment
   - `prisma generate` fail: ověřte, že proběhl `postinstall`
   - `relation does not exist`: nebyla spuštěna `prisma migrate deploy`

## Exact Vercel click path
1. Otevřete Vercel Dashboard.
2. Klikněte na **Add New…**.
3. Klikněte na **Project**.
4. Vyberte Git provider a repozitář.
5. Klikněte na **Import**.
6. Na stránce konfigurace zkontrolujte, že framework je **Next.js**.
7. Rozbalte **Environment Variables**.
8. Klikněte **Add** a přidejte `DATABASE_URL`.
9. Klikněte **Add** a přidejte `NEXTAUTH_SECRET`.
10. Klikněte **Add** a přidejte `NEXTAUTH_URL`.
11. U každé proměnné zaškrtněte **Production**, **Preview**, **Development**.
12. Klikněte **Deploy**.
13. Po deploy otevřete projekt → **Settings** → **Environment Variables** pro případné úpravy.
14. Po změně env jděte na **Deployments** → poslední build → **Redeploy**.

## Environment variables explanation
- `DATABASE_URL`: PostgreSQL připojení (povinné).
- `NEXTAUTH_SECRET`: tajný klíč pro session/JWT (povinné).
- `NEXTAUTH_URL`: veřejná URL aplikace (doporučeno/povinné pro produkci).
- `DEMO_PASSWORD`: default heslo pro seed účty.

## Troubleshooting
- Nefunguje login: ověřte, že seed běžel a `NEXTAUTH_SECRET` je nastavené.
- 500 na dashboardu: ověřte dostupnost DB a migrace.
- Build fail na Vercel: zkontrolujte Node verzi a úplnost `package.json` scriptů.

## Demo accounts
- admin@ems.local (ADMIN)
- to1@ems.local (TRAINING_OFFICER)
- to2@ems.local (TRAINING_OFFICER)
- command@ems.local (COMMAND_STAFF)
- trainee1@ems.local až trainee5@ems.local (TRAINEE)
- Výchozí heslo: `Demo1234!`

## Discord notifikace (schválení / zamítnutí)
Aplikace podporuje server-side odesílání webhook notifikací do Discordu po schválení nebo zamítnutí praxe.

### Nastavení
1. Na Discord kanálu vytvořte webhook: **Nastavení kanálu → Integrace → Webhooky**.
2. Přidejte URL do `.env`:
   ```env
   DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
   ```
3. Restartujte aplikaci.

### Chování při chybě
- Pokud `DISCORD_WEBHOOK_URL` není nastavené, systém notifikaci přeskočí a schvalovací flow pokračuje bez chyby.
- Úspěch/chyba odeslání se zapisuje do server logu.

### Struktura zpráv
- **Schválení:** trainee, dohlížející, začátek/konec, délka, zbývající praxe, finální status, podpis dohlížejícího.
- **Zamítnutí:** trainee, dohlížející, začátek/konec, délka, finální status, důvod zamítnutí.
