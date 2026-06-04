# STP – Handoff (uppdaterad)

Komplett mörkt-tema redesign av STP-plattformen. Alla designfiler ligger i projektets root som `STP *.html` (React+Babel-prototyper). Implementera mot befintlig `DriverMatch/`-kodbas.

---

## Designprinciper (kärnregler)

- **Bakgrund:** `#060f0f` page · `#0a1414` cards · `#1F5F5C` teal accent · `#F5A623` orange primary · `#4ade80` success
- **Typografi:** DM Sans 400–900, letter-spacing -0.3 till -1.2 på rubriker
- **Layout:** ofta en smal centrerad kolumn (520–880px max). Lugn vit-yta, inte tätt packad
- **Lastbilsbransch, inte tech:** undvik tech-jargong. Stora knappar, tydliga val, ingen onödig animation
- **Match-score är kärnan:** alltid synlig som ring eller chip (≥85% grön, 65–84% amber, <65% blå/grå)
- **Header på alla åkerisidor:** logo + Översikt/Annonser/Hitta förare/Inkorg + Publicera jobb + notif + företagsavatar

---

## Förarens sida — KLART ✅

| Sida | Route | Designfil |
|---|---|---|
| Onboarding | `/onboarding/forare` | `STP Onboarding Förare.html` |
| Profil | `/profil` | `STP Förarprofil.html` |
| Lediga jobb | `/jobb` | `STP Lediga Jobb.html` |
| Jobbdetalj | `/jobb/:id` | `STP Jobbdetalj v3.html` |
| Ansökan | `/jobb/:id/ansok` | `STP Ansökan.html` |
| Mina ansökningar | `/mina-ansokningar` | `STP Mina Ansökningar.html` |
| Inkorg | `/meddelanden` | `STP Inkorg.html` |
| Sök åkerier | `/akerier` | `STP Åkerier.html` |
| Åkeriprofil (publik) | `/foretag/:id` | `STP Åkeriprofil.html` |
| Favoriter | `/favoriter` | `STP Favoriter.html` |
| Inställningar | `/installningar` | `STP Inställningar.html` |

---

## Åkeriets sida — KLART ✅

| Sida | Route | Designfil |
|---|---|---|
| Onboarding (signup) | `/foretag/onboarding` | `STP Åkeri Onboarding.html` |
| Dashboard | `/foretag` | `STP Åkeri Dashboard v3.html` |
| Mina annonser | `/foretag/annonser` | `STP Åkeri Annonser.html` |
| Publicera jobb | `/foretag/annonser/ny` | `STP PostJob.html` |
| Jobbdetalj (kandidater) | `/foretag/annonser/:id` | `STP Jobbdetalj Åkeri-vy.html` |
| Hitta förare | `/foretag/forare` | `STP Åkeri Hitta Förare.html` |
| Förarprofil (åkeri-vy) | `/foretag/forare/:id` | `STP Åkeri Förarprofil.html` |
| Inkorg | `/foretag/inkorg` | `STP Åkeri Inkorg.html` |
| Verifiering | `/foretag/verifiering` | `STP Åkeri Verifiering.html` |
| Företagsprofil (edit) | `/foretag/profil` | `STP Åkeri Företagsprofil.html` |
| Inställningar | `/foretag/installningar` | `STP Inställningar.html` (åkeri-flik) |

---

## Nyckelflöden mellan sidor

**Åkeri-rekrytering:**
```
Onboarding → Verifiering → Publicera annons → Mina annonser
                                      ↓
                          Jobbdetalj/kandidater
                                      ↓
                       Hitta förare ←→ Förarprofil
                                      ↓
                                   Inkorg
```

**Förar-ansökning:**
```
Jobb → Jobbdetalj → Ansökan → Mina ansökningar → Inkorg
```

---

## Datakontrakt (Prisma)

```prisma
model Job {
  // ... befintliga fält
  aboutJob          String?  @db.Text   // "Om jobbet"
  responsibilities  String[]            // "Arbetsuppgifter"
  requirements      String[]            // "Vi söker dig som"
  benefits          Json?               // [{ icon, title, desc }]
  matchScoreSeed    Int?                // för seed/demo
}

enum ApplicationStage {
  NEW
  CONTACTED
  INTERVIEWING
  SELECTED
  REJECTED
}

model Company {
  // ... befintliga fält
  verificationStatus VerificationStatus
  fSkattVerified     Boolean
  trafiktillstandVerified Boolean
  kollektivavtal     KollektivavtalType?  // YES_TRANSPORT, INDIVIDUAL, NO
}
```

---

## Delade komponenter att bygga

- `<Header role="driver|company">` — med notif-dropdown + avatar-meny (✅ finns i kod)
- `<MatchRing percent>` — animerad SVG-ring
- `<MatchChip percent>` — kompakt match-badge
- `<StatusPill stage>` — pipeline-stage färgkodad
- `<EmptyState icon title desc cta>`
- `<VerificationGate>` — checklist + upload
- `<DriverCard variant="row|grid">` 
- `<UploadZone onUpload>` — drag-drop

---

## Implementationsstatus i kod (per nov 2025)

**Förare:** Alla sidor implementerade i mörkt tema. Filer i `DriverMatch/src/pages/` matchar designen.

**Åkeri:** Pages som matchar:
- ✅ `MinaJobb.jsx` — matchar `STP Åkeri Annonser.html`
- ✅ `CompanyJobDetail.jsx` — matchar `STP Jobbdetalj Åkeri-vy.html`
- ✅ `PostJob.jsx` — matchar `STP PostJob.html`
- ✅ `CompanyProfile.jsx` — matchar `STP Åkeri Företagsprofil.html` (kan uppdateras med tabs)
- ⚠️ `DriverSearch.jsx` — använder gamla CSS-variabler, **behöver omimplementeras** mot `STP Åkeri Hitta Förare.html`
- ⚠️ `DriverDetail.jsx` — basic implementation, **behöver lyftas** mot `STP Åkeri Förarprofil.html`

**Nya routes som behöver läggas till:**
- `/foretag/verifiering` → `STP Åkeri Verifiering.html`
- `/foretag/onboarding` → `STP Åkeri Onboarding.html` (kan ersätta `CompanyOnboardingWizard.jsx`)
- `/foretag/inkorg` → `STP Åkeri Inkorg.html` (separat från förarens inkorg)

---

## Quick wins att implementera först

1. **`DriverSearch` redesign** — använd `STP Åkeri Hitta Förare.html` exakt. Stor visuell skillnad mot gammal version.
2. **Verifieringsflöde** — kritisk path för nya åkerier. Routes + komponenter från `STP Åkeri Verifiering.html`.
3. **Åkeri-onboarding** — auto-fyllning från Bolagsverket via org-nr. Kräver backend-endpoint för Bolagsverket-lookup.

---

## Backend-endpoints som behövs

```
POST   /api/companies/bolagsverket-lookup   { orgnr } → { name, address, city, postalCode }
POST   /api/companies/verification/upload   { type, file } → { uploadId, status }
GET    /api/companies/verification          → { steps: [{ id, status, verifiedAt? }] }
PUT    /api/applications/:id/stage          { stage } — flytta i pipeline
GET    /api/drivers/match-against?jobId=    — sorterade på match mot specifikt jobb
POST   /api/drivers/:id/save                — åkeri sparar förare som favorit
```

---

## Öppna frågor / beslut

1. **Match-score-algoritm:** vi visar % överallt men exakt formel är inte specificerad. Behövs viktning av: körkort (krav-match), region-overlap, erfarenhet, certifikat, tillgänglighet, segment.
2. **Pipeline-pricing:** ska "Anställd"-stage trigga någon avgift? Förslag i tidigare diskussion men inte beslutat.
3. **Verifierings-SLA:** vi lovar "1 arbetsdag" i UI. Behöver bekräftas operationellt.
4. **Auto-fyllning Bolagsverket:** integration kostar pengar — finns alternativ via Allabolag.se?
5. **Mobil-versioner:** allt är designat för desktop. Mobile redesign kommer i nästa fas.

---

## Skillnad från förra handoffen

**Nytt sedan förra handoffen:**
- Åkeri Dashboard v3 (ersätter v2)
- Åkeri Annonser (helt ny)
- Åkeri Hitta Förare (helt ny, ersätter `DriverSearch.jsx`)
- Åkeri Förarprofil (helt ny, ersätter `DriverDetail.jsx`)
- Åkeri Inkorg (helt ny — åkeri-version av `Messages.jsx`)
- Åkeri Verifiering (helt ny)
- Åkeri Onboarding (helt ny, ersätter `CompanyOnboardingWizard.jsx`)
- Åkeri Företagsprofil (omdesignad version av `CompanyProfile.jsx`)

**Designprincip etablerad:** minimalistisk centrerad kolumn istället för dashboard-täthet. Filter dolda bakom knapp. Detalj som modal eller separat sida, inte sidopanel. Lugn vit-yta över tätpackad info.
