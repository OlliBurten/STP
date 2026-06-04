# STP Mobil – Handoff (förare)

Mobil-redesign av STP-plattformen — förarens sida. Alla designfiler är React+Babel-prototyper inkapslade i `IOSDevice` (iPhone 14 Pro, 390×844). Implementera mot befintlig `DriverMatch/`-kodbas, antingen som adaptiv layout eller separat mobil-bundle.

---

## Designprinciper (mobil-specifika)

- **Bottom tab bar** för primär navigation (4 ikoner: Jobb / Sparat / Inkorg / Profil). Standard iOS/Android-mönster.
- **Push-navigation** istället för split-pane (Inkorg lista → tråd är push, inte sidebyside).
- **Sticky bottom CTAs** på detaljvyer (ersätter tab bar på dessa skärmar).
- **Bottom sheets** för filter/options istället för sidobars eller modal-mitten.
- **Touch targets ≥ 44px** överallt — inputs, knappar, list-rows.
- **Typografiskala mindre:** rubriker 22–26px (mot 30–36 på desktop), brödtext 13.5–14px.
- **Centrerade layouts**, 20px sidpadding genomgående.
- **Translucent headers** med backdrop-blur när scrollad (iOS-känsla).
- **Pulsande element** för olästa notifikationer och active states.

---

## Förare på mobil — KLART ✅

| Skärm | Designfil | Motsvarar desktop |
|---|---|---|
| Onboarding (BankID + 3 frågor) | `STP Mobil Onboarding.html` | `STP Onboarding Förare.html` |
| Jobblista (anchor) | `STP Mobil Jobblista.html` | `STP Lediga Jobb.html` |
| Jobbdetalj | `STP Mobil Jobbdetalj.html` | `STP Jobbdetalj v3.html` |
| Ansökan (form + submitted) | `STP Mobil Ansökan.html` | `STP Ansökan.html` |
| Mina ansökningar | `STP Mobil Mina Ansökningar.html` | `STP Mina Ansökningar.html` |
| Inkorg (list + tråd) | `STP Mobil Inkorg.html` | `STP Inkorg.html` |
| Profil | `STP Mobil Förarprofil.html` | `STP Förarprofil.html` |
| Sparat (jobb + åkerier) | `STP Mobil Sparat.html` | `STP Favoriter.html` |
| Åkerier (sök) | `STP Mobil Åkerier.html` | `STP Åkerier.html` |
| Åkeriprofil | `STP Mobil Åkeriprofil.html` | `STP Åkeriprofil.html` |

---

## Onboarding-strategi (kritiskt)

**Mål: < 30 sek från klick till registrerad. < 90 sek till första matchning visad.**

**Implementation:**
1. **BankID primärt** (svenskt standardmönster — får namn/ålder/pers.nr gratis)
2. **Email sekundärt** men jämnt prioriterad visuellt
3. **Endast 3 frågor i wizarden:** ort, körkort, söker-status
4. **YKB, ADR, certifikat ASKAS INTE i onboarding** — kommer som just-in-time prompts:
   - När föraren försöker söka ett ADR-jobb → prompt "Lägg till ADR för att fortsätta"
   - När de byter till mer aktivt sök-läge → prompt om CV-text
5. **Done-state visar VÄRDE direkt** — "Vi har hittat 12 jobb som matchar dig" + Top 2 jobb preview
6. **Profilkomplettering = mjuk nudge**, inte blocker

---

## Bottom tab bar (4 items)

Konsekvent på alla huvudvyer:

| Tab | Icon | Hör till |
|---|---|---|
| Jobb | `briefcase` | Jobblista, Jobbdetalj |
| Sparat | `star` | Sparat (jobb + företag) |
| Inkorg | `msg` (med badge) | Inkorg, Mina ansökningar |
| Profil | `user` | Profil, Inställningar |

**Notera:** Mina ansökningar är inte en egen tab — istället accessas den från Sparat-flikens "Ansökningar"-länk (om man väljer att göra det) eller från Inkorg (vilka är samma data). Detta kan diskuteras — alternativ är att göra Inkorg → Ansökningar.

---

## Komponenter att bygga som delade

Mobil-specifika:

- `<MobileHeader>` — logo + bell + avatar
- `<BottomNav active>` — 4-tab bar med badge support
- `<BottomSheet open onClose>` — för filter, val
- `<PushView back>` — för push-navigation (Inkorg-tråd, etc.)
- `<StickyBottomCTA>` — för detaljvyer
- `<MobileJobCard>` — mindre version av jobbkort
- `<TranslucentHeader scrolled>` — header som blir solid vid scroll
- `<MatchRing pct size>` — finns från desktop, fungerar mobil

---

## Implementation som adaptiv vs. separat bundle

**Alternativ A — Adaptiv (rekommenderat):**
- Samma React-komponenter, breakpoint-baserad rendering
- `useIsMobile()`-hooken finns redan i `DriverMatch/src/hooks/`
- Bottom nav komponent renderar bara på mobile
- Header får mobile-variant
- Layout-shifts hanteras med Tailwind `md:`-prefix

**Alternativ B — Separat mobil-bundle:**
- Egen route `/m/*` med mobil-komponenter
- Större jobb men full kontroll över UX

---

## Backend-överväganden

Inga nya endpoints behövs jämfört med desktop-handoff. Men:

- **BankID-integration** — kräver BankID-leverantör (signicat, scrive, etc.). Cost: ~5kr/auth.
- **Push-notifications** — `PushSubscription`-modellen finns redan i Prisma-schema. Behöver bara browser push setup + service worker.
- **Just-in-time profile prompts** — backend behöver kunna returnera "missing fields for this job" baserat på Job.requirements vs DriverProfile.

---

## Nästa steg

1. **Åkeri på mobil** — inte gjort ännu. Lägre prio (rekryterare jobbar mest desktop). Men onboarding + dashboard + jobbdetalj + inkorg är hygienkrav.
2. **Inställningar-detaljskärmar** — Notiser, Integritet, Konto-skärmarna är inte detaljerade än. Mönstret är etablerat (settings-list-rows) — borde vara snabba.
3. **Edge cases** — borttaget jobb på mobil, expired session, offline, etc.

---

## Sammanfattning av status

| Yta | Desktop | Mobil |
|---|---|---|
| Förare (publika) | ✅ | ✅ |
| Förare (inloggat) | ✅ | ✅ |
| Åkeri (publika) | ✅ | ❌ |
| Åkeri (inloggat) | ✅ | ❌ |
| Landing / marketing | ⚠️ (delar redesignat, hela ej granskat) | ❌ |
