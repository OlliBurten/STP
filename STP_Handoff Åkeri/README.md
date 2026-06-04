# STP – Implementation Handoff

Komplett designpaket för STP (Sveriges Transportplattform). Innehåller alla redesignade sidor för förare och åkeri, både desktop och mobil.

## Struktur

```
STP_Handoff/
├── HANDOFF Desktop.md          # Desktop handoff med datamodell-spec
├── HANDOFF Mobil Förare.md     # Mobil handoff (förare-fokus, tidig version)
├── HANDOFF Mobil Komplett.md   # Komplett mobil handoff (förare + åkeri)
├── ios-frame.jsx               # iOS device frame komponent (för mobil-prototyper)
├── desktop/                    # Desktop designs (HTML prototyper)
└── mobil/                      # Mobile designs (HTML prototyper i iOS-frame)
```

## Hur man läser filerna

Varje `.html`-fil är en självständig prototyp som öppnas direkt i webbläsaren (Chrome rekommenderas). Designen är gjord i React + Babel inline — koden är fullständigt synlig om man inspekterar källan, men tanken är att utvecklarna implementerar mot `DriverMatch/`-kodbasen, inte kopierar prototypen direkt.

**Tips:** Varje prototyp har en Tweaks-panel (öppna med toggle nere till höger eller via state-knappar) som visar olika states (verifierad/ej, tom/fylld, olika roller).

## Implementationsordning (rekommenderad)

1. **Datakontrakt först** — utöka `Job`-modellen enligt `HANDOFF Desktop.md` (aboutJob, responsibilities, requirements, benefits, ApplicationStage enum)
2. **Delade komponenter** — Header, BottomNav, MatchRing, EmptyState, BottomSheet
3. **Förare desktop** — Jobblista, Jobbdetalj v3, PostJob (de mest använda)
4. **Åkeri desktop** — Dashboard v3, Annonser, Hitta förare
5. **Mobil** — när desktop är stabilt
6. **Edge cases & felstates** — sista 10%

## Tema-tokens

```css
--bg-page: #060f0f;
--bg-card: #0a1414;
--accent: #F5A623;       /* primär — amber */
--teal: #1F5F5C;          /* sekundär — teal */
--success: #4ade80;
--danger: #f87171;
--info: #60a5fa;
--text: #f0faf9;
font-family: 'DM Sans', system-ui, sans-serif;
```

## Frågor?

Se respektive HANDOFF-fil för datamodell, komponentspec och backend-endpoints som behövs.
