# STP — Implementations-spec (för Claude Code)

> **Kodbas:** React SPA (`/Users/harburt/Desktop/DriverMatch`). Frontend: Vite + React i `src/`. Backend: Express i `server/`. Driftsätts: Vercel (frontend) + Railway (backend).
> **Regel:** Varje HTML-fil ska implementeras **1:1** i sin React-motsvarighet — layout, struktur, färger, spacing, ikoner, sektionsordning. Inget gammalt ska finnas kvar. Mobilfiler definierar responsiv layout för samma komponent (en kodbas, inte separata filer). **Nämn aldrig Transportföretagen eller Sveriges Åkeriföretag (SÅ) — ta bort alla befintliga omnämnanden.**

## Implementeringsstatus

| HTML-fil | React-fil | Status |
|---|---|---|
| STP Landing Page Ljust.html | src/pages/Home.jsx | ✅ Klar |
| STP Auth Ljust.html | src/pages/Login.jsx | ⏳ Ej påbörjad |
| STP Lediga Jobb Ljust.html | src/pages/JobList.jsx | ⏳ Ej påbörjad |
| STP Jobbdetalj Ljust.html | src/pages/JobDetail.jsx | ⏳ Ej påbörjad |
| STP Jobbdetalj Åkeri-vy Ljust.html | src/pages/CompanyJobDetail.jsx | ⏳ Ej påbörjad |
| STP Förarprofil Ljust.html | src/pages/Profile.jsx | ⏳ Ej påbörjad |
| STP Åkeri Förarprofil Ljust.html | src/pages/DriverDetail.jsx | ⏳ Ej påbörjad |
| STP Åkeri Dashboard Ljust.html | src/pages/CompanyDashboard.jsx | ⏳ Ej påbörjad |
| STP Åkeri Annonser Ljust.html | src/pages/PostJob.jsx + CompanyJobList | ⏳ Ej påbörjad |
| STP Åkeri Hitta Förare Ljust.html | src/pages/DriverSearch.jsx | ⏳ Ej påbörjad |
| STP Åkeri Inkorg Ljust.html | src/pages/Messages.jsx | ⏳ Ej påbörjad |
| STP Åkeri Företagsprofil Ljust.html | src/pages/CompanyProfile.jsx | ⏳ Ej påbörjad |
| STP Åkeriprofil Ljust.html | src/pages/CompanyPublicProfile.jsx | ⏳ Ej påbörjad |
| STP Åkerier Ljust.html | src/pages/AkerierSearch.jsx | ⏳ Ej påbörjad |
| STP Åkeri Onboarding Ljust.html | src/pages/CompanyOnboardingWizard.jsx | ⏳ Ej påbörjad |
| STP Åkeri Verifiering Ljust.html | src/pages/CompanyVerification.jsx | ⏳ Ej påbörjad |
| STP Onboarding Förare Ljust.html | src/pages/DriverOnboardingWizard.jsx | ⏳ Ej påbörjad |
| STP Ansökan Ljust.html | src/pages/Apply.jsx | ⏳ Ej påbörjad |
| STP Inkorg Ljust.html | src/pages/Messages.jsx (förarvy) | ⏳ Ej påbörjad |
| STP Favoriter Ljust.html | src/pages/SavedJobs.jsx | ⏳ Ej påbörjad |
| STP Mina Ansökningar Ljust.html | src/pages/MinaAnsokningar.jsx | ⏳ Ej påbörjad |
| STP Inställningar Ljust.html | src/pages/Settings.jsx | ⏳ Ej påbörjad |
| STP PostJob Ljust.html | src/pages/PostJob.jsx | ⏳ Ej påbörjad |
| STP Notiser & Sök Ljust.html | src/pages/JobList.jsx (sökvy) | ⏳ Ej påbörjad |
| STP Juridik Ljust.html | src/pages/Terms.jsx + Privacy.jsx | ⏳ Ej påbörjad |
| STP Innehållssidor Ljust.html | src/pages/About.jsx + Kontakt.jsx | ⏳ Ej påbörjad |
| STP Felsidor Ljust.html | src/pages/NotFound.jsx | ⏳ Ej påbörjad |
| STP Dialoger Ljust.html | src/components/ (modals/dialogs) | ⏳ Ej påbörjad |
| STP States Ljust.html | Delade empty/loading/error-states | ⏳ Ej påbörjad |
| STP Admin Dashboard Ljust.html | src/components/admin/AdminOverviewTab.jsx | ⏳ Ej påbörjad |
| STP Admin Användare Ljust.html | src/components/admin/AdminUsersTab.jsx | ⏳ Ej påbörjad |
| STP Admin Åkerier Ljust.html | src/components/admin/ (companies-flik) | ⏳ Ej påbörjad |
| STP Admin Annonser Ljust.html | src/components/admin/ (jobs-flik) | ⏳ Ej påbörjad |
| STP Admin Verifieringar Ljust.html | src/components/admin/ (verifications-flik) | ⏳ Ej påbörjad |
| STP Admin Rapporter Ljust.html | src/components/admin/ (reports-flik) | ⏳ Ej påbörjad |
| STP Admin System Ljust.html | src/components/admin/ (system-flik) | ⏳ Ej påbörjad |
| STP Admin Inställningar Ljust.html | src/components/admin/ (settings-flik) | ⏳ Ej påbörjad |

**Mobilvyer** (implementeras i samma React-fil som desktop, med `isMobile`-hook):
STP Mobil Landing, Jobblista, Jobbdetalj, Förarprofil, Åkeriprofil, Åkerier, Ansökan, Inkorg, Sparat, Mina Ansökningar, Onboarding, Åkeri Dashboard, Åkeri Annonser, Åkeri Förarprofil, Åkeri Hitta Förare, Åkeri Inkorg, Åkeri Onboarding.

---



Den här filen är självbärande. En utvecklare som inte varit med i designarbetet ska kunna implementera STP utifrån den här + de bifogade HTML-filerna.

## Vad det här är
**Sveriges Transportplattform (STP)** — en direktmatchningsplattform mellan yrkesförare och åkerier, utan mellanhänder. Tre roller: **förare**, **åkeri**, **admin**.

De bifogade `... Ljust.html`-filerna är **designreferenser byggda i HTML/React (inline Babel) med hårdkodad data**. De är INTE produktionskod att kopiera rakt av. Uppgiften är att **återskapa designen i en riktig kodbas** (förslagsvis Next.js + TypeScript + en riktig databas) med kodbasens egna mönster. Designen är **hi-fi** — exakta färger, typografi och beteende ska följas pixel-troget.

**Startpunkt:** öppna `STP Översikt.html` för en klickbar karta över alla skärmar. Läs `HANDOFF.md` för designsystemet.

## Designsystem (källa: `stp-light-tokens.css` + `stp-light-components.jsx`)
- **Färger:** asfalt `--ink-900 #0a1a1a` (nav/text), paper `--paper #f5f2ec` (bakgrund), vägrön `--green #1F5F5C` (primär/CTA), bärnsten `--amber #C77A0E` (varning, sparsamt), + success/danger/info med tint-varianter.
- **Typografi:** DM Sans (text), JetBrains Mono (siffror/koder).
- **Komponenter** (återanvänd som motsvarigheter i kodbasen): TopNav, Card, Pill, Button, Field, Tabs, Avatar, Icon (monoline SVG), Notice, Stat. Exakta värden finns i `stp-light-tokens.css`.
- **Princip:** ljust tema, mono på all numerisk data, inga emojis, 60/30/10 paper/asfalt/accent.

## Skärminventering
Se `STP Översikt.html` för fullständig lista (~55 skärmar). Grupper:
- **Publikt:** Landing, Om/Blogg/Kontakt, Villkor & Integritet
- **Auth:** logga in, registrera (förare/åkeri), glömt lösenord, verifiera e-post, BankID
- **Förare:** profil, lediga jobb (+ Sverige-karta), jobbdetalj, ansökan, mina ansökningar, inkorg, favoriter, åkerier, åkeriprofil, inställningar, onboarding
- **Åkeri:** dashboard, hitta förare (talangkarta), annonser, skapa annons, ansökningar (kanban), förarprofil, företagsprofil, verifiering, inkorg, onboarding
- **Admin:** översikt, system, användare, åkerier, annonser, verifieringar, rapporter, inställningar
- **System-states:** felsidor (404/500/403/offline/underhåll), empty/loading states, dialoger, notiser & sök
- **Mobil:** hela förar- + åkeriflödet + landing (egen mobil-shell)

## Datamodell (skiss — härledd ur skärmarna, ska låsas innan kod)
- **User**: id, role (driver|company|admin), email, phone, name, region, verified, createdAt, lastLogin, suspended, warnings
- **DriverProfile**: userId, licenses[] (B/C1/C1E/C/CE/D), certificates[{type, status: valid|expiring|expired, expiry}], experience[{role, company, years, note}], segments[], regionsWilling[], availability, summary, openToWork, profileStrength, reviews[{companyId, rating, text, date}]
- **Company**: id, orgNr, name, region, verified, employees, fleet, founded, segments[], geography[], benefits[], description, rating, members[]
- **Job**: id, companyId, title, location, region, license[], certs[], employment (fast|vikariat|tim), schedule, salaryMin/Max/Note, status (active|paused|closed), aboutJob, tasks[], requirements[], offers[], createdAt
- **Application**: id, jobId, driverId, stage (applied|seen|review|selected|rejected), appliedAt, message, timeline, rejectReason
- **Conversation/Message**: participants, jobId, messages[{from, text, at, read}]
- **Verification**: companyId, docType (fskatt|trafiktillstand|kollektivavtal), status (next|review|done), uploadedAt
- **Report**: targetId, reporterId, reason, category, severity, status

## Matchningslogik (mockad — match-% är hårdkodad; ska byggas)
Match-procenten väger (admin-konfigurerbar, se `STP Admin Inställningar Ljust.html`): **körkort/behörighet 40 %, region/avstånd 25 %, erfarenhet 20 %, certifikat 15 %**. Sverige-kartan (`stp-sweden-map.jsx` + `stp-sweden-geo.js`) använder officiell läns-geometri och kan återanvändas både för "jobb per län" och "förare per län".

## Interaktioner & states som måste implementeras
- Ansökningsstatus-pipeline: Skickad → Sedd → I urval → Beslut (Utvald/Ej aktuell)
- Åkeri-kanban för kandidater (Nya → Granskar → Intervju → Anställd)
- Multi-state-filer (Auth, Felsidor, States, Dialoger) har inbyggd state-switcher som visar varje tillstånd
- Empty/loading states finns designade per vytyp (`STP States Ljust.html`)
- Destruktiva åtgärder kräver bekräftelse (`STP Dialoger Ljust.html` — "Radera konto" kräver inskrivet ord)

## Autentisering (se `STP Auth Ljust.html`)
Inloggning/registrering sker via: **Google SSO**, **Microsoft SSO**, samt **e-post + lösenord**. **BankID är planerat men inte implementerat än** — det visas i UI:t som nedtonat med "Kommer snart" och ska behållas men inte aktiveras i fas 1. Glömt lösenord + verifiera-e-post-flöden finns designade.

## Vad som är mockat (kopplas vid bygget)
Backend/databas, autentisering (SSO/e-post på riktigt), matchningsmotor, verifiering mot Bolagsverket, e-post/notiser, sök. All data i filerna är hårdkodade konstanter överst i varje fil.

## Rekommenderad MVP (fas 1)
Förar-sidan + ett fåtal manuellt onboardade åkerier: registrering → onboarding → förarprofil → lediga jobb → jobbdetalj → ansökan → mina ansökningar → inkorg. Spara admin, talangkarta-för-åkeri och avancerad matchning till senare faser.

## Att låsa innan kod
1. Teknikval (ramverk, hosting, databas)
2. Datamodellen ovan (verifiera/komplettera)
3. MVP-scope
4. Responsiv strategi: i produktion = EN responsiv kodbas, inte separata desktop/mobil-filer (mobilfilerna visar avsedd mobil-layout)

## Filer i paketet
Alla `STP ... Ljust.html` (aktuella skärmar) + 6 delade assets (`stp-light-tokens.css`, `stp-light-components.jsx`, `stp-sweden-map.jsx`, `stp-sweden-geo.js`, `stp-admin-shell.jsx`, `stp-mobile-shell.jsx`) + `STP Översikt.html` (index) + `HANDOFF.md`. Gamla mörka versioner ligger i `_arkiv_morkt/` och ska ignoreras.
