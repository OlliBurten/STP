# STP Designsystem

En källa för typografi, spacing och bredder. Definierat i `src/index.css` (`:root`)
och speglat i `src/components/ui/layout.jsx` (`LAYOUT`, `TYPE`, `SPACE`).

> **Regel:** Hårdkoda aldrig `fontSize`, `padding`/`margin` eller `maxWidth` med ett
> råvärde. Använd en token. Nya värden läggs till skalan, inte ad hoc i en komponent.

## Typskala

Använd `fontSize: "var(--text-sm)"` i inline styles, eller `TYPE.sm` när ett tal behövs.
Hero-/display-rubriker får använda `clamp()` lokalt.

| Token | px | Användning |
|---|---|---|
| `--text-2xs` | 11 | eyebrows, badges, pyttiga etiketter |
| `--text-xs` | 12 | meta, captions, taggar |
| `--text-sm` | 13 | sekundär brödtext, knapptext (sm) |
| `--text-base` | 14 | **standard brödtext** |
| `--text-md` | 15 | betonad brödtext, små leads |
| `--text-lg` | 16 | lead, kortrubriker |
| `--text-xl` | 18 | sektions-underrubriker |
| `--text-2xl` | 20 | h4 / stora kortrubriker |
| `--text-3xl` | 24 | h3 |
| `--text-4xl` | 28 | h2 |
| `--text-5xl` | 34 | sidtitlar |
| `--text-6xl` | 40 | display (icke-hero) |

### Migrerings-mappning (gammalt råvärde → token)

Halvsteg snäpps till närmaste rena steg (osynlig skillnad):

```
9, 9.5, 10, 10.5, 11, 11.5  → --text-2xs (11)
12, 12.5                    → --text-xs (12)
13, 13.5                    → --text-sm (13)
14, 14.5                    → --text-base (14)
15, 15.5                    → --text-md (15)
16, 16.5                    → --text-lg (16)
17, 18, 19                  → --text-xl (18)
20, 21                      → --text-2xl (20)
22, 24, 26                  → --text-3xl (24)
28, 30                      → --text-4xl (28)
32, 34                      → --text-5xl (34)
36, 38, 40                  → --text-6xl (40)
```

## Spacing (4px-bas)

`--space-1`…`--space-20` = 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80 px.
Padding/margin/gap väljs från skalan.

## Innehållsbredder

Varje sida väljer **en** bredd — slut på drift.

| Token | px | Sidor |
|---|---|---|
| `--w-app` | 1240 | inloggade app-sidor (= `LAYOUT.WIDE`) |
| `--w-public` | 1200 | utloggade marknads-/innehållssidor (= `LAYOUT.PUBLIC`) |
| `--w-read` | 1040 | tät läs-/app-bredd (= `LAYOUT.READ`) |
| `--w-prose` | 680 | artikel-/långtextkolumn |
| `--w-form` | 560 | centrerade formulär / smalt innehåll |
| `--pad-x` | 32 | standard horisontell sid-padding |

## Övrigt (redan standardiserat)

- **Färger:** `--ink-*`, `--green*`, `--amber*`, status (`--success/danger/info`)
- **Radier:** `--r-sm/–/-md/-lg`
- **Skuggor:** `--sh-sm/–/-md`
- **Font:** `--font` (DM Sans), `--mono` (JetBrains Mono)
- **Primitiver:** `Button`, `Card`, `Pill`, `Avatar`, `Icon`, `Dot` i `src/components/ui`
