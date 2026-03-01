# E2E – Plattformen från start till mål

## Köra automatiska tester (Playwright)

1. **Starta frontend** (terminal 1):
   ```bash
   npm run dev
   ```
2. **Starta backend** (terminal 2, för inloggning och API):
   ```bash
   cd server && npm run dev
   ```
3. **Kör e2e** (terminal 3):
   ```bash
   npm run e2e
   ```
   Endast Chromium (om Firefox inte är installerad):
   ```bash
   npx playwright test --project=chromium
   ```
   Installera Firefox för Playwright: `npx playwright install firefox`

Tester finns i `e2e/smoke.spec.js` (gäst, jobb, åkerier, login, skyddade routes) och `e2e/auth.spec.js` (inloggad förare/företag). Auth-testerna använder seed-användare `driver@example.com` / `company@example.com` med lösenord `password123` (kräver att backend har körts med seed).

---

## Manuell E2E – huvudflöden

### Gäst
- **Startsida:** Rubrik "Rätt förare/jobb/åkeri", "Jag är förare", "Jag representerar ett åkeri", "Logga in".
- **Jobb:** `/jobb` – rubrik "Lediga jobb", filter (region, bransch m.m.), jobbkort.
- **Åkerier:** `/akerier` – "Hitta åkerier", filter bransch/region, lista åkerier.
- **Login:** `/login` – formulär E-post, Lösenord; byt till Registrera.
- **Skyddade sidor:** `/profil` och `/foretag/mina-jobb` omdirigerar till `/login`.

### Förare (inloggad)
- **Profil:** `/profil` – visa/redigera profil, checklista "Saker som lätt glöms".
- **Jobb:** `/jobb` – spara jobb (hjärta), rekommenderade jobb om profil finns.
- **Sparade jobb:** `/favoriter` – lista sparade, länk "Du har X sparade jobb" på jobbsidan.
- **Jobbdetalj:** `/jobb/:id` – brödsmulor, "Om företaget", varning om annons >30 dagar, ansök (öppnar modal).
- **Meddelanden:** `/meddelanden` – konversationer, status Skickad/Läst/Utvald/Avvisad; vid utvald: påminnelse att svara.

### Företag (inloggad, verifierat)
- **Översikt:** `/foretag` – dashboard, aktiva jobb, dialoger, CTA vid nya ansökningar.
- **Mina jobb:** `/foretag/mina-jobb` – lista jobb, "Stäng annons", varning annonser >30 dagar.
- **Jobbdetalj:** `/jobb/:id` – sökande, markera utvald/avvisa.
- **Meddelanden:** `/foretag/meddelanden` – konversationer, påminnelse 24–48 h.
- **Publicera jobb:** `/foretag/annonsera` – formulär, kollektivavtal, bransch.
- **Företagsprofil:** `/foretag/profil` – bransch, region, beskrivning (syns i Hitta åkerier).

### Juridik & bransch
- **Footer:** Användarvillkor, Integritetspolicy, Cookies, Branschinsikter.
- **Registrering:** Checkbox godkänn villkor + integritet krävs.
- **Integritet:** Sektion 8 Cookies; Användarvillkor §3 Bransch/kollektivavtal.

### Notiser
- **Förare:** Nytt jobb som matchar (länk till jobb), sparade jobb uppdaterat, du är utvald, nytt meddelande.
- **Företag:** Ny ansökan (länk till konversation), nytt meddelande.

---

## Snabbtest (utan backend)

Starta bara `npm run dev`. Gästflöden (startsida, jobb, åkerier, login-sida, skyddade routes) och navigation fungerar. Inloggning och sparade jobb kräver backend.
