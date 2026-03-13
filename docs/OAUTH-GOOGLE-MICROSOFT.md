# OAuth – Google och Microsoft

Användare kan logga in med Google eller Microsoft-konto i stället för e-post/lösenord. Säkrare och enklare för användare.

---

## Google – steg för steg (enkelt)

*Vad du gör:* Du skapar en "app" hos Google som säger "den här webbplatsen får använda Google-inloggning". Google ger dig en kod (Client ID) som du stoppar in i ditt projekt.

### 1. Öppna Google Cloud Console

Gå till **[console.cloud.google.com](https://console.cloud.google.com)** och logga in med ditt Google-konto.

---

### 2. Skapa eller välj ett projekt

- Klicka på **projektväljaren** (menyn uppe till vänster, bredvid "Google Cloud").
- Klicka **Nytt projekt** → namn t.ex. "DriverMatch" → **Skapa**.
- Eller välj ett befintligt projekt.

---

### 3. Sätt upp OAuth consent screen

Google kräver att du beskriver vad din app gör. Det här gör man en gång per projekt.

- **Hamburgarmenyn** (☰) → **APIs & Services** → **OAuth consent screen**.
- Välj **External** (så att alla med Google-konto kan logga in).
- Fyll i:
  - **App name:** DriverMatch (eller STP)
  - **User support email:** din e-post
- Klicka **Save and Continue** → **Save and Continue** igen (skippa "Scopes" för nu).

---

### 4. Skapa OAuth Client ID

- Gå till **APIs & Services** → **Credentials**.
- Klicka **+ CREATE CREDENTIALS** → **OAuth client ID**.
- Om du får en fråga om "OAuth consent screen" – du är redan klar med steg 3, klicka bara OK.

---

### 5. Fyll i formuläret

| Fält | Vad du skriver |
|------|----------------|
| **Application type** | Web application |
| **Name** | DriverMatch (eller vad du vill) |
| **Authorized JavaScript origins** | Klicka **+ ADD URI** och lägg till:<br>• `http://localhost:5173` (för lokalt test)<br>• Din Vercel-URL, t.ex. `https://transportplattform-demo.vercel.app` |

*Vad är "Authorized JavaScript origins"?* Adresser där Google tillåter att inloggningen körs. Utan detta blockar Google popup-fönstret.

---

### 6. Kopiera Client ID

- Klicka **Create**.
- En dialog visas med **Your Client ID** (lång sträng som slutar på `.apps.googleusercontent.com`).
- Kopiera den – du behöver den i nästa steg.

---

### 7. Lägg in Client ID i projektet

**Lokalt (för test):**

- Skapa eller redigera `.env` i projektets rot.
- Lägg till:
  ```
  VITE_GOOGLE_CLIENT_ID=klistra-in-ditt-client-id-här
  ```
- I `server/.env` lägg också till:
  ```
  GOOGLE_CLIENT_ID=klistra-in-samma-client-id
  ```

**Vercel (frontend):**  
Project → Settings → Environment Variables → lägg till `VITE_GOOGLE_CLIENT_ID` med ditt Client ID.

**Railway (backend):**  
Project → Variables → lägg till `GOOGLE_CLIENT_ID` med samma Client ID.

---

### 8. Starta om och testa

- Starta om dev-servern (`npm run dev`).
- Gå till inloggningssidan – du ska se en **"Logga in med Google"**-knapp.
- Klicka och logga in med ett Google-konto.

---

## Krav (sammanfattning)

- **Frontend (Vercel):** `VITE_GOOGLE_CLIENT_ID`, `VITE_AZURE_CLIENT_ID` (och eventuellt `VITE_AZURE_TENANT_ID`).
- **Backend (Railway):** `GOOGLE_CLIENT_ID`, `AZURE_CLIENT_ID` (samma värden som frontend), eventuellt `AZURE_TENANT_ID` (standard: `common` för multi-tenant).
- Bygg om frontend efter att du lagt till variablerna.

Om variablerna inte är satta visas inte OAuth-knapparna på inloggningssidan.

---

## Google (snabbreferens)

1. [Google Cloud Console](https://console.cloud.google.com) → projekt → OAuth consent screen → External → fyll i namn och e-post.
2. Credentials → Create Credentials → OAuth client ID → Web application.
3. Lägg till Authorized JavaScript origins: `http://localhost:5173` + din Vercel-URL.
4. Kopiera Client ID → lägg i `.env` som `VITE_GOOGLE_CLIENT_ID` (frontend) och `GOOGLE_CLIENT_ID` (server).

---

## Microsoft – steg för steg (enkelt)

*Vad du gör:* Du skapar en "app" hos Microsoft (Azure) som säger "den här webbplatsen får använda Microsoft-inloggning". Microsoft ger dig en Application (client) ID som du stoppar in i ditt projekt.

### 1. Öppna Azure Portal

Gå till **[portal.azure.com](https://portal.azure.com)** och logga in med ditt Microsoft-konto.

---

### 2. Hitta Microsoft Entra ID

- I sökfältet högst upp, skriv **Microsoft Entra ID** och klicka på tjänsten.
- (Tidigare hette det "Azure Active Directory".)

---

### 3. Skapa en app-registrering

- I vänstermenyn: **App registrations** → **+ New registration**.

---

### 4. Fyll i formuläret

| Fält | Vad du skriver |
|------|----------------|
| **Name** | STP inloggning (eller DriverMatch) |
| **Supported account types** | **Accounts in any organizational directory and personal Microsoft accounts** (det sista alternativet – multi-tenant) |
| **Redirect URI** | Välj typ **Single-page application (SPA)** |
| | Klicka **Add URI** och skriv `http://localhost:5173` |

*Tips:* Du kan lägga till fler redirect URI:er senare under Authentication (t.ex. din Vercel-URL).

---

### 5. Skapa och kopiera Application (client) ID

- Klicka **Register**.
- Du hamnar på appens översikt. Där ser du **Application (client) ID** – en lång sträng som `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.
- Kopiera den.

---

### 6. Lägg till fler redirect URI:er (om du vill)

- Gå till **Authentication** i vänstermenyn.
- Under **Single-page application** → **Add URI** → lägg till t.ex. `https://transportplattform-demo.vercel.app` om du har en Vercel-deploy.
- Klicka **Save**.

---

### 7. Lägg in Client ID i projektet

Skicka din **Application (client) ID** till utvecklaren, eller lägg in själv:

**Lokalt:**
- `.env`: `VITE_AZURE_CLIENT_ID=xxx-xxx-xxx`
- `server/.env`: `AZURE_CLIENT_ID=xxx-xxx-xxx`

**Vercel:** Environment variable `VITE_AZURE_CLIENT_ID`  
**Railway:** Environment variable `AZURE_CLIENT_ID`

`AZURE_TENANT_ID` behöver du normalt inte sätta – standard är `common` (multi-tenant).

---

### 8. Starta om och testa

- Starta om dev-servern.
- På inloggningssidan ska du nu se både "Logga in med Google" och "Logga in med Microsoft".

---

## Microsoft (snabbreferens)

1. [Azure Portal](https://portal.azure.com) → Microsoft Entra ID → App registrations → New registration.
2. Namn, multi-tenant, Redirect URI: SPA → `http://localhost:5173`.
3. Kopiera Application (client) ID → lägg i `.env` som `VITE_AZURE_CLIENT_ID` och `AZURE_CLIENT_ID` i server.

---

## Flöde

1. Användaren klickar "Logga in med Google" eller "Microsoft" på inloggningssidan.
2. Väljer roll (Chaufför/Företag) innan klick.
3. OAuth-fönster öppnas (popup).
4. Efter lyckad inloggning skickas token till backend, som verifierar den och returnerar vår JWT.
5. Om användaren inte finns skapas konto automatiskt (e-post verifierad via OAuth; företag får PENDING tills admin godkänner).

---

## Säkerhet

- Lösenord hanteras av Google/Microsoft, inte av er.
- OAuth-användare har `passwordHash: null` i databasen – de kan inte logga in med e-post/lösenord förrän de sätter lösenord via "Glömt lösenord".
- Samma session-regler gäller (24h max, 60 min inaktivitet).
