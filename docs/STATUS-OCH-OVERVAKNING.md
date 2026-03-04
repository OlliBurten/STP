# Status och övervakning

Du behöver kunna se när live/demo och backend är uppe, och få veta när något går sönder. Här är vad som finns och hur du sätter upp det.

---

## 1. Status-sida i appen (admin)

**Var:** Logga in som admin → klicka **Status** i headern (eller gå till `/admin/status`).

**Vad den visar:**

- **Backend (API)** – Är vår backend uppe och kan den prata med databasen? (använder `GET /api/health`.)
- **Live (webbplats)** – Svarar transportplattformen.se (eller den URL du satt i `VITE_LIVE_URL`)?
- **Demo (webbplats)** – Svarar demo-sajten (t.ex. transportplattform-demo.vercel.app)?

Sidan uppdateras automatiskt var 60:e sekund. Du kan klicka **Uppdatera alla** när du vill.

**Kräver:**

- **Backend:** `STATUS_CHECK_URLS` (valfritt) – komma-separerade URL:er som backend får anropa för att kolla live/demo. Standard: `https://transportplattformen.se,https://transportplattform-demo.vercel.app`.
- **Frontend (Vercel):** Sätt vid build så att statussidan vet vilka adresser som är live/demo:
  - `VITE_LIVE_URL` – t.ex. `https://transportplattformen.se`
  - `VITE_DEMO_URL` – t.ex. `https://transportplattform-demo.vercel.app`
  - `VITE_API_URL` – backend-URL (behövs redan för inloggning)

Om du inte sätter `VITE_LIVE_URL` / `VITE_DEMO_URL` används ovanstående som standard.

---

## 2. Extern övervakning (rekommenderat)

Status-sidan i appen kräver att du är inloggad. För att **alltid** veta när något är nere – även när du inte sitter i webbläsaren – sätt upp en extern tjänst som pingar dina adresser och skickar avisering (e-post, Slack m.m.) vid fel.

### UptimeRobot (gratis)

1. Gå till [uptimerobot.com](https://uptimerobot.com) och skapa konto.
2. Skapa **Monitor** för varje tjänst:
   - **Live webbplats:** typ HTTP(s), URL: `https://transportplattformen.se` (eller din live-URL), intervall t.ex. 5 min.
   - **Backend health:** typ HTTP(s), URL: `https://<din-backend>/api/health`, intervall t.ex. 5 min. Förväntat: HTTP 200 och (om du vill) innehåll som innehåller `"ok":true`.
   - **Demo (valfritt):** samma sak för demo-URL.

3. Under **Alert Contacts** lägg till din e-post (och eventuellt Slack). När en monitor fallerar får du avisering.

**Viktigt:** Backend-URL:en är den där din API körs (t.ex. Railway/Render). Den ska sluta på `/api/health`, t.ex. `https://din-app.railway.app/api/health`.

### Andra tjänster

- **Better Uptime**, **Freshping**, **Pingdom** – liknande: ange URL + intervall, få avisering vid nere.
- **GitHub Actions** – du kan köra ett workflow var 10:e minut som anropar `https://.../api/health` och `https://transportplattformen.se`; vid fel kan workflown t.ex. skicka e-post eller posta till Slack. Kräver att du skriver ett litet script/curl i repot.

---

## 3. Vad som kontrolleras var

| Vad du vill veta | Var du ser det |
|------------------|-----------------|
| Är backend + DB uppe? | Status-sidan i appen (Backend-raden), eller extern monitor mot `/api/health`. |
| Är live-sajten uppe? | Status-sidan (Live-raden), eller extern monitor mot live-URL. |
| Är demo uppe? | Status-sidan (Demo-raden), eller extern monitor mot demo-URL. |
| Får jag veta när något går sönder? | Endast om du sätter upp extern övervakning (t.ex. UptimeRobot) med avisering. |

---

## 4. Snabbreferens

- **Status i appen:** Logga in som admin → **Status** i headern → `/admin/status`.
- **Health-endpoint för externa verktyg:** `GET https://<backend>/api/health` → 200 och `{"ok":true,"db":"ok"}` när allt är OK.
- **Avisering vid driftstörning:** Sätt upp UptimeRobot (eller motsvarande) mot live-URL och `/api/health`, lägg till din e-post som Alert Contact.
