# Infrastruktur – Enterprise-uppsättning

En enda källa till sanning för hur live och demo ska vara uppsatta. Backend är ert ansvar; denna dokumentation beskriver exakt vad som ska stå var.

---

## Översikt

- **Två separata miljöer:** Live (prod) och Demo. De delar ingen databas och ingen backend-instans.
- **Live:** Riktiga användare, riktiga data. Ingen demo-seed.
- **Demo:** Demo-data (åkerier, förare, jobb) för presentation. Fylls med `db:seed:demo` mot demo-DB.

---

## Stack-översikt

| Lager | Live | Demo |
|-------|------|------|
| **Frontend** | Vercel: drivermatch-20260212 | Vercel: transportplattform-demo |
| **Domäner** | transportplattformen.se, drivermatch.se | transportplattform-demo.vercel.app |
| **Backend** | Railway: drivermatch (nodejs) | Railway: drivermatch-demo |
| **Backend-URL** | nodejs-production-f3b9.up.railway.app | drivermatch-demo-production.up.railway.app |
| **Databas** | Postgres i drivermatch-projektet | Postgres i drivermatch-demo-projektet |

---

## Railway – två projekt

| Miljö | Railway-projekt | Service | Postgres |
|--------|------------------|--------|----------|
| **Live** | `drivermatch` | `nodejs` | Egen Postgres i samma projekt |
| **Demo** | `drivermatch-demo` | (backend-service) | Egen Postgres i demo-projektet |

**OBS:** Projektet `drivermatch-clean` är **avvecklat**. Prod använder `drivermatch` (nodejs). Se [RAILWAY-OVERSIKT.md](RAILWAY-OVERSIKT.md) vid behov.

Varje projekt ska ha **sin egen** Postgres-databas. Kopiera aldrig prod `DATABASE_URL` till demo eller tvärtom.

---

## Miljövariabler per miljö

### Live-backend (Railway: drivermatch, service nodejs)

| Variabel | Obligatorisk | Beskrivning |
|----------|--------------|-------------|
| `DATABASE_URL` | Ja | Postgres-URL från drivermatch-projektets Postgres. |
| `JWT_SECRET` | Ja | Lång slumpsträng. Dela aldrig med demo. |
| `ADMIN_EMAILS` | Ja | Kommaseparerade e-postadresser med admin-rättigheter. |
| `FRONTEND_URL` | Ja | `https://transportplattformen.se,https://www.transportplattformen.se,https://drivermatch.se` (+ andra domäner om behov). |
| `DEPLOYMENT` | Ja | `production`. |
| `RESEND_API_KEY` | Rekommenderat | För e-post (verifiering, återställning, admin-notiser). |
| `EMAIL_FROM` | Valfritt | T.ex. `noreply@transportplattformen.se`. |
| `AUTO_VERIFY_COMPANIES` | Valfritt | `true` = automatisk företagsverifiering. |
| `NODE_ENV` | Sätt av Railway | `production`. |

### Demo-backend (Railway: drivermatch-demo)

| Variabel | Obligatorisk | Beskrivning |
|----------|--------------|-------------|
| `DATABASE_URL` | Ja | Postgres-URL från drivermatch-demo-projektet. |
| `JWT_SECRET` | Ja | Kan vara annan än prod. |
| `ADMIN_EMAILS` | Ja | T.ex. samma som prod. |
| `FRONTEND_URL` | Ja | `https://transportplattform-demo.vercel.app`. |
| `DEPLOYMENT` | Ja | `demo`. |
| `RESEND_API_KEY` | Valfritt | Om e-post ska fungera på demo. |
| `NODE_ENV` | production | Sätt av Railway. |

---

## Frontend (Vercel)

| App | Vercel-projekt | Domäner | Obligatoriska variabler |
|-----|----------------|---------|-------------------------|
| **Live** | drivermatch-20260212 | transportplattformen.se, drivermatch.se | `VITE_API_URL` = `https://nodejs-production-f3b9.up.railway.app` |
| **Demo** | transportplattform-demo | transportplattform-demo.vercel.app | `VITE_API_URL` = demo-backend-URL |

SSO (valfritt): `VITE_GOOGLE_CLIENT_ID`, `VITE_AZURE_CLIENT_ID`. Se [VERCEL-SSO.md](VERCEL-SSO.md).

Varje frontend byggs med sin `VITE_API_URL`. Bygg om (Redeploy) efter ändring.

---

## Kontrollera att allt stämmer

1. **Live:** `https://nodejs-production-f3b9.up.railway.app/api/health` → `"deployment": "production"`.
2. **Demo:** `https://drivermatch-demo-production.up.railway.app/api/health` → `"deployment": "demo"`.
3. **Databaser:** Prod- och demo-`DATABASE_URL` ska **inte** vara identiska.

---

## Om demo-data har hamnat på live

1. Säkerställ att prod har `DEPLOYMENT=production` och egen Postgres.
2. Rensa prod-DB: se [DATABAS-LIVE-OCH-DEMO.md](DATABAS-LIVE-OCH-DEMO.md) (scriptet `db:remove-demo-from-prod`).
3. Kör aldrig `db:seed:demo` mot prod-databasen.

---

## Snabbreferens

- **Prod:** drivermatch (nodejs), DEPLOYMENT=production, transportplattformen.se/drivermatch.se.
- **Demo:** drivermatch-demo, DEPLOYMENT=demo, transportplattform-demo.vercel.app.
- **Health:** `GET /api/health` returnerar `deployment` för verifiering.
