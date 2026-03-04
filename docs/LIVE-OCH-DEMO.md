# Live och demo – vad som finns var

Kort översikt över vilken data som visas på live-sajten respektive demo-sajten.

**Viktigt:** Live och demo ska ha **två helt separata databaser**. Om demo-åkerier/förare syns på live har antingen samma databas använts för båda, eller så har demo-seed körts mot prod. Se **docs/DATABAS-LIVE-OCH-DEMO.md** för hur det ska vara uppsatt och hur ni rensar prod från demo-data.

---

## Live (transportplattformen.se)

- **Backend:** Egen prod-backend (Railway, projekt `drivermatch`, service `nodejs`) med **egen Postgres-databas** (som **inte** delas med demo).
- **Data:** **Ingen demo-data.** Allt som syns ska komma från prod-databasen:
  - **Förare:** Endast riktiga användare som har registrerat sig och skapat förarprofil (och som har `visibleToCompanies`). Efter migrering fanns t.ex. 5 förarprofiler.
  - **Åkerier:** Endast riktiga företag som har registrerat sig och fyllt i företagsprofil (och som har status VERIFIED där det gäller).
  - **Jobb:** Endast jobb som riktiga företag har publicerat. Om inget företag har lagt upp annonser är listan tom (0 jobb).

Live använder **inte** mock-data. Frontend har `VITE_API_URL` satt mot prod-backend och hämtar jobb, förare och åkerier enbart från API:et (prod-databasen).

---

## Demo (t.ex. transportplattform-demo.vercel.app)

- **Backend:** Demo-backend (eget Railway-projekt / egen databas).
- **Data:** Kan vara seedad med testanvändare (`driver@example.com`, `company@example.com`) och eventuellt `seed-demo.js` (många jobb, fler demo-förare/åkerier) för att visa upp plattformen. Demo-databasen är **separat** från prod – inget av det som visas på demo finns på live.

---

## Sammanfattning

| | Live | Demo |
|---|------|------|
| **Förare** | Endast riktiga (migrerade/registrerade) | Kan innehålla demo-förare (t.ex. seed) |
| **Åkerier** | Endast riktiga företag | Kan innehålla demo-åkerier |
| **Jobb** | Endast riktiga utannonserade jobb (ofta 0 i startläge) | Kan innehålla många demo-jobb |
| **Databas** | Prod Postgres (separat) | Demo Postgres (separat) |

Så ja: **på live-sidan är det ingen demo-data över huvudtaget** – varken förare eller åkerier eller jobb som inte kommer från riktiga användare.
