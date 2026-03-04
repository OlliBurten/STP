# Två separata databaser: Live och Demo

Live och demo ska **alltid** använda **olika databaser**. Om demo-data syns på live har antingen fel databas använts eller demo-seed körts mot prod.

**Huvuddokument för hela uppsättningen:** **docs/INFRASTRUKTUR.md** (Railway, miljövariabler, DEPLOYMENT).

---

## Så ska det vara uppsatt

| | **Live (prod)** | **Demo** |
|---|------------------|----------|
| **Backend** | Eget Railway-projekt (t.ex. `drivermatch`), service `nodejs` | Eget Railway-projekt (t.ex. `drivermatch-demo`) |
| **Databas** | **Egen Postgres** (t.ex. Railway Postgres kopplad till prod-projektet) | **Egen Postgres** (separat från prod) |
| **DATABASE_URL** | Sätt i prod-backend till **prod-databasens** URL | Sätt i demo-backend till **demo-databasens** URL |
| **Seed** | Kör **aldrig** `db:seed:demo` mot prod. Eventuellt endast `db:seed` med `ALLOW_SEED_PRODUCTION=true` för admin/test (driver@example.com etc.) om ni vill – annars inget seed. | Kör `db:seed:demo` (DEMO_SEED=true) mot **demo-databasen** när du vill fylla demo med åkerier/jobb/förare |
| **Frontend** | Vercel (transportplattformen.se) med `VITE_API_URL` = **prod-backend-URL** | Vercel (t.ex. transportplattform-demo) med `VITE_API_URL` = **demo-backend-URL** |

**Regel:** Prod-backend ska bara prata med **en** databas – prod-databasen. Demo-backend ska bara prata med **en** databas – demo-databasen. De två databaserna delar ingen data.

---

## Varför syns demo-åkerier på live?

Det händer om något av följande:

1. **Live-backend använder samma DATABASE_URL som demo** – då är det faktiskt samma databas, och allt som seedats i demo (åkerier, förare, jobb) syns på live.
2. **`db:seed:demo` har körts mot prod-databasen** – t.ex. med `DATABASE_URL` satt till prod-URL. Då hamnar alla demo-användare (Linda Ström, Nordic Logistics, etc.) i prod.

---

## Kontrollera hur det är nu

1. **Live-backend (Railway):** Öppna projektet som **live** använder → Variables → kolla **DATABASE_URL**. Jämför med demo-backendens **DATABASE_URL**. Om de är lika har live och demo samma databas – det ska de inte.
2. **Skapa två Postgres-databaser om det behövs:** I Railway kan du ha en Postgres per projekt. Prod-projektet ska ha sin egen Postgres; demo-projektet sin egen. Sätt respektive **DATABASE_URL** i varje backend.

---

## Rensa bort demo från prod (engångsåtgärd)

Om demo-användare redan finns i prod-databasen kan ni ta bort dem med scriptet utan att påverka riktiga användare.

**Kör scriptet inifrån Railway** (prod-databasen är bara nåbar från Railway-nätet):

```bash
cd server
railway link -p drivermatch -e production -s nodejs
# Dry-run först:
railway ssh -s nodejs -e production -- sh -c 'REMOVE_DEMO_FROM_PROD=dry npm run db:remove-demo-from-prod'
# Verkligen ta bort:
railway ssh -s nodejs -e production -- sh -c 'REMOVE_DEMO_FROM_PROD=confirm npm run db:remove-demo-from-prod'
```

(Deploya senaste koden först så att `db:remove-demo-from-prod` finns i containern.)

**Alternativ – lokalt** om ni har en publik prod-DB-URL (t.ex. från Railway → Postgres → Connect → Public URL):

```bash
cd server
DATABASE_URL="<prod-public-URL>" REMOVE_DEMO_FROM_PROD=dry npm run db:remove-demo-from-prod
DATABASE_URL="<prod-public-URL>" REMOVE_DEMO_FROM_PROD=confirm npm run db:remove-demo-from-prod
```

Scriptet tar bort alla användare som kommer från `seed-demo.js` samt alla med `@example.com`. Riktiga användare påverkas inte.

---

## Snabbreferens

- **Prod-databas:** Endast riktiga användare och deras data. Ingen `db:seed:demo`.
- **Demo-databas:** Fyll med `DEMO_SEED=true npm run db:seed:demo` när du vill. Samma databas ska aldrig användas av prod-backend.
- **Rensa prod från demo:** `REMOVE_DEMO_FROM_PROD=confirm` + `DATABASE_URL` (prod) + `npm run db:remove-demo-from-prod`.
