# Systém zápisu praxí

## Project overview
Produkční webová aplikace (Next.js + PostgreSQL) pro evidenci EMS praxí, schvalování Training Officerem, administrativní správu uživatelů, auditní log a Discord notifikace (primárně přes bota).

## Tech stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- NextAuth (Discord OAuth + local superadmin fallback)
- Prisma ORM + PostgreSQL
- Zod validace
- Vitest testy

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

## Environment variables
```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
DEMO_PASSWORD=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_BOT_TOKEN=
DISCORD_REDIRECT_URI=
DISCORD_WEBHOOK_URL=   # optional fallback only
RESEND_API_KEY=
PASSWORD_RESET_FROM_EMAIL=
```

## Authentication architecture
- **Primární login:** Discord OAuth (`Přihlásit se přes Discord`).
- **Fallback login:** lokální credentials pouze pro `isSuperadmin=true` účet.
- První Discord login:
  - pokud existuje účet se stejným `discordUserId`, použije se,
  - jinak se zkusí link podle emailu,
  - pokud účet neexistuje, vytvoří se neaktivní pending uživatel (čeká na aktivaci adminem).

## Admin user management
V `/users` a `/users/:id` je admin-only správa:
- výpis uživatelů + hledání + filtry role/aktivita
- detail uživatele
- změna role
- aktivace/deaktivace
- dočasné heslo
- force password reset
- odpojení Discord účtu
- manuální úprava `requiredMinutes`/`remainingMinutes` s důvodem
- auditní stopa všech změn

## Discord bot notifications
### Primární režim (bot)
1. Přihlaste se jako admin přes Discord.
2. Otevřete `/settings`.
3. Vyberte guild, kde je bot nainstalovaný.
4. Vyberte kanál pro schválení a kanál pro zamítnutí.
5. Uložte a odešlete test zprávu.

### Fallback režim (webhook)
Pokud není uložená bot konfigurace nebo odeslání botem selže, aplikace se pokusí odeslat zprávu na `DISCORD_WEBHOOK_URL`.

## Discord app + bot setup
1. Otevřete Discord Developer Portal.
2. Vytvořte aplikaci a OAuth2 credentials.
3. Nastavte redirect URI na `DISCORD_REDIRECT_URI` (např. `http://localhost:3000/api/auth/callback/discord`).
4. Vytvořte bota v sekci **Bot** a zkopírujte token do `DISCORD_BOT_TOKEN`.
5. Pozvěte bota na cílové servery s oprávněním číst kanály a posílat zprávy.
6. Restartujte aplikaci.

## Migrations + seed
- Vždy commitujte `prisma/schema.prisma` a `prisma/migrations/*`.
- Seed vytváří 1 lokálního superadmina a ostatní uživatele s `DISCORD` auth providerem.


## Password reset email
- Pokud jsou nastavené `RESEND_API_KEY` a `PASSWORD_RESET_FROM_EMAIL`, reset link se odešle emailem přes Resend.
- Pokud env chybí, aplikace bezpečně fallbackne na server log (pro dev/test).
