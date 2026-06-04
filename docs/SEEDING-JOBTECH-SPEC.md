# Kravspec: Seeda STP med kurerade jobb via JobTech Dev

> Ge hela denna fil till Claude Code som uppgift. Den beskriver **vad** som ska byggas
> och **var gränserna går** — inte exakt kod. Claude Code ska läsa de länkade
> officiella dokumenten och `server/prisma/schema.prisma` innan den börjar.

## Varför vi gör det här (läs detta först)

STP är tomt på jobb idag, vilket dödar förstaintrycket för förare vi värvar. Lösningen är
inte att vänta på att åkerier loggar in och postar — det är att **seeda marknadsplatsen med
jobb som redan finns publikt**, hämtade lagligt från Arbetsförmedlingens öppna API:er.

Det tekniskt enkla är att få in 5000 annonser. Det värdefulla — och det enda som skiljer oss
från Indeed — är **kureringslagret ovanpå**: avdubbling, bortfiltrering av bemanningsmellanhänder,
och korrekt taggning av behörigheter (CE/C, ADR, YKB). Det lagret ÄR produkten. Bygg det noga.

**Hederslinjen:** seedade jobb får aldrig framstå som att ett åkeri har ett aktivt konto. De
ska tydligt märkas som hämtade från publik källa, med länk till originalet. Transparens om
proveniens är icke förhandlingsbart.

## Datakällor (officiella, gratis, kräver kostnadsfri API-nyckel)

- JobStream API (full synkad kopia + realtidsström av ändringar): https://jobstream.api.jobtechdev.se/
- JobTech Taxonomy API (yrkeskoder för att filtrera ut förarroller): https://taxonomy.api.jobtechdev.se/
- JobAd Enrichments API (extraherar krav/behörigheter ur annonstext): https://github.com/Jobtechdev-content/JobAdEnrichments-content/blob/master/GettingstartedJobAdEnrichmentsSE.md
- JobSearch API (alternativ: sök mot deras motor istället för egen kopia): https://data.jobtechdev.se/data/dataservice/data-service-jobsearch/
- Skaffa API-nyckel / connection request: https://apirequest.jobtechdev.se/

Claude Code: läs JobStream "getting started" innan implementation —
https://github.com/Jobtechdev-content/Jobstream-content/blob/develop/GettingStartedJobStreamSE.md

## Mål

En idempotent ingestor-pipeline (Node, i `server/`) som håller STP:s `Job`-tabell synkad med
alla relevanta förarjobb i Platsbanken, kurerade enligt våra regler, körd på schema.

## Steg

### Etapp 0 — Prototypa mot JobSearch UTAN nyckel (gör detta först)
JobSearch-API:et kan anropas direkt utan API-nyckel (deras curl-exempel skickar bara
`accept: application/json`). Bygg och testa hela filter-/kurerings-/mappningslogiken mot
JobSearch medan JobStream-nyckeln är på väg. Byt sedan bara datakälla till JobStream för
produktion (massimport + synk).

- Hämta lastbilsförarjobb via occupation-group, INTE fritext:
  `https://jobsearch.api.jobtechdev.se/search?occupation-group=3MBw_pDA_P2F&limit=100`
  (`3MBw_pDA_P2F` = "Lastbilsförare m.fl.". Verifiera mot Taxonomy om fler förarroller ska med.)
- Paginera med `offset`/`limit` (max 100 per anrop).
- Annonsfälten är redan strukturerade — mappa direkt, bygg inte onödig enrichment:
  - `driving_license` (lista med B/C/CE som taxonomi) + `driving_license_required`
  - `occupation`, `occupation_group`, `occupation_field`
  - `employer.organization_number`, `employer.name`
  - `webpage_url` → vår `sourceUrl` (länk till originalannonsen)
  - `id` → vår `externalId`; `removed`/`removed_date`; `application_deadline`; `publication_date`
- YKB och ADR ligger oftast i FRITEXT (`description.text`), inte strukturerat. Parsa texten
  med nyckelordsregler (eller JobAd Enrichments) ENBART för YKB/ADR/CE-nyans.

### 1. Schemaändringar (`server/prisma/schema.prisma`)
Utöka `Job`-modellen (kör `npm run db:generate` + `db:push` efter):
- `source` enum: `ORGANIC` (åkeri postade själv) | `AGGREGATED` (hämtad). Default `ORGANIC`.
- `externalId` (String, unik per källa) — JobStream-annonsens id, för idempotens.
- `sourceUrl` (String) — länk till originalannonsen.
- `sourceEmployerName` (String) — arbetsgivarnamn från annonsen.
- `claimed` (Boolean, default false) — true när åkeriet tagit över sin profil.
- `enrichmentRaw` (Json, valfritt) — råsvar från Enrichments för felsökning.
Behåll befintliga fält (type, employmentType, segment, status, requirements).

### 2. Taxonomifilter
Hämta `concept_id` från Taxonomy API för relevanta yrkesgrupper/-namn (lastbilsförare,
distributionsförare etc.). Lagra dem i en konfig, inte hårdkodat spritt i koden. Detta är
filtret som plockar ut CE/C-segmentet ur strömmen istället för allt brus.

### 3. Ingestor mot JobStream (API v2.1.1)
- Använd **`/v2/snapshot`** och **`/v2/stream`** — de gamla `/snapshot` och `/stream` är utfasade.
- Initial `/v2/snapshot` av alla öppna annonser (~300 MB) → filtrera på taxonomikoderna från steg 2.
- Därefter återkommande `/v2/stream?date=YYYY-MM-DDTHH:MM:SS` för delta (nya/uppdaterade/**borttagna**).
- **Rate limit: max 1 anrop/minut** mot stream. Designa cron därefter (now() minus en minut som timestamp).
- Auth: header `api-key: <NYCKEL>`. Annonser är CC0-licensierade (fritt att lagra/visa).
- Borttagningsobjekt i strömmen har formen `{ "id": ..., "removed": true, "removed_date": ... }`.
- **Borttagna annonser måste sätta `status: REMOVED` hos oss** — det är så vi slipper bli
  Indeed med döda jobb. Detta är ett krav, inte en nice-to-have.
- Upserts via `externalId` (idempotent — körningen ska kunna köras om utan dubbletter).

### 4. Enrichment → våra fält
Kör varje annonstext genom JobAd Enrichments. Mappa resultatet till:
- Körkort: CE / C (med sannolikhetströskel, t.ex. >0.5 = krav).
- Certifikat: YKB, ADR.
- Jobbtyp: fjärrkörning / lokalt / distribution / tim (härled från text + enrichment).
Spara råsvaret i `enrichmentRaw`.

### 5. Kureringslagret (vår produkt — gör detta ordentligt)
- **Avdubbling:** samma jobb postat av flera (ofta bemanning) ska kollapsas till en post.
  Matcha på arbetsgivare + titel + ort + liknande text.
- **Bemanningsfilter:** identifiera och flagga/exkludera bemanningsföretag (konfigurerbar
  lista + heuristik). Default: exkludera, eftersom STP säljer på "raka, ärliga åkerier".
- **Skräpfilter:** annonser utan tydlig förarroll efter enrichment droppas.

### 6. Schemaläggning
Cron / schemalagd körning (t.ex. var 15:e min för strömmen, daglig full resync som säkerhet).
Använd befintligt mönster i `server/` om sådant finns.

### 7. Transparens i UI (kan vara separat PR)
Jobbkort för `source: AGGREGATED` ska visa en diskret märkning, typ "Hämtad från Platsbanken —
åkeriet har inte tagit över sin profil än", med länk till originalet. Detta möjliggör senare
konverteringspitchen ("X förare sökte ert jobb — ta över annonsen").

## Acceptanskriterier
- [ ] `npm run db:generate` + `db:push` går igenom med nya fälten.
- [ ] En körning fyller `Job` med kurerade AGGREGATED-jobb, korrekt CE/C/ADR/YKB-taggade.
- [ ] Omkörning skapar inga dubbletter (idempotent via `externalId`).
- [ ] Annons som försvinner i strömmen sätts till `status: REMOVED`.
- [ ] Bemanningsjobb är exkluderade enligt regel.
- [ ] **Dry-run-läge** finns (loggar vad som skulle hända utan att skriva till DB).
- [ ] API-nyckel och bas-URL:er ligger i env-vars, inte hårdkodat.

## Utanför scope (senare)
- Konverteringsflöde för åkerier som tar över sin profil (`claimed: true`).
- Notiser till förare vid nya matchande jobb.
- Bygg inte separat app — allt detta lever inuti STP.

## Instruktioner till Claude Code
- Läs `server/prisma/schema.prisma` och JobStream-dokumentationen INNAN du skriver kod.
- Verifiera exakta endpoints/auth mot de officiella docs ovan — anta inte parametrar.
- Börja med steg 1–3 (få in rådata), visa mig resultatet, fortsätt sedan med 4–6.
- Hårdkoda inget. Allt konfigurerbart i env/konfig.
