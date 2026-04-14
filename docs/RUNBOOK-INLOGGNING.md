# Runbook: Inloggning fungerar inte (prod / demo)

## E-postverifiering fungerar inte

- Kolla **Admin → Status**: raden **"E-post (verifiering)"** ska vara grön. Är den röd är `RESEND_API_KEY` inte satt på backend – användare får då inga verifieringsmail. Sätt nyckeln (och `EMAIL_FROM`) enligt [docs/EPOST-VERIFIERING.md](EPOST-VERIFIERING.md). Efter deploy eller om variabler raderats kan det här sluta fungera utan att du märker det – kolla Status-sidan regelbundet.

---

## Vad har troligen hänt?

- **Databasen återställdes eller ny migrering** → användare finns kvar men `emailVerifiedAt` kan vara null (t.ex. backup från före verifiering), eller användaren finns inte alls.
- **Ny backend-deploy eller ny miljö** → `ADMIN_EMAILS` eller `FRONTEND_URL` sattes inte, så antingen får du inte admin-rättigheter eller CORS blockar anrop.
- **Frontend pekar på fel API** → `VITE_API_URL` fel eller inte satt vid build, så klick på "Logga in" når inte rätt server.

Det här är **inte** något som "bara började strula" – det brukar koppla till deploy, DB-restore eller miljövariabler.

---

## Säkerhetsåtgärd som redan finns

- **Admin-konton** (e-post i `ADMIN_EMAILS` på backend) kan alltid logga in även om `emailVerifiedAt` är null. Vid första inloggning sätts `emailVerifiedAt` automatiskt så att du inte låses ute.
- Vanliga användare måste fortfarande verifiera e-post innan de kan logga in.

---

## Checklista när inloggning inte fungerar

### 1. Backend-miljö (Railway/Render/etc.)

- [ ] `ADMIN_EMAILS` är satt (kommaseparerat, t.ex. `oliver@transportplattformen.se`). Annars får ingen admin-rättigheter.
- [ ] `FRONTEND_URL` innehåller prod-/demo-URL (kommaseparerat vid flera). Annars kan CORS blockera.
- [ ] `DATABASE_URL` pekar på rätt databas (samma som användarna skapades mot).

### 2. Frontend (Vercel etc.)

- [ ] `VITE_API_URL` är satt till backend-URL och bygget gjordes **efter** att variabeln lades till (rebuild krävs).

### 3. Användaren i databasen

- [ ] Kontot finns (samma e-post som du loggar in med).
- [ ] För vanliga användare: `emailVerifiedAt` ska vara satt (annars: klicka verifieringslänk eller kör `npm run db:verify-user -- <epost>` mot rätt DB).

### 4. Efter DB-återställning / ny prod-DB

- [ ] Kör seed mot prod så att test-/admin-konton finns:  
  `DATABASE_URL="<prod-url>" ALLOW_SEED_PRODUCTION=true npm run db:seed` (i `server/`).
- [ ] Säkerställ att `ADMIN_EMAILS` är satt på den backend som prod-frontend anropar.

---

## Om riktiga användare inte kan logga in

- **"Verifiera din e-post"** → de måste klicka verifieringslänken. Fungerar inte e-post? Kör `npm run db:verify-user -- användarens@epost.se` mot prod-DB (en gång per användare om ni gör undantag).
- **"Fel e-post eller lösenord"** → fel lösenord eller användaren finns inte i den databas backend använder (kolla att frontend verkligen anropar prod-backend).
- **"Kunde inte nå servern"** → se nedan.

---

## "Kunde inte nå servern" – felsökning

Felet betyder att webbläsaren inte får svar från backend (fel URL, backend nere eller CORS).

### Prod (transportplattformen.se)

1. **Vercel (frontend):** Miljövariabeln **`VITE_API_URL`** ska vara:
   `https://expressjs-postgres-production-605b.up.railway.app`
   Kör **ny deploy** efter att du lagt till eller ändrat variabeln (Vite bakar in värdet vid build).
2. **Railway (backend):** Sätt **`FRONTEND_URL`** så att den inkluderar den URL användaren besöker:  
   `https://transportplattformen.se,https://www.transportplattformen.se`  
   (Både med och utan www behövs om sajten kan nås på båda.)
3. Kontrollera att backend svarar: öppna `https://<backend-URL>/api/health` i webbläsaren – du ska få JSON med `"ok": true`.

Efter ändringar: bygg om frontend (Vercel redeploy) och vänta några sekunder på att Railway har startat om vid variabeländring.

Om ni vill att vanliga användare också ska kunna logga in innan e-post är verifierad måste ni ändra logiken i `server/routes/auth.js` (login) – idag är det endast admin som får undantag.
