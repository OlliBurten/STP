# Handoff: STP Landing Page Redesign

## Overview

Detta är ett komplett designhandoff för en omdesignad landing page för **Sveriges Transportplattform (STP)** – transportplattformen.se. Designen täcker hela sidan från hero till footer och är byggd för att ersätta den befintliga `src/pages/Home.jsx`.

---

## Om designfilerna

Filerna i detta paket är **high-fidelity HTML-prototyper** skapade som designreferens – inte produktionskod avsedd att kopieras direkt. Din uppgift är att **återskapa dessa designs i den befintliga React-kodbasen** (Vite + React + Tailwind) med befintliga patterns och komponenter. Följ STP:s befintliga kodstil, routing, auth-kontext och komponentstruktur.

**Fidelity: High-fidelity.** Pixel-precise färger, typografi, spacing och interaktioner. Återskapa UI:t så nära originalet som möjligt med befintliga bibliotek.

---

## Designfiler i paketet

| Fil | Beskrivning |
|-----|-------------|
| `STP Landing Page.html` | Hela landing page-designen med 3 tema-varianter |
| `STP Ad Campaign.html` | Annons-kreativ (Story, Feed, LinkedIn) – referens |
| `STP Mobilprototyp.html` | Mobilapp-prototyp (swipe-matchning, profil, kalender) |
| `hero.png` | Hero-bakgrundsbild (lastbil) |
| `hero-driver.png` | Hero-bild för förare (används i CTA-sektionen) |
| `hero-company.png` | Hero-bild för åkerier |

---

## Rekommenderat tema att implementera

Implementera **"Direkt" (mörkt)** temat som primärt. Det är det mest distinkta och moderna. De andra temana (Signal/Teal, Editorial/Vit) kan läggas till som framtida varianter.

---

## Sektioner & Layout

### 1. Nav (Header)
**Ersätter:** `src/components/Header.jsx` – public-läget

- **Layout:** `position: fixed`, `height: 64px`, full-width, `backdrop-blur` vid scroll
- **Bakgrund:** Transparent → `rgba(5,14,14,0.92)` + `blur(12px)` vid scroll
- **Logo:** `STPLogo`-komponenten (befintlig `Logo.jsx`) – `height: 36px`, vit variant
- **Nav-länkar:** "Lediga jobb", "För förare", "För åkerier", "Om STP" – `fontSize: 14px`, `fontWeight: 500`, `color: rgba(255,255,255,0.75)`, hover → `opacity: 1`
- **CTA-knappar:** "Logga in" (ghost) + "Skapa konto" (`background: #F5A623`, `color: #000`, `borderRadius: 10px`, `padding: 9px 18px`)
- **Scroll-trigger:** Lägg till scroll event listener, sätt `scrolled` state vid `window.scrollY > 40`

---

### 2. Hero
**Ersätter:** Befintlig hero-sektion i `Home.jsx`

- **Layout:** `min-height: 100vh`, CSS grid `1fr 1fr`, `gap: 80px`, `padding: 120px 40px 80px`, `max-width: 1200px` centrerat
- **Bakgrund:** `hero.png` som bakgrundsbild, `opacity: 0.18` + dark overlay `linear-gradient(160deg, #050e0e, #0d2b2b, #0a1a1a)`
- **Radial glow:** `radial-gradient(ellipse 80% 60% at 70% 40%, rgba(31,95,92,0.35), transparent)`
- **Bottom fade:** `linear-gradient(to top, #060f0f, transparent)` – 200px höjd

**Vänster kolumn:**
- Beta-pill: `background: rgba(245,166,35,0.15)`, `border: 1px solid rgba(245,166,35,0.3)`, `borderRadius: 99px`, amber text `#F5A623`, `fontSize: 12px`, `fontWeight: 700`, `letterSpacing: 1px`, UPPERCASE
- **Rubrik H1:** `fontSize: clamp(60px, 6.5vw, 92px)`, `fontWeight: 900`, `letterSpacing: -4px`, `lineHeight: 0.9`, `color: #fff`
  - Rad 1: "Rätt" – vit
  - Rad 2: Roterande ord (Förare./Åkeri./Match.) – `color: #F5A623`, fade-transition med `opacity` + `transform: translateY` – byt ord var 2.8s med 300ms fade-ut/in
  - Rad 3: "Direkt." – `fontWeight: 300`, `opacity: 0.2`
- **Undertext:** `fontSize: 19px`, `color: rgba(255,255,255,0.7)`, `lineHeight: 1.7`, `maxWidth: 460px`
- **CTA-knappar:**
  - Primär: `background: #F5A623`, `color: #000`, `fontWeight: 800`, `padding: 16px 34px`, `borderRadius: 12px`
  - Sekundär: `background: rgba(255,255,255,0.08)`, `color: #fff`, `border: 1px solid rgba(255,255,255,0.18)`
- **Stat-rad:** 3 kolumner, `paddingTop: 40px`, `borderTop: 1px solid rgba(255,255,255,0.08)`, `marginTop: 56px`
  - Värden: "4 080" / "36%" / "Gratis"
  - `fontSize: 30px`, `fontWeight: 900`, `color: #fff`, `letterSpacing: -1px`
  - Etiketter: `fontSize: 12px`, `color: rgba(255,255,255,0.6)`, `lineHeight: 1.5`

**Höger kolumn:**
- **Match-kort:** `background: rgba(255,255,255,0.04)`, `border: 1px solid rgba(255,255,255,0.08)`, `borderRadius: 20px`, `backdropFilter: blur(16px)`, `padding: 24px 28px`
  - Header: "NY MATCH" label + grön Live-badge
  - 3 förare med avatar (initialer), namn, ort/licens, matchprocent (94% grön, 81%/76% amber)
  - Dividers: `1px solid rgba(255,255,255,0.06)` mellan rader
- **Stat-kort:** `background: #F5A623`, `borderRadius: 20px`, `padding: 24px 28px`, CSS grid `auto 1fr`
  - Siffra: "5 662", `fontSize: 52px`, `fontWeight: 900`, `color: #000`, `whiteSpace: nowrap`
  - Text: "Lastbilsförare nyanställda de senaste 12 månaderna", `fontSize: 13px`, `color: rgba(0,0,0,0.62)`

**Scroll-indikator:** Centrerad absolut, `bottom: 32px`, "SCROLLA" + pil-SVG, `opacity: 0.5`

---

### 3. Stats Marquee
- **Layout:** `overflow: hidden`, `padding: 16px 0`, `background: #0d2b2b`, borders top/bottom `rgba(255,255,255,0.06)`
- **Animation:** CSS `@keyframes marquee` – `translateX(0)` → `translateX(-50%)`, `30s linear infinite`
- **Content:** Array av texter separerade av amber `●`-prickar, `fontSize: 13px`, `fontWeight: 600`, `color: rgba(255,255,255,0.75)`
- Duplicera arrayen för sömlös loop

---

### 4. Problem-sektion
- **Bakgrund:** `#060f0f`, `padding: 120px 40px`
- **Layout:** `max-width: 1200px`, rubrik-block `maxWidth: 560px` + 3-kolumns grid med `gap: 2px`
- **Section label:** Inline pill `background: rgba(245,166,35,0.2)`, amber text
- **H2:** `fontSize: clamp(36px,4vw,56px)`, `fontWeight: 900`, `letterSpacing: -2px`, `color: #f0faf9`
- **Kort (3 st):**
  - `background: rgba(255,255,255,0.04)`, `border: 1px solid rgba(255,255,255,0.08)`, `padding: 40px 36px`
  - Nummer-label: "01"/"02"/"03" – `fontSize: 11px`, `fontWeight: 700`, amber, `letterSpacing: 2px`
  - SVG-ikon (bakgrunds-dekor): `position: absolute`, `top: 24px`, `right: 28px`, `opacity: 0.12`, `width: 44px`
  - Ikoner: dokument, valuta, klocka (se SVG-ikonsystem nedan)
  - Titel: `fontSize: 24px`, `fontWeight: 800`, `color: #f0faf9`, `letterSpacing: -0.5px`
  - Text: `fontSize: 15px`, `color: rgba(240,250,249,0.6)`, `lineHeight: 1.7`

---

### 5. Lösnings-sektion
- **Bakgrund:** `#0a1818`, `padding: 120px 40px`
- **Layout:** CSS grid `1fr 1fr`, `gap: 80px`, `max-width: 1200px`
- **Vänster:** `position: sticky`, `top: 100px` – rubrik + ingress + 2 CTA-knappar
- **Höger:** 5 feature-kort staplade, `gap: 4px`
  - `background: rgba(255,255,255,0.04)`, `border: 1px solid rgba(255,255,255,0.08)`, `borderRadius: 16px`, `padding: 28px`
  - Ikon-box: `width: 48px`, `height: 48px`, `borderRadius: 14px`, `background: rgba(245,166,35,0.15)`, amber ikon
  - Ikoner: target, shield, chat, calendar, star
  - Titel: `fontSize: 17px`, `fontWeight: 700`, `color: #f0faf9`
  - Text: `fontSize: 14px`, `color: rgba(240,250,249,0.6)`, `lineHeight: 1.65`

---

### 6. Hur funkar det
- **Bakgrund:** `#0a1818`, `padding: 120px 40px`
- **Tab-switcher:** Pill med 2 knappar (Förare/Åkeri) + SVG-ikon per tab
  - Aktiv: `background: #1F5F5C`, `color: #fff`
  - Inaktiv: transparent, `color: rgba(255,255,255,0.6)`
- **3 steg-kort:** Grid `1fr 1fr 1fr`, `gap: 24px`
  - Steg-nummer som stor bakgrunds-dekor: `fontSize: 72px`, `opacity: 0.12`, `color: #1F5F5C`, absolut position `top: 16px`, `right: 24px`
  - Grön steg-badge: `width: 36px`, `height: 36px`, `borderRadius: 10px`, `background: #1F5F5C`
  - Titel: `fontSize: 20px`, `fontWeight: 800`
  - Text: `fontSize: 14px`, `lineHeight: 1.7`
- **Social proof-strip:** `background: rgba(255,255,255,0.04)`, `border: 1px solid rgba(255,255,255,0.08)`, `borderRadius: 16px`, `padding: 28px 36px`
  - "VÄLKOMNADES AV" label + check-ikoner + organisationsnamn
  - "GRATIS" badge: `background: rgba(74,222,128,0.12)`, `color: #22c55e`

---

### 7. Segment-sektion
- **Bakgrund:** `#0a1818`, `padding: 120px 40px`
- **Layout:** Grid `1fr 2fr`, `gap: 80px`
- **3 segment-kort:** Grid `1fr 1fr 1fr`, `gap: 16px`
  - Heltid: grön accent `#22c55e`, ikon: truck
  - Vikariat/Deltid: amber `#F5A623`, ikon: clock
  - Praktik: teal `#1F5F5C` + grön `#4ade80`, ikon: graduation-cap
  - Kort: `background: rgba(255,255,255,0.04)`, `borderRadius: 20px`, `padding: 28px 24px`
  - Tag-pill: `fontSize: 11px`, `fontWeight: 700`, `letterSpacing: 1px`, UPPERCASE, accentfärg
  - Titel: `fontSize: 18px`, `fontWeight: 800`

---

### 8. FAQ-sektion
- **Bakgrund:** `#0a1818`, `padding: 120px 40px`
- **Layout:** Grid `1fr 1.5fr`, `gap: 80px`, vänster sticky `top: 100px`
- **Accordion:** Varje fråga separerad av `1px solid rgba(255,255,255,0.06)`
  - Knapp: `padding: 24px 0`, `fontWeight: 700`, `fontSize: 16px`, `color: #f0faf9`
  - +/- ikon-box: `width: 28px`, `height: 28px`, `borderRadius: 8px`
    - Öppen: `background: #1F5F5C`, `color: #fff`
    - Stängd: `background: rgba(255,255,255,0.04)`
  - Svar: `maxHeight` transition `0 → 200px`, `0.3s ease`
  - Svarstext: `fontSize: 15px`, `color: rgba(240,250,249,0.6)`, `lineHeight: 1.7`

---

### 9. CTA-sektion (split)
- **Bakgrund:** `#050e0e` + `hero-driver.png` som bakgrundsbild `opacity: 0.15`
- **Overlay:** `linear-gradient(to right, rgba(5,14,14,0.98) 40%, rgba(5,14,14,0.75))`
- **Layout:** Grid `1fr 1fr`, `max-width: 1200px`, divider `1px solid rgba(255,255,255,0.06)`

**Vänster (Förare):** `padding: 100px 60px 100px 40px`
- Amber pill-badge med truck-ikon
- H2: "Hitta rätt jobb." + amber "Direkt."
- Checklista: 3 punkter med grön check-ikon i `22×22px` box
- CTA: `background: #F5A623`, `color: #000`, `fontWeight: 800`

**Höger (Åkeri):** `padding: 100px 40px 100px 60px`
- Grön pill-badge med building-ikon
- H2: "Hitta rätt förare." + grön "Utan provision."
- Checklista: 3 punkter med grön check-ikon
- CTA: `background: rgba(255,255,255,0.08)`, ghost-stil

**Bottom strip:** `borderTop: 1px solid rgba(255,255,255,0.05)`, centrerad text med `·`-separatorer

---

### 10. Footer
**Ersätter:** `src/components/Footer.jsx`

- **Bakgrund:** `#040c0c`, `padding: 80px 40px 40px`
- **Layout:** Grid `2fr 1fr 1fr 1fr`, `gap: 60px`
- **Brand-kolumn:** Logo (vit) + beskrivning `rgba(255,255,255,0.5)` + e-post
- **3 länk-kolumner:** Plattformen / Om STP / Juridik
  - Kolumn-titel: `fontSize: 11px`, `fontWeight: 700`, `color: rgba(255,255,255,0.35)`, UPPERCASE, `letterSpacing: 1.5px`
  - Länkar: `fontSize: 14px`, `color: rgba(255,255,255,0.6)`, hover → `rgba(255,255,255,0.9)`
- **Bottom bar:** `borderTop: 1px solid rgba(255,255,255,0.08)`, copyright vänster, juridik-länkar höger

---

## SVG-ikonsystem

Implementera dessa som React-komponenter i `src/components/Icons.jsx` (lägg till vid befintliga ikoner):

```jsx
// Truck
<path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>

// Building  
<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9m6 12V9"/>

// Document
<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>

// Money/Currency
<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/><path d="M6 12h.01M18 12h.01"/>

// Clock
<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>

// Target/Crosshair
<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>

// Shield with check
<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>

// Chat bubble
<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>

// Calendar
<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>

// Star
<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>

// Graduation cap
<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>

// Check
<polyline points="20 6 9 17 4 12"/>

// Arrow right
<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
```

Alla ikoner: `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `strokeWidth="1.8"`, `strokeLinecap="round"`, `strokeLinejoin="round"`

---

## Design Tokens

```css
/* Färger – Direkt (mörk) tema */
--stp-bg-primary:    #060f0f;
--stp-bg-card:       rgba(255,255,255,0.04);
--stp-border:        rgba(255,255,255,0.08);
--stp-text:          #f0faf9;
--stp-text-muted:    rgba(240,250,249,0.6);
--stp-teal:          #1F5F5C;
--stp-amber:         #F5A623;
--stp-green:         #22c55e;
--stp-green-light:   #4ade80;

/* Befintliga tokens (från index.css) */
--color-primary:     #0d4f4f;
--color-primary-light: #0f6b6b;
--color-accent:      #e8a317;
--color-accent-dark: #c98a0f;

/* Typografi */
--font: 'DM Sans', system-ui, sans-serif;

/* Spacing */
--section-padding: 120px 40px;
--card-radius: 20px;
--btn-radius: 12px;
```

---

## Interaktioner & animationer

| Element | Animation | Värden |
|---------|-----------|--------|
| Roterande hero-ord | opacity + translateY fade | `0.25s ease`, byt var 2.8s |
| Stats marquee | CSS translateX | `30s linear infinite` |
| FAQ accordion | max-height | `0 → 200px, 0.3s ease` |
| Nav scroll | background + blur | `0.3s` transition |
| Scroll-reveal | opacity + translateY | `0.7s ease-out`, `threshold: 0.08` (befintlig `useInView` hook fungerar) |
| Hover på kort | `box-shadow` | `hover:shadow-md` (befintlig Tailwind-klass) |

---

## Implementationsordning (rekommenderad)

1. Lägg till nya SVG-ikoner i `src/components/Icons.jsx`
2. Uppdatera `src/index.css` med nya CSS-variabler och `@keyframes marquee`
3. Ersätt `src/pages/Home.jsx` sektion för sektion (behåll befintlig SEO/schema-logik)
4. Kopiera hero-bilderna till `public/` (de finns redan i repot)
5. Uppdatera `src/components/Footer.jsx` med ny design
6. Testa mot befintlig auth-routing (logged-in → redirect, ska fungera oförändrat)

---

## Assets

| Fil | Källa | Destination |
|-----|-------|-------------|
| `hero.png` | `public/hero.png` | Redan på plats |
| `hero-driver.png` | `public/hero-driver.png` | Redan på plats |
| `hero-company.png` | `public/hero-company.png` | Redan på plats |

---

## Viktigt att bevara

- All befintlig SEO-logik (`PageMeta`, `usePageTitle`, schema.org JSON-LD för FAQ)
- Auth-routing (`isDriver → /profil`, `isCompany → /foretag`)
- `useInView` scroll-reveal hook (fungerar med den nya designen)
- `useCountUp` hook för animerade siffror i hero-stats
- Befintlig Header-komponent för inloggade användare (ändra bara public-läget)

---

*Genererat från STP design session – April 2026*
