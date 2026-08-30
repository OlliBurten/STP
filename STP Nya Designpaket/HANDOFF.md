# STP — Handoff-guide

Sveriges Transportplattform (STP) — komplett designprototyp i **ljust tema**, byggd i HTML/React (inline Babel) på ett enhetligt designsystem.

**Börja här:** öppna `STP Översikt.html` — index över alla skärmar, grupperade och klickbara.

---

## 1. Arkitektur

Allt bygger på **delade assetfiler**. Ändra en token → alla skärmar uppdateras.

| Fil | Roll |
|---|---|
| `stp-light-tokens.css` | Alla designtokens (CSS-variabler): färger, typografi, skuggor, radier + base reset |
| `stp-light-components.jsx` | Komponentbibliotek (React). Exporteras till `window`: `TopNav, Card, Pill, Button, Field, Tabs, SectionLabel, Avatar, Icon, Dot, Notice, Stat, Input, Divider, PageShell, Container` |
| `stp-sweden-map.jsx` | Interaktiv, zoombar Sverige-karta (`<SwedenJobMap>`). Språk-konfigurerbar via `labels`-prop |
| `stp-sweden-geo.js` | Läns-geometri (officiell Wikimedia-data, CC-BY-SA Lokal_Profil) — `window.SWE_LAN_PATHS` + `SWE_LAN_BOX` |
| `stp-admin-shell.jsx` | Admin-skal: mörkt sidofält + innehållsyta (`<AdminShell>`) |
| `stp-mobile-shell.jsx` | Mobil-skal: telefonram + statusbar + tab-bar (`<MobileShell>`, `DRIVER_TABS`, `COMPANY_TABS`) |

### Ladd-ordning i varje HTML-fil
```html
<link rel="stylesheet" href="stp-light-tokens.css">
<script src=".../react@18.3.1 ..."></script>
<script src=".../react-dom@18.3.1 ..."></script>
<script src=".../@babel/standalone ..."></script>
<script type="text/babel" src="stp-light-components.jsx"></script>
<!-- ev. shell/karta -->
<script type="text/babel">/* skärmens kod */</script>
```

---

## 2. Designsystem (tokens)

**Färgroller** (se `stp-light-tokens.css` för exakta värden):
- `--ink-900..200` — asfalt/mörk ink: nav, text, mörka knappar
- `--paper`, `--paper-2`, `--card`, `--card-2` — ljusa ytor (60 %-bakgrund)
- `--green` (vägrön `#1F5F5C`) — primär varumärkesfärg, CTA, aktiv flik (~15 %)
- `--amber` (bärnsten `#C77A0E`) — varning/markering (~10 %, sparsamt)
- Status: `--success`, `--danger`, `--info` + `-tint`-varianter

**Typografi:** DM Sans (brödtext/rubriker), JetBrains Mono (siffror/koder/data).
**Princip:** ljus bakgrund, asfalt som kontrast, vägrön som accent, bärnsten sparsamt. Mono på all numerisk data.

---

## 3. Konventioner

- **Aktiv fil = `... Ljust.html`.** Filer utan "Ljust" är gamla mörka original (arkiverade i `_arkiv_morkt/`).
- **Multi-state-filer** (Auth, Felsidor, States, Dialoger) har en inbyggd **state-switcher** längst ner/upptill så man ser alla tillstånd.
- **Demo-data** ligger överst i varje fil som konstanter — byt ut mot riktig data vid integration.
- **Inga emojis** i UI:t — alla ikoner är `<Icon name="...">` (monoline SVG i komponentbiblioteket).
- **Navigation** mellan sidor sker via vanliga `<a href>` med relativa filnamn (se `STP Översikt.html`).

---

## 4. Återstår vid riktig implementation

Designen är komplett; följande är medvetet **mockat** och kopplas vid bygget:
- Riktig data/backend (allt är hårdkodade konstanter)
- Faktisk autentisering (BankID, sessions)
- Live-state mellan vyer (knappar är visuella)
- Riktiga jobb-/förarsiffror på Sverige-kartan (just nu exempeldata per län)

---

## 5. Karta — kort om återanvändning

`<SwedenJobMap regions={DATA} labels={...} onPickRegion={fn} />`
- `regions`: `[{ id, code, name, region, jobs, new, matches, cities:[{name,dx,dy,jobs}] }]`
- `code` = länsbokstav (AB=Stockholm, M=Skåne, O=Västra Götaland, ...). Alla 21 län finns i geo-datan.
- `labels` byter språk (förar-vy säger "jobb", åkeri-vy säger "förare").

---

*Designdokument, inte produktionskod. Byggd som komplett prototyp redo att implementeras via Claude Code.*
