# SSO på produktion (Google & Microsoft)

För att visa "Logga in med Google" och "Logga in med Microsoft" på live-sajten måste miljövariablerna sättas i Vercel.

---

## Snabbchecklista för Vercel

1. Gå till [vercel.com](https://vercel.com) → ditt **prod-projekt** (t.ex. `drivermatch-20260212`)
2. **Settings** → **Environment Variables**
3. Lägg till för **Production**:

| Variabel | Värde | Krävs för |
|----------|-------|------------|
| `VITE_API_URL` | `https://din-backend.railway.app` | All API-anrop, inkl. SSO |
| `VITE_GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | Google-knappen |
| `VITE_AZURE_CLIENT_ID` | `xxx-xxx-xxx` | Microsoft-knappen (valfritt) |
| `VITE_AZURE_TENANT_ID` | `common` | Microsoft (standard) |

4. **Deployments** → senaste deploy → **⋯** → **Redeploy**

> **Viktigt:** Vite bakar in miljövariabler vid build. Efter ändring måste du göra en ny deploy (Redeploy eller push till main).

---

## Google Cloud Console

För att Google-inloggning ska fungera måste produktionsdomänen vara godkänd:

1. [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. Välj din **OAuth 2.0 Client ID** (Web application)
3. Under **Authorized JavaScript origins** lägg till:
   - `https://transportplattformen.se`
   - `https://www.transportplattformen.se`
   - (och eventuellt Vercel-preview-URL om ni vill testa där)
4. Under **Authorized redirect URIs** kan du behålla som standard (Google Sign-In använder popup)

**Om inget händer vid klick på Google-knappen:** Domänen saknas oftast i Authorized JavaScript origins. Lägg till `https://transportplattformen.se` och `https://www.transportplattformen.se` ovan, spara, och testa igen.

---

## Microsoft Azure – viktigt vid "invalid redirect_uri"

Om Microsoft ger fel: **"The provided value for the input parameter 'redirect_uri' is not valid"**:

1. Gå till [Azure Portal](https://portal.azure.com) → **App registrations** → din app (Client ID synlig i Vercel `VITE_AZURE_CLIENT_ID`)
2. **Authentication** → **Single-page application** (eller Add platform om ingen finns)
3. Under **Redirect URIs** – lägg till exakt:
   - `https://transportplattformen.se`
   - `https://www.transportplattformen.se` (om ni använder www)
4. **Spara**

---

## Verifiera att SSO syns

Efter redeploy: öppna https://transportplattformen.se/login. Du ska se:

- "Eller logga in med"
- Google-knapp (om `VITE_GOOGLE_CLIENT_ID` satt)
- Microsoft-knapp (om `VITE_AZURE_CLIENT_ID` satt)

Om knapparna fortfarande saknas: kontrollera att variablerna är för **Production** och att du gjort Redeploy.
