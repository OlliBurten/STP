# STP Mobil — Komplett Handoff

Mobil-redesign av STP-plattformen, både förare och åkeri. Alla designfiler är React+Babel-prototyper inkapslade i `IOSDevice` (iPhone 14 Pro, 390×844). Implementera mot befintlig `DriverMatch/`-kodbas som adaptiv layout (rekommenderat) eller separat mobil-bundle.

---

## Designprinciper

- **Bottom tab bar** för primär navigation (4 ikoner). iOS/Android standard.
- **Push-navigation** istället för split-pane (Inkorg lista → tråd är push, inte sidebyside).
- **Bottom sheets** för filter och val (drag-handle överst).
- **Sticky bottom CTAs** på detaljvyer (ersätter tab bar).
- **Touch targets ≥ 44px** överallt — inputs, knappar, list-rows.
- **Typografi:** rubriker 22–26px, brödtext 13.5–14px, 20px sidpadding.
- **Translucent headers** med backdrop-blur när scrollad (iOS-känsla).
- **Pulsande element** för olästa notifikationer och active states.

---

## Förare på mobil — KLART ✅

| Skärm | Designfil | Bottom tab |
|---|---|---|
| Onboarding (BankID + 3 frågor) | `STP Mobil Onboarding.html` | — |
| Jobblista (design anchor) | `STP Mobil Jobblista.html` | Jobb |
| Jobbdetalj | `STP Mobil Jobbdetalj.html` | Jobb |
| Ansökan (form + submitted) | `STP Mobil Ansökan.html` | — |
| Mina ansökningar | `STP Mobil Mina Ansökningar.html` | (Inkorg) |
| Inkorg (list + tråd push) | `STP Mobil Inkorg.html` | Inkorg |
| Sparat (jobb + åkerier) | `STP Mobil Sparat.html` | Sparat |
| Profil | `STP Mobil Förarprofil.html` | Profil |
| Åkerier (sök) | `STP Mobil Åkerier.html` | — |
| Åkeriprofil | `STP Mobil Åkeriprofil.html` | — |
| Inställningar | `STP Mobil Inställningar.html` | (Profil) |

### Bottom nav (förare)
| Tab | Ikon | Hör till |
|---|---|---|
| Jobb | `briefcase` | Jobblista, Jobbdetalj, Åkerier |
| Sparat | `star` | Sparat (jobb + företag) |
| Inkorg | `msg` (badge) | Inkorg, Mina ansökningar |
| Profil | `user` | Profil, Inställningar |

### Onboarding-strategi (kritisk för låg churn)

**Mål: < 30 sek från klick till registrerad. < 90 sek till första matchning visad.**

1. **BankID primärt** (autofyller namn/ålder/personnummer)
2. **Email sekundärt** men jämnt visuellt
3. **Endast 3 frågor:** ort, körkort, söker-status
4. **YKB/ADR/certifikat askas EJ i onboarding** — JIT-prompts senare när föraren försöker söka jobb som kräver det
5. **Done-state visar VÄRDE direkt:** "Vi har hittat 12 jobb som matchar dig" + top 2 preview
6. **Profilkomplettering = mjuk nudge**, aldrig blocker

---

## Åkeri på mobil — KLART ✅

| Skärm | Designfil | Bottom tab |
|---|---|---|
| Onboarding (Bolagsverket + 3 steg) | `STP Mobil Åkeri Onboarding.html` | — |
| Dashboard | `STP Mobil Åkeri Dashboard.html` | Översikt |
| Annonser (list + kandidatpipeline) | `STP Mobil Åkeri Annonser.html` | Annonser |
| Hitta förare | `STP Mobil Åkeri Hitta Förare.html` | Förare |
| Förarprofil (åkeri-perspektiv) | `STP Mobil Åkeri Förarprofil.html` | — |
| Inkorg (list + tråd push) | `STP Mobil Åkeri Inkorg.html` | Inkorg |
| Inställningar (gemensam fil) | `STP Mobil Inställningar.html` | — |

### Bottom nav (åkeri)
| Tab | Ikon | Hör till |
|---|---|---|
| Översikt | `briefcase` | Dashboard |
| Annonser | `plus` | Annonser, Jobb-detalj med pipeline |
| Förare | `user` | Hitta förare, Förarprofil |
| Inkorg | `msg` (badge) | Inkorg, kandidat-meddelanden |

### Onboarding-strategi (åkeri)

1. **Bolagsverket auto-fetch** via org.nr — autofyller företagsnamn, adress, ort
2. **3 steg:** företag → kontaktperson → verksamhet (segment + storlek)
3. **Done-state stack:** Verifiera (primary) → Publicera annons → Komplettera profil

---

## Inställningar — KLART ✅

Båda rollerna i samma fil (`STP Mobil Inställningar.html`) med role-switcher för prototyping.

**Förare (5 sektioner):**
1. Konto — personuppgifter, lösenord, ta bort konto
2. Sökpreferenser — körkort, anställningsform, region, lägsta lön (slider)
3. Verifiering — körkort, YKB, ADR, CV med upload-status & utgångsdatum
4. Notiser — vad (matchningar/meddelanden/status/nyhetsbrev) + hur (email/push/SMS)
5. Sekretess — 3 nivåer av profilsynlighet + blockerade åkerier

**Åkeri (4 sektioner):**
1. Företagsuppgifter
2. Team — medlemslista, bjud in
3. Verifiering — F-skatt, kollektivavtal, trafiktillstånd
4. Notiser — ansökningar, meddelanden, veckorapport, tips

**Pattern:** iOS Settings-style — index med ikon-rader → push till detaljskärm med back-knapp.

---

## Komponenter att bygga som delade

- `<MobileHeader>` — logo + bell + avatar
- `<BottomNav active>` — 4-tab bar med badge support, olika tabs för förare vs åkeri
- `<BottomSheet open onClose>` — för filter och val
- `<PushView back>` — push-navigation (Inkorg-tråd, Settings-detalj)
- `<StickyBottomCTA>` — för detaljvyer
- `<TranslucentHeader scrolled>` — header som blir solid vid scroll
- `<MatchRing pct size>` — animerad ring (finns från desktop)
- `<UploadZone>` — drag-drop file upload
- `<Toggle on onChange>` — iOS-style toggle (44x26px)

---

## Implementation som adaptiv vs separat bundle

**Alternativ A — Adaptiv (rekommenderat):**
- Samma React-komponenter, breakpoint-baserad rendering
- `useIsMobile()`-hooken finns redan i `DriverMatch/src/hooks/`
- Bottom nav renderar bara på mobile
- Header får mobil-variant (hamburger)
- Layout-shifts hanteras med Tailwind `md:`-prefix

**Alternativ B — Separat mobil-bundle:**
- Egen route `/m/*` med mobil-komponenter
- Större jobb men full kontroll över UX

---

## Backend-noter

Inga nya endpoints jämfört med desktop. Men för mobil:

- **BankID-integration** — kräver leverantör (Signicat, Scrive). ~5kr/auth.
- **Bolagsverket-lookup** — finns API. Alternativ: Allabolag.se.
- **Push-notifications** — `PushSubscription`-modellen finns i Prisma. Service worker behövs.
- **JIT profile prompts** — backend returnerar "missing fields for this job" baserat på `Job.requirements` vs `DriverProfile`.

---

## Mönsterskillnader desktop vs mobil

| Mönster | Desktop | Mobil |
|---|---|---|
| Primär navigation | Top horizontal nav | Bottom tab bar |
| Filter | Sidopanel/drawer | Bottom sheet |
| Inkorg | Split-pane | Push (list → thread) |
| Detalj | Höger panel | Modal eller egen sida |
| Settings | Vänster sidebar + content | Index → push till detalj |
| CTAs | I header | Sticky bottom |
| Tabs | Top tab strip | Sticky efter hero |

---

## Sammanfattning av status

| Yta | Desktop | Mobil |
|---|---|---|
| Förare onboarding | ✅ | ✅ |
| Förare inloggat | ✅ | ✅ |
| Förare publika sidor | ✅ | ✅ |
| Åkeri onboarding | ✅ | ✅ |
| Åkeri inloggat | ✅ | ✅ |
| Landing / marketing | ✅ (delar) | ⚠️ (Home är responsiv, ej fullt redesignad) |

---

## Vad som INTE är gjort

- **Landing pages mobil** — er nuvarande Home.jsx är redan responsiv med isMobile-flaggor. Vi gjorde ett design system-pass (`STP Mobil Landing System.html`) men inte full redesign. Resterande landing-sidor (ForDrivers, ForCompaniesLanding, About, Blog, etc.) använder samma mönster.
- **SEO-landningssidor** (RegionJobList, CityJobList) — använder samma mall-mönster.
- **Verktyg på mobil** (Lönekalkylator, YKB Timer) — finns desktop, mobil ej granskad.
- **Edge cases på mobil** — borttaget jobb, expired session, offline-läge.
