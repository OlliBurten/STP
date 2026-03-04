# Arbetsgång: du och AI (Cursor)

Ett enkelt ramverk så att vi har samma bild av vem som gör vad och var koden hamnar.

---

## Roller

| Roll | Ansvar |
|------|--------|
| **Du** | Bestämmer *vad* som ska göras, *var* det ska synas (demo först / direkt live), och godkänner större förändringar. Du kan när som helst säga "pusha inte" eller "bara visa mig koden". |
| **AI (Cursor)** | Föreslår och skriver kod, kan committa och pusha till Git enligt nedan. Följer denna struktur om du inte säger något annat. |

Du behöver inte själv pusha eller merga om du inte vill – men du ska kunna *förstå* vad som pushats och var det landar.

---

## Branch-struktur (enkel modell)

Vi använder **två typer** av branches:

| Branch | Syfte | Vem bygger från den? |
|--------|--------|----------------------|
| **`main`** | "Klart att använda". Allt som är mergat hit är det som **live** och **demo** ska bygga från (om ni har en Vercel per miljö som båda bygger från main). | Vercel (live + demo), Railway (om ni deployar backend från samma repo). |
| **`feature/...`** | Pågående arbete. T.ex. `feature/logo-and-status`, `feature/ny-sida`. Här kodar AI (eller du) utan att påverka main. | Vercel kan bygga en **preview-URL** per branch så du kan kolla innan merge. |

**Regel:**  
- **Vill du se något på demo/live:** det måste finnas på **`main`** (merge från feature-branch).  
- **Vill du bara testa utan att det är "klart":** använd feature-branch och Vercels preview-URL för den branchen.

---

## Vad du säger till mig (AI) – och vad jag gör

Du kan använda dessa formuleringar; då vet jag exakt vad du menar:

| Du säger (ungefär) | Jag gör |
|--------------------|--------|
| **"Lägg till X"** / **"Fix så att Y"** | Implementerar i kod. Frågar om jag ska committa/pusha. Om du inte nämner branch: jobbar på nuvarande branch (eller skapar `feature/...` om det är större). |
| **"Pusha till demo först"** / **"Jag vill se det på demo innan live"** | Lägger ändringarna på en **feature-branch**, pushar den. Du ser det via Vercel preview för den branchen ELLER efter att du (eller jag) mergat till main om demo bygger från main. Jag skriver tydligt: "Pushat till branch X; för att se på demo: merge X → main och vänta på Vercel-build." |
| **"Pusha till main"** / **"Sätt det live"** | Mergar feature → main och pushar main (eller du gör merge i GitHub efter min push). Då bygger Vercel/Railway om och det blir synligt där ni har kopplat main. |
| **"Pusha inte, visa bara"** | Ingen commit/push. Du får bara diff eller förklaring. |
| **"Vi har två Vercel-projekt: ett för live, ett för demo"** | Jag minns: live och demo kan bygga från samma `main` men med olika `VITE_API_URL` (och eventuellt olika branch om ni vill). Jag skriver inte till fel miljö. |
| **"Backend för live heter X på Railway, för demo Y"** | Jag refererar till rätt projekt i instruktioner (t.ex. "Sätt variabeln i Railway-projektet för **demo**"). |

Om du **inte** säger något om push/merge antar jag: implementera, committa och pusha till **nuvarande** branch. Jag föreslår merge till main om du vill ha det på demo/live.

---

## Var saker uppdateras (snabbreferens)

| Vad | Var det styrs |
|-----|----------------|
| **Kod (frontend + backend)** | GitHub-repot. Branch `main` = det som ska vara "aktuellt" för live/demo. |
| **Vilken hemsida som anropar vilken backend** | Vercel: miljövariabel **`VITE_API_URL`** per projekt (live-projekt = prod-URL, demo-projekt = demo-URL). |
| **Vilka som är admin** | Railway: **`ADMIN_EMAILS`** på den backend som hemsidan använder. |
| **E-post (verifiering etc.)** | Railway: **`RESEND_API_KEY`** och **`EMAIL_FROM`** på backend. |
| **Att live och demo inte delar databas** | Railway: olika projekt, olika **`DATABASE_URL`** och **`DEPLOYMENT`** (production vs demo). |

Jag (AI) kan bara ändra **kod** och **pusha till Git**. Jag kan inte logga in på Vercel eller Railway och ändra variabler – det gör du. Jag kan däremot skriva exakt vad som ska stå var (enligt denna doc och INFRASTRUKTUR).

---

## Rekommenderad flöde för en ny funktion

1. **Du:** "Vi vill ha X. Jag vill se det på demo först."
2. **Jag:** Skapar/använder branch `feature/x`, implementerar, pushar till GitHub. Skriver: "Pushat till `feature/x`. För att se på demo: antingen öppna Vercel preview för `feature/x`, eller merga `feature/x` in i `main` så att demo (som bygger från main) får det."
3. **Du:** Kollar på demo (preview eller efter merge). Säger "bra, sätt det live" eller "ändra Y först".
4. **Jag:** Om det redan är mergat till main är det redan live (om live också bygger från main). Om ni har olika branch för live säger du det och då pushar vi till rätt branch.

Om ni **bara** har en Vercel som bygger från `main` (både live och demo på samma URL eller samma projekt): då är "demo först" = att du kollar på samma URL efter merge till main, eller att vi tillfälligt bygger från en feature-branch och du kollar preview-URL.

---

## Sammanfattning

- **Du** bestämmer vad och var (demo först / live). **Jag** kodar och kan pusha enligt ovan.
- **`main`** = det som ska vara ute (live/demo). **`feature/...`** = arbete på gång; merge till main när du är nöjd.
- **Du** sätter miljövariabler (Vercel, Railway). **Jag** skriver vad som ska stå var.
- Säg tydligt "pusha till demo först", "pusha till main", eller "pusha inte" så slipper vi missförstånd.

När du öppnar en ny chatt kan du skriva: "Följ docs/ARBETSGANG-MED-AI.md" så vet jag vilken struktur vi använder.
