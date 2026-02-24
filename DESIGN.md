# Design- och UI/UX-standard

Sveriges Transportplattform följer en egen, dokumenterad standard för design och användarupplevelse. Målet är konsekvens, tillgänglighet och tydlighet i hela produkten.

---

## 1. Designtokens (färger & typografi)

Alla färger och typsnitt definieras i `src/index.css` som CSS-variabler och används genom hela appen.

| Token | Användning |
|-------|------------|
| `--color-primary` | Primärfärg (knappar, länkar, accent) |
| `--color-primary-light` | Hover/varianter |
| `--color-accent` | CTA, viktiga knappar (t.ex. hero) |
| `--color-accent-dark` | Hover på accent |
| `--color-surface` | Sidbakgrund |
| `--color-text` | Brödtext |
| `--color-text-muted` | Sekundär text |
| `--font-sans` | Huvudtypsnitt (DM Sans) |

**Regel:** Använd alltid dessa variabler (t.ex. `var(--color-primary)`) – inga hårdkodade hex-färger i komponenter.

---

## 2. Tillgänglighet (WCAG 2.1 Nivå AA – mål)

- **Fokus:** Alla interaktiva element har synlig fokusring (`focus:ring-2 focus:ring-[var(--color-primary)]` eller motsvarande). Ingen `outline: none` utan ersättande ring.
- **Kontrast:** Text ska uppfylla minst 4.5:1 mot bakgrund (stor text 3:1). Primärfärg och accent används så att kontrasten håller.
- **Semantik:** Använd rätt HTML (rubriker H1–H6, `label` kopplat till inputs, `button` för knappar, `nav` för navigation).
- **Skärmläsare:** Tydliga `aria-label` på ikonknappar, `aria-expanded` på fällbara sektioner, `sr-only` för visuellt dolda etiketter som behövs för a11y.
- **Tangentbord:** All funktionalitet nåbar med tangentbord; fokusordning logisk.

---

## 3. Touch och mobil

- **Touch-targets:** Minst **44×44 px** för knappar och klickbara element (`min-h-[44px] min-w-[44px]` eller motsvarande).
- **Formulär:** Inputs med minst 44 px höjd på mobil där det är rimligt.
- **Responsivitet:** Mobil-först; breakpoints enligt Tailwind (sm: 640px, md: 768px, lg: 1024px). Navigation byter till mobilmeny under 1024px.

---

## 4. Komponentmönster

- **Primär knapp:** `rounded-xl`, primärfärg eller accent, `font-semibold`, minst 44px höjd.
- **Sekundär knapp:** Kant (border), hover med bakgrund.
- **Inputfält:** `rounded-lg border border-slate-300`, `focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent`, `outline-none`.
- **Kort:** `rounded-xl` eller `rounded-2xl`, `border border-slate-200`, `shadow-sm` vid behov; hover med `hover:shadow-md` eller `hover:border-[var(--color-primary)]`.

---

## 5. Layout och rytm

- **Container:** `max-w-6xl mx-auto px-4 sm:px-6` för innehållssektioner.
- **Sektionsavstånd:** `py-16 lg:py-20` för stora sektioner.
- **Spacing:** Använd Tailwind spacing-skala (4, 6, 8, 10, 16, 20 …) konsekvent; undvik godtyckliga värden.

---

## 6. Nya komponenter och sidor

Vid ny utveckling:

1. Använd designtokens från `index.css`.
2. Följ komponentmönstren ovan (knappar, inputs, kort).
3. Säkerställ synlig fokus och aria där det behövs.
4. Håll touch-targets minst 44px.
5. Testa på smal viewport (mobil) och med tangentbord.

---

*Senast uppdaterad: 2025. Standarden gäller från och med nuvarande version av produkten.*
