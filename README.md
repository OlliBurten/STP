# Sveriges Transportplattform

Marknadsplats för yrkesförare i Sverige. Chaufförer söker jobb och företag publicerar annonser – direktkontakt utan bemanning.

## Utveckling (endast frontend)

```bash
npm install
npm run dev
```

Öppna http://localhost:5173. Inget backend – inloggning och data är mock (localStorage).

## Köra med backend (gå live)

### 1. Databas

Skapa en PostgreSQL-databas (t.ex. [Neon](https://neon.tech), [Supabase](https://supabase.com) eller lokalt).

### 2. Backend

```bash
cd server
cp .env.example .env
# Redigera .env: sätt DATABASE_URL, JWT_SECRET (lång slumpsträng), ADMIN_EMAILS, FRONTEND_URL
npm install
npx prisma generate
npx prisma db push
npm run db:seed   # valfritt: skapa testanvändare driver@example.com / company@example.com med lösenord "password123"
npm run dev
```

Backend körs på http://localhost:3001.

### 3. Frontend mot backend

Skapa `.env` i **projektets rot** (där package.json för frontend ligger):

```
VITE_API_URL=http://localhost:3001
```

Kör sedan frontend:

```bash
npm run dev
```

Öppna http://localhost:5173. Du kan nu registrera konto, logga in, publicera jobb och använda API:et.

**"Kunde inte nå servern":** Starta backend först (`cd server && npm run dev`). Sätt `FRONTEND_URL=http://localhost:5173` i `server/.env` (CORS).

## E2E-tester

Playwright-tester i `e2e/`. **Starta frontend (och vid behov backend) innan du kör testerna.**

```bash
npm run dev          # terminal 1
cd server && npm run dev   # terminal 2 (för auth-tester)
npm run e2e          # terminal 3
```

Endast Chromium: `npx playwright test --project=chromium`. Se [docs/E2E.md](docs/E2E.md) för manuell E2E-checklista och flöden.

## Företagsverifiering (grundskydd)

- Företag måste registrera `organisationsnummer`.
- Nya företagskonton får status `PENDING`.
- Endast `VERIFIED`-konton kan publicera jobb och kontakta förare.

### Status (live/demo/backend)

Som inloggad admin kan du öppna **Status** i headern (eller `/admin/status`) för att se om backend, live-sajt och demo-sajt svarar. För automatiska aviseringar vid driftstörning, sätt upp extern övervakning (t.ex. [UptimeRobot](https://uptimerobot.com)) mot `https://<backend>/api/health` och live-URL. Se [docs/STATUS-OCH-OVERVAKNING.md](docs/STATUS-OCH-OVERVAKNING.md).

### Admin: verifiera företag

Admin-endpoints kräver att du är inloggad med ett konto vars e-post finns i `ADMIN_EMAILS`.

```bash
# Lista väntande företag (med giltig Bearer-token från admin-login)
curl -H "Authorization: Bearer <ADMIN_JWT>" \
  http://localhost:3001/api/admin/companies/pending

# Verifiera företag
curl -X PATCH -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -d '{"status":"VERIFIED"}' \
  http://localhost:3001/api/admin/companies/<companyUserId>/status
```

## E-postverifiering och lösenordsreset

- Vid registrering skickas verifieringsmail **om backend har `RESEND_API_KEY` och `EMAIL_FROM` satta**. Annars skickas inget mail – se [docs/EPOST-VERIFIERING.md](docs/EPOST-VERIFIERING.md).
- Verifieringslänken pekar på samma sajt som användaren registrerade sig från (prod/demo).
- Verifieringslänk landar på: `/verifiera-email?token=...`
- Glömt lösenord finns i login-flödet och skickar återställningslänk till: `/aterstall-losenord?token=...`
- I utvecklingsläge loggas mailinnehåll i server-konsolen om ingen e-postleverantör är kopplad.

### 4. Produktion

- Sätt `DATABASE_URL`, `JWT_SECRET` och `ADMIN_EMAILS` i backend-miljön.
- Sätt `FRONTEND_URL` i backend till din frontend-URL (för CORS). För flera domäner (t.ex. preview + prod): `https://transportplattformen.se,https://drivermatch-xxx.vercel.app`.
- Bygg frontend med `VITE_API_URL` satt till din API-URL: `npm run build`.
- Hosta frontend (t.ex. Vercel, Netlify) och backend (t.ex. Railway, Render).

**Om inloggning ger "Kunde inte nå servern" / "Failed to fetch":**

- **Vercel:** Lägg till miljövariabeln `VITE_API_URL` med din backend-URL (t.ex. `https://din-app.railway.app`). Bygg om (ny deploy) så att frontend använder rätt API.
- **Backend (Railway etc.):** Sätt `FRONTEND_URL` till alla domäner som ska kunna anropa API:et, komma-separerade (t.ex. `https://transportplattformen.se,https://drivermatch-20260212-xxx.vercel.app`). Utan detta blockar CORS anrop från frontend.

**Admin-inloggning på produktion fungerar inte – checklista:**

1. **Backend-miljö (Railway/Render/etc.):** Sätt `ADMIN_EMAILS` till din admin-e-post, komma-separerat vid flera (t.ex. `oliverharburt@gmail.com`). Detta styr vem som får `isAdmin` efter inloggning.
2. **Användaren finns i prod-databasen:** Kontot måste skapas/registrerat mot **produktionens** databas (inte lokalt). Registrera dig på live-sidan eller kör seed/migration mot prod-DB om ni har ett admin-konto i seed.
3. **E-post verifierad:** Inloggning kräver `emailVerifiedAt`. Om kontot skapades manuellt eller via seed mot prod: kör mot prod-databasen `npm run db:verify-user -- din@epost.se` i `server/` (sätt `DATABASE_URL` till prod innan), eller sätt fältet i Prisma Studio.
4. **Lösenord:** Samma lösenord som du registrerade med på prod (eller som sattes i seed). Vid behov: använd "Glömt lösenord" på live-sidan om e-post är konfigurerad.

## Testmiljö och deploy (Vercel)

Du kan bygga och se uppdateringar **utan att påverka live** – live-sajten pausas inte.

### Snabb test-URL (preview)

Kör i projektroten:

```bash
npx vercel
```

- Du får en **preview-URL** (t.ex. `drivermatch-20260212-xxx.vercel.app`).
- Den är **separat från produktion** – live (transportplattformen.se) är orörd.
- Testa där tills du är nöjd, sedan pushar du till live med:

```bash
npx vercel --prod
```

### Översikt

| Kommando | Effekt |
|----------|--------|
| `npx vercel` | Deploy till **preview** (test-URL). Live påverkas inte. |
| `npx vercel --prod` | Deploy till **produktion** (transportplattformen.se m.fl.). |

Preview-använder samma bygg som produktion men har egen URL. Backend (Railway) är gemensam – preview-frontend anropar samma API som live.

## Demo-miljö (presentation för TYA, Transportföretagen m.fl.)

**Rekommendation:** Ha **ingen** demo-data på live. Använd en **separat demo-miljö** med egen databas och egen URL.

### Snabbsetup (redan skapat via CLI)

- **Demo-frontend:** https://transportplattform-demo.vercel.app (Vercel-projektet `transportplattform-demo`)
- **Demo-backend:** https://drivermatch-demo-production.up.railway.app (Railway-projektet `drivermatch-demo`)

**Det du behöver göra (en gång):**

1. **Neon:** Skapa en **ny branch** eller **nytt projekt** för demo (t.ex. "demo") i [Neon Console](https://console.neon.tech). Kopiera **connection string** (PostgreSQL-URL).
2. **Lokal terminal:** Kör från projektroten (ersätt med din URL):
   ```bash
   ./scripts/demo-db-setup.sh "postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
   ```
   Detta kör `prisma db push` och `db:seed:demo` mot demo-databasen.
3. **Sätt DATABASE_URL i Railway** så att demo-backend använder samma databas:
   ```bash
   cd server && railway link
   # Välj drivermatch-demo
   railway variables --set "DATABASE_URL=postgresql://user:pass@ep-xxx...?sslmode=require"
   ```
   Backend kommer att starta om automatiskt. Därefter är demo-miljön klar.

**Inloggning på demo:** alla användare har lösenord **`demo123`**. T.ex. `rekrytering@nordiclogistics.se` (företag) eller `erik.lindstrom@example.com` (förare).

### Varför separat demo?

- **Live** förblir ren (inga falska åkerier/förare) och redo för riktiga användare.
- **Demo** har rik, realistisk data så du kan visa hela flödet: jobb, ansökningar, konversationer, notiser.
- Ingen “kodlås” eller feature flag på produktion – mindre risk och enklare underhåll.

### Så här sätter du upp demo-miljön

1. **Ny databas** (t.ex. nytt Neon-/Supabase-projekt eller ny PostgreSQL på Railway) – använd **inte** produktionsdatabasen.
2. **Ny backend-instans** (valfritt):
   - Antingen: nytt Railway-projekt med samma kod men `DATABASE_URL` pekande på demo-databasen, **eller**
   - Kör backend lokalt mot demo-databasen när du ska presentera (t.ex. `cd server && DATABASE_URL=postgresql://... npm run dev`).
3. **Frontend mot demo-backend:**
   - Antingen: ny Vercel-projekt (t.ex. `stp-demo`) med `VITE_API_URL` = demo-backend-URL, **eller**
   - Subdomän (t.ex. `demo.transportplattformen.se`) som pekar på samma frontend men med `VITE_API_URL` för demo-backend.
4. **Fyll demo-databasen med demo-data:**
   ```bash
   cd server
   cp .env.example .env
   # Sätt .env: DATABASE_URL till demo-databasen, JWT_SECRET, FRONTEND_URL (demo-frontend-URL)
   npx prisma generate
   npx prisma db push
   npm run db:seed:demo
   ```
5. **Presentera** från demo-URL:en. Alla inloggningar använder lösenordet **`demo123`** (samma för alla demo-användare).

### Vad demo-seed innehåller

- **10 åkerier** (verifierade) i olika regioner med jobb.
- **18 förare** med profiler, körkort, certifikat (inkl. 3 gymnasieelever/LIA).
- **28 jobb** (fjärr, lokalt, distribution, tank, vikariat, tim, LIA).
- **Konversationer** mellan förare och åkerier, inkl. “utvalda” kandidater.
- **Sparade jobb** och **notiser**.

Exempel-inloggning efter seed: **`rekrytering@nordiclogistics.se`** (företag) eller **`erik.lindstrom@example.com`** (förare), lösenord **`demo123`**.

**OBS:** Kör `db:seed:demo` **endast** mot demo-databasen. I production krävs `DEMO_SEED=true` i miljön.

### Efter ny deploy – syns inte fler åkerier/förare?

Deploy uppdaterar bara **koden**; den kör inte seed. Databasen innehåller det som fanns när den senast seedades. För att demo ska visa **10 åkerier, 18 förare, 28 jobb** måste du köra demo-seed **en gång** mot demo-databasen:

1. Hämta **DATABASE_URL** från Railway: projektet **drivermatch-demo** → Variables → kopiera `DATABASE_URL`.
2. Kör lokalt (ersätt med din URL):
   ```bash
   cd server
   DATABASE_URL="postgresql://..." DEMO_SEED=true npm run db:seed:demo
   ```
   Detta **rensar** demo-DB och fyller den med 10 åkerier, 18 förare, 28 jobb m.m. Ladda om demo-sajten – då syns den nya datan.

### Alternativ: Git-branch för test

Om repot är kopplat till Vercel via Git:

- Push till t.ex. `staging` eller `develop` → Vercel skapar automatiskt en **preview-URL** för den branchen.
- `main` = produktion (eller den branch du satt som Production Branch i Vercel).
- Du kan alltså ha en permanent test-URL genom att jobba på en staging-branch och bara merga till main när du vill gå live.

## E2E-tester (Playwright)

E2E-tester körs mot en körande frontend (och för inloggningstester även backend).

### Kör endast smoke-tester (kräver bara frontend)

```bash
npm run dev   # i en terminal
npm run e2e -- e2e/smoke.spec.js   # i en annan
```

### Kör alla E2E-tester (kräver frontend + backend + seed)

1. Starta backend: `cd server && npm run dev`
2. Kör seed (sätter e-postverifiering för testanvändare): `cd server && npm run db:seed`
3. Starta frontend: `npm run dev` (i projektrot)
4. Kör tester: `npm run e2e`

Testanvändare (efter seed): `driver@example.com` / `company@example.com` med lösenord `password123`.

### Öppna Playwright UI (debug)

```bash
npm run e2e:ui
```

### Innan ni pushar live

Kör både API-tester och E2E:

```bash
cd server && npm run test          # API-tester
cd .. && npm run e2e               # E2E (starta server + frontend först)
```

## Juridik

- [Användarvillkor](/anvandarvillkor)
- [Integritetspolicy](/integritet)

## Teknik

- **Frontend:** React, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express, Prisma, PostgreSQL, JWT (bcryptjs, jsonwebtoken)
