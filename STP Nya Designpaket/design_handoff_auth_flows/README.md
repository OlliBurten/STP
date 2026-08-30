# Handoff: Auth Flows – Login & Registrering

## Overview
Redesign av login- och registreringssidorna för Sveriges Transportplattform (STP). Målet är ett modernt, konverterande flöde som tydligt separerar de två användargrupperna — **förare** och **åkerier** — utan att kräva separata domäner eller URL:er.

## About the Design Files
Filerna i detta paket är **design-prototyper skapade i HTML** — de visar avsedd look, känsla och beteende, men är inte produktionskod. Din uppgift är att **återskapa dessa designer i den befintliga React-kodbasen** (Vite + React + Tailwind) med etablerade mönster och bibliotek. Ersätt befintlig `src/pages/Login.jsx` med den nya designen. Behåll all befintlig logik (OAuth, API-anrop, AuthContext etc.) — det är bara UI:t som ändras.

## Fidelity
**High-fidelity** — Pixel-perfekta mockups med slutgiltiga färger, typografi, spacing och interaktioner. Återskapa UI:t pixel-perfekt med kodbas​ens befintliga bibliotek och mönster.

---

## Screens / Views

### 1. Login (`/login`)

**Syfte:** Befintliga användare (förare och åkerier) loggar in.

**Layout:**
- Bakgrund: `#050e0e` (fullskärm)
- Centrerat kort: `max-width: 480px`, centrerat med `margin: auto`, padding `52px 48px`
- Navbar i toppen (befintlig Header-komponent, `marginTop: -64px` för att kompensera)

**Komponenter (uppifrån och ner):**

| Element | Spec |
|---|---|
| Eyebrow-text | `"Välkommen tillbaka"` · font-size 12px · font-weight 700 · letter-spacing 0.12em · uppercase · color `#F5A623` |
| Rubrik H1 | `"Logga in på STP"` · font-size 36px · font-weight 900 · color `#f0faf9` · letter-spacing -1px · line-height 1.1 |
| E-post input | Label: `"E-POST"` · placeholder `"din@epost.se"` |
| Lösenord input | Label: `"LÖSENORD"` · placeholder `"••••••••"` · toggle visa/dölj |
| Glömt lösenord | Länk högerställd under lösenordsfältet · color `#4ade80` · font-size 12px |
| CTA-knapp | `"Logga in →"` · full bredd · padding 14px · border-radius 12px · background `#F5A623` · color `#000` · font-weight 800 · font-size 15px |
| OAuth-separator | `"eller fortsätt med"` · divider-linje på varje sida |
| OAuth-knappar | Google + Microsoft i rad · height 42px · border-radius 10px · border `rgba(255,255,255,0.14)` · background `rgba(255,255,255,0.04)` |
| Footer-länk | `"Inget konto? Skapa konto gratis"` · "Skapa konto gratis" i `#F5A623` · font-weight 700 |

**Input-stil:**
```css
padding: 11px 14px;
border-radius: 10px;
border: 1px solid rgba(255,255,255,0.14);
background: rgba(255,255,255,0.05);
color: #f0faf9;
font-size: 14px;
```

**Label-stil:**
```css
font-size: 12px;
font-weight: 600;
color: rgba(240,250,249,0.55);
letter-spacing: 0.02em;
text-transform: uppercase;
```

---

### 2. Skapa konto – Roll-picker (`/registrera`)

**Syfte:** Nya användare väljer om de är förare eller åkeri. Detta är det FÖRSTA steget — man ser inget formulär förrän man valt roll.

**Layout:**
- Bakgrund: `#050e0e`
- Fullbredd kort: `max-width: 800px`, centrerat
- Navbar i toppen
- **Grid med 2 kolumner** (50/50), separerade av `1px solid rgba(255,255,255,0.08)`
- Footer-rad under gridet: `"Har du redan ett konto? Logga in"`

**Vänster kolumn — Förare (grön zon):**
```
background: linear-gradient(145deg, #0d2b2b 0%, #0a1818 100%)
padding: 52px 44px
```

| Element | Spec |
|---|---|
| Ikon-container | 56×56px · border-radius 16px · background `rgba(74,222,128,0.12)` · lastbilsikon SVG · stroke `#4ade80` |
| Eyebrow | `"Jag är förare"` · font-size 11px · font-weight 700 · letter-spacing 0.1em · uppercase · color `#4ade80` |
| Rubrik | `"Hitta ditt nästa jobb"` · font-size 26px · font-weight 900 · color `#f0faf9` · letter-spacing -0.5px |
| Beskrivning | `"Bygg din profil en gång. Ansök till hundratals åkerier med ett klick."` · font-size 14px · color `rgba(240,250,249,0.55)` |
| Feature-lista | 3 punkter med grön dot (5×5px) · "Gratis att använda", "Ansök med ett klick", "Synlig för verifierade åkerier" |
| CTA-knapp | `"Registrera som förare →"` · full bredd · padding 13px 20px · border-radius 12px · border `rgba(74,222,128,0.3)` · background `rgba(74,222,128,0.06)` · color `#4ade80` · font-weight 700 · justify-content space-between |

**Höger kolumn — Åkeri (amber zon):**
```
background: linear-gradient(145deg, #1a1200 0%, #0f0c00 60%, #050e0e 100%)
padding: 52px 44px
```

| Element | Spec |
|---|---|
| Ikon-container | 56×56px · border-radius 16px · background `rgba(245,166,35,0.10)` · husikon SVG · stroke `#F5A623` |
| Eyebrow | `"Jag är åkeri"` · font-size 11px · font-weight 700 · letter-spacing 0.1em · uppercase · color `#F5A623` |
| Rubrik | `"Hitta rätt förare — snabbt"` · font-size 26px · font-weight 900 · color `#f0faf9` |
| Beskrivning | `"Publicera tjänster, sök i vår förardatabas och matcha med kvalificerade kandidater."` |
| Feature-lista | 3 punkter med amber dot · "Publicera jobb gratis", "Sök bland verifierade förare", "AI-matchning inbyggd" |
| CTA-knapp | `"Registrera som åkeri →"` · border `rgba(245,166,35,0.3)` · background `rgba(245,166,35,0.06)` · color `#F5A623` |

**Hover-state på kolumnerna:** Lägg gärna till subtle hover-effekt på respektive kolumn (t.ex. `background` lyser upp något).

---

### 3. Skapa konto – Förare-formulär

**Syfte:** Föraren fyller i sina uppgifter efter att ha valt roll.

**Layout:** Samma 2-kolumns grid (800px max-width)
- **Vänster:** formulär
- **Höger:** value prop-panel (statisk, grön gradient)

**Vänster kolumn (formulär):**
```
padding: 44px 40px
border-right: 1px solid rgba(255,255,255,0.08)
```

| Element | Spec |
|---|---|
| Tillbaka-länk | `"← Tillbaka"` · color `rgba(240,250,249,0.3)` · font-size 13px · no border · klickar tillbaka till roll-pickern |
| Roll-badge | Rad med lastbilsikon + `"Förare"` · padding 8px 12px · border-radius 10px · background `rgba(74,222,128,0.07)` · border `rgba(74,222,128,0.2)` · color `#4ade80` |
| Rubrik | `"Skapa ditt förarkonto"` · font-size 20px · font-weight 800 |
| Undertitel | `"Gratis — tar under 2 minuter"` · font-size 13px · color `rgba(240,250,249,0.55)` |
| Namn-input | Label: `"NAMN"` · placeholder `"Erik Lindström"` |
| E-post-input | Label: `"E-POST"` · placeholder `"din@epost.se"` |
| Lösenord-input | Label: `"LÖSENORD"` · placeholder `"Minst 8 tecken"` · minLength 8 |
| Villkors-checkbox | Samma som befintlig implementation |
| CTA-knapp | `"Skapa förarkonto →"` · background `#F5A623` · color `#000` · font-weight 800 |
| OAuth | Separator + Google + Microsoft (samma som login) |

**Höger kolumn (value prop — statisk):**
```
background: linear-gradient(145deg, #0d2b2b 0%, #0a1818 100%)
padding: 44px 36px
```
- Eyebrow: `"Varför STP?"` · color `#4ade80`
- Rubrik: `"En profil. Hundratals möjligheter."`
- 3 feature-rader med emoji-ikon, titel, beskrivning:
  - 🔍 "Bli hittad" — "Åkerier söker aktivt efter förare med din bakgrund"
  - ⚡ "Snabb ansökan" — "Ansök med ett klick — din profil är din CV"
  - 🛡️ "Trygt & verifierat" — "Alla åkerier är verifierade på plattformen"

---

### 4. Skapa konto – Åkeri-formulär

Samma layout som förare-formuläret men:
- Roll-badge: husikon + `"Åkeri / Transportföretag"` · amber-färger
- Namn-label: `"NAMN (KONTAKTPERSON)"` · placeholder `"Anna Andersson"`
- E-post placeholder: `"din@foretag.se"`
- CTA: `"Skapa företagskonto →"`
- Info under namn: `"Du lägger till ditt åkeri/företag i nästa steg"` (befintlig text)
- Höger kolumn:
  - Eyebrow: `"För åkerier"` · color `#F5A623`
  - Rubrik: `"Rätt förare. Utan mellanhänder."`
  - Features: 🎯 "Precisionsmatchning", 📋 "Publicera jobb enkelt", 👁️ "Sök i förardatabasen"

---

## Interactions & Behavior

### State-maskin (ersätter befintlig `mode`-state)
```
login               → standard login-vy
register_pick       → roll-picker (NY — första steget vid registrering)
register_driver     → förare-formulär
register_company    → åkeri-formulär  
forgot              → glömt lösenord (oförändrad)
```

### Navigation
- `"Skapa konto"` i navbar / footer → `register_pick`
- `"Registrera som förare"` → `register_driver`
- `"Registrera som åkeri"` → `register_company`
- `"← Tillbaka"` i formulären → `register_pick`
- `"Logga in"` / `"Har du redan ett konto?"` → `login`

### Animationer
- Fade + subtle translateY(8px) vid stegbyten · duration 180ms · ease-out
- Implementera med opacity + transform transition på wrapper-div

### OAuth-flöde (oförändrat)
Befintlig `OAuthButtons`-komponent fungerar som den är. Skicka `authMode="register"` vid registrering så roll-pickern triggas om ny användare.

### Formulär-submission (oförändrat)
Återanvänd `handleSubmit`, `registerWithApi`, `loginWithApi` från befintlig `Login.jsx` utan ändringar.

---

## Design Tokens

Använd **befintliga CSS-variabler från `src/index.css`** — mappa enligt nedan:

| Design-värde | CSS-variabel |
|---|---|
| `#050e0e` (bakgrund) | `var(--t-bg)` |
| `#0a1818` | `var(--t-bg2)` |
| `#0d2b2b` | `var(--t-bg3)` |
| `#F5A623` (amber) | `var(--t-amber)` |
| `#4ade80` (grön) | `var(--t-green)` |
| `rgba(240,250,249,0.55)` | `var(--t-sub)` |
| `rgba(240,250,249,0.3)` | `var(--t-muted)` |
| `rgba(255,255,255,0.08)` | `var(--t-border)` |
| `rgba(255,255,255,0.14)` | `var(--t-border2)` |
| `rgba(255,255,255,0.04)` | `var(--t-card)` |
| `#f0faf9` (text) | `var(--t-text)` |
| Font | `var(--font-sans)` (DM Sans) |

---

## Files

| Fil | Beskrivning |
|---|---|
| `Auth Flows.html` | Interaktiv design-prototyp · öppna i browser för att se och klicka igenom alla steg |
| `src/pages/Login.jsx` | Befintlig fil att ersätta |
| `src/components/OAuthButtons.jsx` | Behålls oförändrad |
| `src/context/AuthContext.jsx` | Behålls oförändrad |

---

## Prompt till Claude Code

> Implementera den nya auth-designen för STP. Design-referensen finns i `Auth Flows.html` — öppna den i en browser och klicka igenom Variant B för att se alla steg.
>
> **Uppgift:** Ersätt `src/pages/Login.jsx` med den nya designen enligt specifikationen i `design_handoff_auth_flows/README.md`.
>
> - Behåll all befintlig logik (OAuth, API-anrop, AuthContext, navigation)
> - Lägg till ett nytt steg `register_pick` (roll-picker) som visas INNAN formuläret vid registrering
> - Använd befintliga CSS-variabler från `index.css` (se token-mappning i README)
> - Befintlig `OAuthButtons`-komponent används oförändrad, skicka `authMode="register"` vid registrering
> - Animera steg-övergångar med fade + translateY(8px), 180ms ease-out
