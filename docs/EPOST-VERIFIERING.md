# E-postverifiering – så att användare får mailet

Om användare inte får verifieringsmail efter registrering beror det nästan alltid på att **backend inte har e-post konfigurerat**. Verifieringslänken skickas bara om `RESEND_API_KEY` är satt.

**Varför det kan ha "slutat fungera":** Prod-sajten (transportplattformen.se) använder nu **samma backend** som demo – Railway-projektet **drivermatch-demo** – så att inloggning och allt kör mot en miljö. Den backend hade inte Resend konfigurerat (det hade eventuellt det andra Railway-projektet, "drivermatch", som prod tidigare kunde peka mot). Därför räcker det med att sätta **RESEND_API_KEY** och **EMAIL_FROM** **en gång** i **drivermatch-demo** på Railway; då fungerar e-post för både prod och demo. E-post skickas som standard från **noreply@transportplattformen.se** (ändra med EMAIL_FROM om du vill).

**Så ser du att något är fel:** Logga in som admin → **Status**. Raden **"E-post (verifiering)"** ska vara grön (Konfigurerad). Är den röd har RESEND_API_KEY försvunnit eller inte satts – åtgärda direkt. Vid varje omstart loggar backend också **"KRITISKT: RESEND_API_KEY är inte satt"** i Railway om nyckeln saknas.

---

## Vad som krävs i produktion

1. **RESEND_API_KEY** – API-nyckel från [Resend](https://resend.com).
2. **EMAIL_FROM** – Avsändaradress (måste vara verifierad domän i Resend). Standard i koden: `noreply@transportplattformen.se`. Verifiera alltså domänen transportplattformen.se i Resend.

Utan dessa **skickas inga mail** – backend loggar bara till konsolen och användare får inget.

---

## Så sätter du upp det (Resend)

1. Gå till [resend.com](https://resend.com) och skapa konto.
2. **API Keys:** Skapa en API-nyckel (t.ex. "Production").
3. **Domains:** Lägg till och verifiera **transportplattformen.se** (e-post ska komma därifrån). Resend visar vilka DNS-poster (SPF, DKIM) du ska lägga in.
4. **From-adress:** Använd `noreply@transportplattformen.se` (eller sätt `EMAIL_FROM` till det i Railway).

---

## Så sätter du variablerna på Railway

1. Öppna projektet **drivermatch-demo** (eller den backend som prod använder) i Railway.
2. **Variables** → **Add Variable**:
   - `RESEND_API_KEY` = din Resend API-nyckel (t.ex. `re_...`).
   - `EMAIL_FROM` = `noreply@transportplattformen.se` (om du inte satt det; standard i koden. Domänen måste vara verifierad i Resend).
3. Spara – Railway startar om tjänsten. Därefter skickas verifieringsmail vid registrering och vid "Skicka verifieringslänk igen".

---

## Användare som redan registrerat sig men inte fick mail

De behöver **inte** registrera sig igen. Ni kan antingen skicka länk igen eller godkänna dem manuellt.

### Alternativ 1: Skicka verifieringslänk igen
Användaren går till inloggningssidan, anger sin e-post och klickar **"Skicka verifieringslänk igen"**. Om e-post nu är konfigurerad (Resend) får de mailet och klickar på länken – då är de verifierade.

### Alternativ 2: Manuell godkännan (verifiera utan mail)
Då markerar ni användaren som verifierad i databasen. Därefter kan de logga in direkt med sitt befintliga lösenord.

**Kör mot prod-backend** (DATABASE_URL är redan satt i Railway):

```bash
cd server
railway link -p drivermatch -e production
railway service nodejs
railway ssh -s nodejs -e production -- node scripts/verify-user-email.js användarens@epost.se
```

Kör kommandot **en gång per e-postadress**. Efteråt kan användaren logga in som vanligt. Kontot och lösenordet är oförändrat.

**Eller lokalt** (om du har prod-databasens URL från Railway):  
`cd server && DATABASE_URL="postgresql://..." npm run db:verify-user -- användarens@epost.se`

---

## Vad vi byggt in i koden

- **Verifieringslänken** använder den sajt användaren registrerade sig från (prod vs demo). Länken pekar alltså på rätt webbadress.
- Om e-post inte kunde skickas får användaren tydlig information och kan kontakta er för manuell verifiering.
- I produktionsloggar syns `[Email:CRITICAL] RESEND_API_KEY is not set` om nyckeln saknas – då skickas inga mail.
