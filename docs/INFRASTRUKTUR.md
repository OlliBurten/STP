# Infrastruktur – Enterprise-uppsättning

En enda källa till sanning för hur live och demo ska vara uppsatta. Backend är ert ansvar; denna dokumentation beskriver exakt vad som ska stå var.

---

## Översikt

- **Två separata miljöer:** Live (prod) och Demo. De delar ingen databas och ingen backend-instans.
- **Live:** Riktiga användare, riktiga data. Ingen demo-seed.
- **Demo:** Demo-data (åkerier, förare, jobb) för presentation. Fylls med `db:seed:demo` mot demo-DB.

---

## Railway – två projekt

| Miljö | Railway-projekt | Service | Postgres |
|--------|------------------|--------|----------|
| **Live** | `drivermatch` (eller ert prod-projekt) | `nodejs` (eller backend-service) | **Egen** Postgres i samma projekt |
| **Demo** | `drivermatch-demo` (eller ert demo-projekt) | `nodejs` | **Egen** Postgres i demo-projektet |

Varje projekt ska ha **sin egen** Postgres-databas. Kopiera aldrig prod `DATABASE_URL` till demo eller tvärtom.

---

## Miljövariabler per miljö

### Live-backend (Railway, prod-projekt)

| Variabel | Obligatorisk | Beskrivning |
|----------|--------------|-------------|
| `DATABASE_URL` | Ja | Postgres-URL från **prod-projektets** Postgres (Railway → Add Postgres → använd länkade variabeln). |
| `JWT_SECRET` | Ja | Lång slumpsträng. Dela aldrig med demo. |
| `ADMIN_EMAILS` | Ja | Kommaseparerade e-postadresser som ska ha admin-rättigheter. Dessa får även e-post när nya åkerier registrerar sig (för manuell verifiering). |
| `FRONTEND_URL` | Ja | Live-frontend-URL(er), kommaseparerade. T.ex. `https://transportplattformen.se`. |
| `DEPLOYMENT` | **Ja** | Sätt till **`production`**. Detta förhindrar att demo-seed någonsin körs mot denna backend. |
| `RESEND_API_KEY` | Rekommenderat | För e-post (verifiering, återställning, admin-notiser vid nya åkeriregistreringar). |
| `EMAIL_FROM` | Valfritt | T.ex. `noreply@transportplattformen.se`. |
| `AUTO_VERIFY_COMPANIES` | Valfritt | `true` = automatisk verifiering: företag med giltigt org.nr (Luhn) och företags-e-post (ej gmail/hotmail m.fl.) blir VERIFIED direkt. Annars PENDING (manuell admin-godkännande). |
| `NODE_ENV` | Sätt av Railway | Ska vara `production` i deploy. |

### Demo-backend (Railway, demo-projekt)

| Variabel | Obligatorisk | Beskrivning |
|----------|--------------|-------------|
| `DATABASE_URL` | Ja | Postgres-URL från **demo-projektets** Postgres. **Annorlunda** än prod. |
| `JWT_SECRET` | Ja | Kan vara annan än prod. |
| `ADMIN_EMAILS` | Ja | T.ex. samma som prod om ni vill logga in som admin på demo. |
| `FRONTEND_URL` | Ja | Demo-frontend-URL(er). T.ex. `https://transportplattform-demo.vercel.app`. |
| `DEPLOYMENT` | **Ja** | Sätt till **`demo`**. Tillåter `db:seed:demo` mot denna DB. |
| `RESEND_API_KEY` | Valfritt | Om ni vill skicka mail från demo också. |
| `NODE_ENV` | production | Sätt av Railway. |

---

## Frontend (Vercel)

| App | Projekt / domän | `VITE_API_URL` (build) |
|-----|------------------|-------------------------|
| **Live** | transportplattformen.se | Prod-backend-URL (Railway prod service URL). |
| **Demo** | transportplattform-demo.vercel.app (eller eget) | Demo-backend-URL (Railway demo service URL). |

Varje frontend ska byggas med **sin** backend-URL. Bygg om efter ändring av `VITE_API_URL`.

---

## Kontrollera att allt stämmer

1. **Live:** Öppna `https://<prod-backend>/api/health`. Svaret ska innehålla `"deployment": "production"`. (Satt via Railway CLI: `railway link -p drivermatch -s nodejs` → `railway variables --set "DEPLOYMENT=production"`.)
2. **Demo:** Öppna `https://<demo-backend>/api/health`. Svaret ska innehålla `"deployment": "demo"`.
3. **Databaser:** I Railway, jämför `DATABASE_URL` för prod-backend och demo-backend. De ska **inte** vara identiska. Varje URL ska peka på sin projekts Postgres.

---

## Om demo-data har hamnat på live

1. Säkerställ att prod-backend har **egen** Postgres och `DEPLOYMENT=production`.
2. Rensa prod-DB från demo-användare: se **docs/DATABAS-LIVE-OCH-DEMO.md** (scriptet `db:remove-demo-from-prod`).
3. Efter rensning: kör aldrig `db:seed:demo` mot prod-databasen. Demo-seed vägrar att köras om `DEPLOYMENT=production` är satt i miljön som använder den DB:en (kör alltid seed från en miljö där `DEPLOYMENT=demo` och `DATABASE_URL` är demo).

---

## Snabbreferens

- **Prod:** `DEPLOYMENT=production`, egen Postgres, egen Railway-projekt. Ingen demo-seed.
- **Demo:** `DEPLOYMENT=demo`, egen Postgres, eget Railway-projekt. `db:seed:demo` körs bara här.
- **Health:** `GET /api/health` returnerar `deployment` så ni kan verifiera vilken miljö ni når.
