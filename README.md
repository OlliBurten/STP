# DriverMatch

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

## Företagsverifiering (grundskydd)

- Företag måste registrera `organisationsnummer`.
- Nya företagskonton får status `PENDING`.
- Endast `VERIFIED`-konton kan publicera jobb och kontakta förare.

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

- Vid registrering skickas verifieringsmail automatiskt.
- Verifieringslänk landar på: `/verifiera-email?token=...`
- Glömt lösenord finns i login-flödet och skickar återställningslänk till: `/aterstall-losenord?token=...`
- I utvecklingsläge loggas mailinnehåll i server-konsolen om ingen e-postleverantör är kopplad.

### 4. Produktion

- Sätt `DATABASE_URL`, `JWT_SECRET` och `ADMIN_EMAILS` i backend-miljön.
- Sätt `FRONTEND_URL` i backend till din frontend-URL (för CORS).
- Bygg frontend med `VITE_API_URL` satt till din API-URL: `npm run build`.
- Hosta frontend (t.ex. Vercel, Netlify) och backend (t.ex. Railway, Render).

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
