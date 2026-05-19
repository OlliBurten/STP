# STP — Handoff till Claude Code

Komplett redesign av STP-plattformen (Sveriges Transportplattform). Mörkt tema, DM Sans, primärfärger `#060f0f` (bg), `#0a1414` (cards), `#F5A623` (amber primary), `#1F5F5C` (teal), `#4ade80` (success).

Alla designfiler ligger i projektets root som `STP *.html`. De är React+Babel-prototyper (inline JSX) — använd dem som visuell referens, inte som kodbas. Implementera mot befintlig `DriverMatch/`-kodbas.

---

## 1. Designprinciper

- **Mörkt tema genomgående.** Alla sidor (både förare och åkeri inloggat). Ljust tema är borttaget.
- **DM Sans 400/500/600/700/800/900.** Letter-spacing -0.3 till -1.2 på rubriker.
- **Card-radius:** 14–18px. Borders: `rgba(255,255,255,0.05)` default, `0.1` på hover.
- **Konsekvent header** på alla inloggade sidor: logo + nav-tabs vänster, "Publicera jobb" CTA (åkeri) eller search (förare) + notif-bell + avatar-dropdown höger.
- **Notif-dropdown** är samma komponent överallt — färgkodade prickar per typ (selected=grön, message=amber, match=lila, view=cyan).
- **Match-score** är kärnan — alltid synlig som procentring eller chip (≥80% grön, 65–79% amber, <65% neutral).

---

## 2. Förarens inloggade del — KLART

| Sida | Route | Designfil |
|---|---|---|
| Onboarding | `/onboarding` | `STP Onboarding Förare.html` *(tidigare)* |
| Min profil | `/profil` | `STP Förarprofil.html` *(tidigare)* |
| Lediga jobb | `/jobb` | `STP Lediga Jobb.html` |
| Jobbdetalj | `/jobb/:id` | `STP Jobbdetalj v3.html` |
| Ansökan + submitted | `/jobb/:id/ansok` | `STP Ansökan.html` |
| Mina ansökningar | `/mina-ansokningar` | `STP Mina Ansökningar.html` |
| Inkorg | `/meddelanden` | `STP Inkorg.html` |
| Sök åkerier | `/akerier` | `STP Åkerier.html` |
| Åkeriprofil (publik) | `/foretag/:id` | `STP Åkeriprofil.html` |
| Favoriter | `/favoriter` | `STP Favoriter.html` |
| Inställningar | `/installningar` | `STP Inställningar.html` |
| Edge-cases | — | `STP Jobb Felstates.html` |

### Nyckelförändringar för förare
- **Jobbdetalj v3:** alltid 4 sektioner (Om jobbet / Arbetsuppgifter / Vi söker dig som / Vi erbjuder). AI fyller saknade sektioner. Sticky CTA-panel höger med match-ring + breakdown. Premium look oavsett hur lite åkeriet skrivit.
- **Lediga jobb:** 3 sub-tabs (Alla / Rekommenderade ≥80% / Sparade).
- **Mina ansökningar:** funnel per ansökan (Skickad → Sedd → I urval → Beslut).
- **Ansökan:** 1-stegs form med live-preview av vad åkeriet ser. Submitted-state visar "Vad händer nu?" + åkeriets svarsstatistik.
- **Inställningar:** delas för förare/åkeri — 5 sektioner förare (Konto / Sökpreferenser / Notiser / Integritet / Säkerhet).

---

## 3. Åkeriets inloggade del — PÅGÅR

### Klart
| Sida | Route | Designfil |
|---|---|---|
| Dashboard | `/foretag` | `STP Åkeri Dashboard v3.html` |
| Mina annonser + kandidatpipeline | `/foretag/annonser` | `STP Åkeri Annonser.html` |
| Publicera jobb | `/foretag/annonser/ny` | `STP PostJob.html` |
| Jobb-vy (åkeri-perspektiv) | `/foretag/annonser/:id` | `STP Jobbdetalj Åkeri-vy.html` |
| Inställningar (åkeri-flikar) | `/foretag/installningar` | `STP Inställningar.html` |

### Kvar att bygga (prioritetsordning)
1. **Hitta förare (proaktivt sök)** — filter på segment/region/erfarenhet/körkort, spara förarprofiler, direktmeddelande.
2. **Förarprofil från åkeri-perspektiv** — vad åkeriet ser vid klick på en kandidat.
3. **Inkorg för åkeri** — flera företag i dropdown, conversation-vy (mörkt tema, ersätter den nuvarande ljusa).
4. **Företagsprofil edit** — sektionerad med live-preview av publika `STP Åkeriprofil.html`.
5. **Verifieringsflöde** — riktigt uppladdningsflöde (F-skattsedel, trafiktillstånd). Just nu bara gate-state i Dashboard v3.
6. **Åkerionboarding (signup)** — företagsregistrering, abonnemangsval.

### Nyckelförändringar för åkeri (jämfört med nuvarande)
- **Dashboard v3:** ersätter `JobDetail`/`CompanyDashboard`-tomheten. Hero med "Du har X nya kandidater". KPIs (Nya ansökningar, Obesvarade meddelanden, Aktiva annonser, Profilvisningar). Aktivitetsfeed med snabb-actions (Granska/Svara). "Era annonser" sidebar med pipeline per jobb. "Förare som matchar era annonser" som proaktiv prompt. Verification gate visas bara när `verified === false`.
- **Mina annonser:** lista-vy + detalj med kandidatpipeline (Nya / Kontaktade / Intervjuade / Anställda / Avslagna). "Flytta till nästa steg" på varje kandidat.
- **Publicera jobb:** 4-stegs formulär (Grundinfo → Roll → Krav → Förmåner) som mappar 1:1 till `Jobbdetalj v3`. Live-preview höger. Ersätter det enda stora `description`-fältet + AI-genereringen i nuvarande `PostJob.jsx`.

---

## 4. Datakontrakt / Prisma-tillägg

För att Jobbdetalj v3 ska kunna garantera 4 strukturerade sektioner behöver `Job`-modellen utökas:

```prisma
model Job {
  // ... existing fields
  aboutJob          String?  @db.Text  // "Om jobbet" — fri text
  responsibilities  String[] // "Arbetsuppgifter" — punktlista
  requirements      String[] // "Vi söker dig som" — punktlista
  benefits          Json?    // [{ icon, title, desc }]
  matchScoreSeed    Int?     // för demo/seed
}
```

Pipeline-status per ansökan:
```prisma
enum ApplicationStage {
  NEW
  CONTACTED
  INTERVIEWED
  HIRED
  REJECTED
}
```

---

## 5. Komponenter att bygga som delade React-komponenter

- `<Header role="driver|company">` — med notif-dropdown och avatar-meny
- `<MatchRing percent>` — animerad SVG-ring, färg per spann
- `<MatchChip percent>` — kompakt version för listor
- `<JobCardDriver>` / `<JobCardCompany>` — olika men delar tokens
- `<EmptyState icon title desc cta>` — för Favoriter, Inkorg, Mina annonser
- `<NotifDropdown items>` — global notification feed
- `<VerificationGate steps>` — uppladdning + status

---

## 6. Att göra först i kod

1. **Lägg in mörkt tema som default.** Befintliga ljusa sidor (Inkorg, Favoriter, Mina ansökningar) måste få samma DM Sans + tokens.
2. **Bygg `<Header>`-komponenten** med notif-dropdown — den används överallt.
3. **Jobbdetalj v3 + PostJob** är den största värdebyggaren — det 4-sektionsschemat behöver finnas i DB innan annonser kan migreras.
4. **Implementera match-score** som ett backend-fält (`matchScore` per förare+jobb-par), inte bara UI.
5. **Bygg kandidatpipeline** (ApplicationStage enum + drag/click between stages).

---

## 7. Filer i denna folder att referera till

Öppna `.html`-filerna i webbläsaren för att se exakt design + tweaks. Source-koden är fullständigt inline (DOM + styles + state) — kopiera token-värden, layouts och copywriting direkt därifrån.

Tweaks-panelen längst ner till höger på varje sida visar state-variationer (verified/unverified, tom/med data, olika åkeristorlek, etc).
