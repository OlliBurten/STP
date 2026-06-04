# Åtgärdslista: Förbättringar av DriverOnboardingWizard

> Ge denna fil till Claude Code. Alla ändringar gäller
> `src/pages/DriverOnboardingWizard.jsx` om inget annat anges.
> Läs filen först. Behåll befintlig stil, struktur och tracking.

## 1. Done-skärmen ska visa matchande jobb (HÖGSTA PRIO)

Idag säger done-skärmen bara "Du är nu synlig för åkerier" + framtida notiser. Det missar
aha-ögonblicket. Vi har ~700 seedade jobb — visa dem direkt.

- När onboarding är klar: hämta antalet jobb som matchar förarens körkort + region
  (återanvänd befintlig matchningslogik i `utils/matchUtils.js` / jobs-API:t).
- Ändra done-skärmens rubrik/innehåll till att leda med jobben, t.ex.
  "**{N} jobb i {region} matchar dig redan**" som det första föraren ser.
- Lägg en primär knapp "Se jobben som matchar dig" → navigera till jobblistan
  (`/jobb`) förifiltrerad på förarens region/körkort, INTE bara "Till min profil".
- Behåll "Till min profil" som sekundär länk.
- Om N = 0 (ovanligt): fall tillbaka på nuvarande "du är synlig"-budskap.
- Ta bort den automatiska `setTimeout(... navigate("/profil"), 3000)` — låt föraren själv
  välja, så de hinner se jobbsiffran.

## 2. AI-granskningen får aldrig blockera (steg 4)

I `canNext` för `step === 4`:
```js
if (aiAnalysis && !aiAnalysis.ok && aiAnalysis.issues?.length > 0) return false;  // TA BORT
```
- Ta bort den raden. AI:n ska föreslå, aldrig stoppa kontoskapande.
- Behåll AI-feedbacken visuellt (förslag/varningar), men den ska aldrig påverka `canNext`.

## 3. Gör presentationen frivillig (steg 4)

- Sänk tröskeln: tillåt att slutföra utan presentation. Behåll fältet och den mjuka
  uppmuntran ("✓ Bra! Det räcker."), men `canNext` för steg 4 ska returnera `true` även
  med tom text.
- Lägg en tydlig "Hoppa över – lägg till senare"-väg i steg 4.
- Motivering: vi lovar "två minuter" på välkomstsidan; en obligatorisk fritext är det
  tyngsta vi ber om, särskilt för nyutbildade. Den hör hemma i profilpåfyllnaden.

## 4. Lägg till fler körkort (steg 2)

Nuvarande `LICENSES` har bara C och CE. De seedade jobben filtrerar på B/BE/C/CE/D/DE.
- Lägg minst till **B** (och gärna BE). Behåll C/CE överst som de viktigaste.
```js
const LICENSES = [
  { c: "B",  d: "Personbil" },
  { c: "C",  d: "Tung lastbil" },
  { c: "CE", d: "Tung lastbil + släp" },
  // överväg: BE, D, DE beroende på om STP ska täcka buss
];
```
- Behåll logiken "B-körkort ingår automatiskt med C/CE" men visa den bara när B INTE redan
  är valt.
- Beslut för Oliver: ska STP täcka buss (D/DE)? Om nej, utelämna dem medvetet.

## 5. Segment-anpassad placeholder (steg 4, quick win)

Placeholdern säger "11 års vana" vilket inte passar en nyutbildad.
- Byt placeholder beroende på `draft.primarySegment` / `isGymnasieelev`:
  - FULLTIME: "Erfaren CE-chaufför med X års vana av fjärrkörning…"
  - FLEX: "Kör gärna extrapass och vikariat, van vid distribution i…"
  - INTERNSHIP: "Studerar till lastbilsförare, söker praktikplats (APL) för att…"

## Acceptanskriterier
- [ ] Done-skärmen visar antal matchande jobb + knapp till `/jobb` (förifiltrerad).
- [ ] Ingen AI-analys kan blockera "Skapa profil"-knappen.
- [ ] Onboarding går att slutföra utan presentationstext.
- [ ] Körkortssteget innehåller minst B utöver C/CE.
- [ ] Placeholder i steg 4 anpassas efter valt segment.
- [ ] Befintlig PostHog-tracking (`onboarding_step_completed`, `onboarding_completed`) behålls.

## Utanför scope
- Profil-sidans fält (separat — där bor hela TYA-taxonomin).
- Företagsonboarding (`CompanyOnboardingWizard.jsx`).

## Instruktion till Claude Code
Implementera punkt 1–3 först (störst effekt på konvertering), visa diff, fortsätt sedan med
4–5. Behåll mobil- och desktop-layout i synk. Hårdkoda inga texter som borde vara dynamiska.
