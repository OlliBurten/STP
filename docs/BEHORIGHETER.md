# Behörigheter & certifikat (källkollad referens)

Verifierad lista över körkort/behörigheter/certifikat i STP. **Allt källkollat mot
myndigheter/branschorgan** (juni 2026) för att undvika felaktiga eller påhittade
alternativ — fel certifikat skadar förtroendet hos chaufförer.

Data: `src/data/competencies.js`. Onboarding = förenklad högnivå-uppsättning;
profilredigering = fullständig grupperad lista. Matchning: `src/utils/matchUtils.js`.

## Körkort
| Värde | Etikett |
|---|---|
| C | Tung lastbil |
| CE | Tung lastbil + släp |
| C1 | Medeltung lastbil |
| C1E | Medeltung + tungt släp |
| B | Personbil |
| BE | Personbil + släp |

**Hierarki (i matchningen):** CE ⇒ C ⇒ B, CE ⇒ BE, C1E ⇒ C1. CE-förare matchar
jobb som kräver C/B/BE utan att kryssa dem separat. *Källa: Transportstyrelsen.*

## YKB
Yrkeskompetensbevis. *Källa: Transportstyrelsen.*

## ADR – Farligt gods (komplett)
ADR Grund (styckegods) · ADR Tank · ADR Klass 1 (explosiva) · ADR Klass 7
(radioaktiva) · ADR 1.3 (hantering). *Källa: MSB.*

## Truckkort (TLP10)
Truck A (låglyftande) · Truck B (motvikts-/skjutstativtruck) · Truck C (stora
specialtruckar) · Truck D (drag- och flaktruck) · Bakgavellyft.
*Källa: TLP10. OBS: skjutstativ = B, inte C; "skjutbomstruck" finns inte.*

## APV – Arbete på väg
APV Steg 1 (grundkompetens) · Steg 2 (utförare) · Steg 3 (styra & leda).
*Källa: Trafikverket TDOK 2018:0371. Undernivåer (1.1–1.4 m.fl.) ändrades 2024 →
vi visar de tre stabila stegen.*

## Kran & lyft
Kranförarbevis · Fordonsmonterad kran (lastbilskran) · Timmerkran.
*Källa: TYA. "HIAB" är varumärke → använd "fordonsmonterad kran".*

## Övriga
Lastsäkring · Livsmedelshygien · Heta arbeten · ID06.

## Borttaget (felaktigt)
- **"Kylskåpsbehörighet"** — finns inte. Temperaturreglerad transport regleras av
  **ATP-certifikat** som gäller *fordonet* (RISE/Bilprovningen), inte föraren.

## Bakåtkompatibilitet
Gamla värden (APV_1_1…APV_3, Kyl, Tank, Forarkort, gamla Truck-dubbletter) ligger
kvar som dolda legacy-värden i `competencies.js` så gamla profiler behåller etiketter.

## Källor
- Transportstyrelsen — körkort
- MSB — ADR förarutbildning
- Trafikverket (bransch) — Arbete på väg, TDOK 2018:0371
- TYA — fordonsmonterad kran
- Bilprovningen / RISE — ATP-certifikat
- TLP10 — truckläroplan

_Senast verifierad: 2026-06._
