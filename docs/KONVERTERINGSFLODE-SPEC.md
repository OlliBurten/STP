# Kravspec: Konverteringsflöde (förare → ansökan → åkeri ansluter)

> Ge hela denna fil till Claude Code. Den bygger vidare på docs/SEEDING-JOBTECH-SPEC.md.
> Claude Code ska läsa server/prisma/schema.prisma och den filen innan kod skrivs, och
> arbeta i etapper med granskning emellan.

## Varför (läs först)

Seedingen har gett oss ~700 jobb. Nu ska svänghjulet kopplas ihop: en förare som söker ett
seedat jobb ska (1) registrera sig på STP, (2) lämna en ansökan som fångas, och (3) den
ansökan ska automatiskt bli kroken som får åkeriet att ansluta — "en kvalificerad förare har
sökt ert jobb". Vi kontaktar alltså INTE alla åkerier i förväg. Ansökan är triggern, och
kontaktuppgifterna finns redan i den seedade annonsdatan.

**Tre orubbliga principer (förtroende är STP:s vallgrav):**
1. Seedade/oanslutna jobb får aldrig märkas "Verifierat företag". Var ärlig om proveniens.
2. En förares ansökan får aldrig tyst försvinna. Antingen fångas + förmedlas den, eller så är
   det glasklart att den väntar tills åkeriet anslutit.
3. Föraren måste samtycka till att ansökan delas med arbetsgivaren (ärligt + GDPR-krav).

## Etapp 1 — Datamodell

Lägg till i `server/prisma/schema.prisma` (kör `db:generate` + `db:push` efter):

**Nya kontakt-/claim-fält på `Job`** (utöver de från seeding-specen):
- `employerEmail` (String?) — från annons `employer.email`
- `employerPhone` (String?) — från `employer.phone_number`
- `applyEmail` (String?) — från `application_details.email` / `application_contacts[].email`
- `applyUrl` (String?) — från `application_details.url`
- `organizationNumber` (String?) — från `employer.organization_number`
(Dessa fylls av seeding-ingestorn — uppdatera den vid behov. Håll dem dolda i publikt API.)

**Ny modell `Application`:**
- `id`, `createdAt`
- `driverId` → User (DRIVER)
- `jobId` → Job
- `status` enum: `SUBMITTED | FORWARDED | VIEWED_BY_COMPANY | CLOSED`
- `consentToShare` (Boolean) — måste vara true för att skapas
- `messageFromDriver` (String?) — valfritt personligt meddelande
- unik (driverId, jobId) — ingen dubbelansökan

**Claim-mekanism, kopplad på `organizationNumber`:**
- Ny modell `EmployerClaim`: `id`, `organizationNumber` (unik), `claimToken` (unik, signerad/
  slumpad), `claimedByUserId?`, `claimedAt?`, `outreachSentAt?`, `outreachCount` (Int default 0).
- En claim representerar ett seedat åkeri som ännu inte tagit över. När det claimas kopplas
  alla `Job` med samma `organizationNumber` till åkeriets `Organization` och sätts `claimed: true`.

## Etapp 2 — Förarens ansökningsflöde

- "Ansök nu" är öppet att se, men kräver inloggning/registrering för att slutföras. Visa
  registrering vid ansökningsögonblicket (högst köpvilja där), inte som en vägg innan.
- För **oanslutna jobb** (`claimed: false`): visa ärlig text innan ansökan, t.ex.
  "Det här åkeriet är inte anslutet till STP ännu. Vi förmedlar din intresseanmälan och
  kontaktar dem åt dig. Du kan även söka direkt via originalannonsen: [applyUrl/sourceUrl]."
- Obligatorisk samtyckesruta: "Jag godkänner att STP delar min profil och ansökan med
  arbetsgivaren." Utan bock → ingen ansökan.
- Skapa `Application` (status `SUBMITTED`). Visa kvitto + nästa steg: andra matchande jobb,
  bekräfta att profilen nu är synlig för åkerier. **Aldrig en återvändsgränd.**
- För **anslutna jobb** (`claimed: true`): ansökan landar i åkeriets vanliga flöde
  (Conversation/Message eller befintlig ansökningsvy) — återanvänd det som redan finns.

## Etapp 3 — Åkeriets claim-flöde

- Generera/återanvänd en `EmployerClaim` för jobbets `organizationNumber`.
- Claim-länk: `/anslut/{claimToken}` (signerad, gärna med utgång, men återutfärdbar).
- Claim-landningssida visar: åkeriets förifyllda jobb (alla med samma org.nr) + antal väntande
  sökande ("3 förare har sökt era jobb"). Tydlig CTA: "Skapa konto och se kandidaterna".
- Vid kontoskapande: skapa COMPANY-User + Organization (status PENDING enligt befintlig
  verifieringslogik), sätt `EmployerClaim.claimedByUserId`, koppla alla matchande `Job`
  (`claimed: true`, `source` kan bli ORGANIC efter övertagande), och länka väntande
  `Application`-poster så de blir synliga.
- Logga i `AdminAuditLog`.

## Etapp 4 — Utåkningsmotorn (triggern)

- Vid **första** `Application` på ett oanslutet jobb: skapa/hämta `EmployerClaim` och köa ett
  utskick till bästa tillgängliga kontakt (`applyEmail` > `employerEmail`; SMS mot
  `employerPhone` som senare steg).
- Mejlet (via Resend, befintlig e-postlib) innehåller: vilken roll/behörigheter den sökande har
  (utan att läcka mer persondata än nödvändigt före kontoskapande), vilket jobb det gäller, och
  claim-länken.
- **Throttling/dedup:** max ett utskick per `organizationNumber` per X dagar. Fler ansökningar
  under tiden → uppdatera en sammanställning ("nu 4 sökande") snarare än spamma. Räkna i
  `outreachCount` / `outreachSentAt`.
- **Avregistrering:** varje mejl har en opt-out-länk; respektera den (B2B berättigat intresse,
  men måste gå att säga nej).
- **Review-läge (default till en början):** lägg utskicken i en admin-kö för manuellt godkännande
  istället för auto-send, så Oliver kan kalibrera ton och volym. Konfigurerbart till auto-send
  via env-flagga när han litar på flödet.

## Etapp 5 — Förtroende-vakter (UI)

- Byt "Verifierat företag" → "Importerad annons · ej anslutet åkeri" på alla `claimed: false`,
  med länk till originalannonsen. Reservera "Verifierat" för granskade, anslutna åkerier.
- På anslutna åkerier: behåll/visa "Verifierat" enligt befintlig verifieringsstatus.
- (Valfritt) vidarebefordra ansökan till `applyEmail` även för oanslutna jobb, så föraren
  garanterat når åkeriet medan claim-flödet pågår.

## Acceptanskriterier
- [ ] Schema migrerat: `Application`, `EmployerClaim`, nya Job-fält.
- [ ] Oinloggad förare som klickar "Ansök" leds till registrering och tillbaka till ansökan.
- [ ] Ansökan kräver samtyckesbock; skapar `Application` (SUBMITTED); ingen dubbelansökan.
- [ ] Första ansökan på oanslutet jobb skapar `EmployerClaim` och ett (kö-lagt) utskick.
- [ ] Andra ansökan på samma org.nr inom throttle-fönstret skapar INTE ett nytt utskick.
- [ ] Claim-länk öppnar landningssida med förifyllt jobb + väntande sökande.
- [ ] Efter claim: jobben kopplas till åkeriets Organization, `claimed: true`, ansökningar synliga.
- [ ] Oanslutna jobb visar ärlig provenans-märkning, inte "Verifierat företag".
- [ ] Opt-out-länk i utskick fungerar och blockerar framtida utskick.
- [ ] Dry-run/test-läge för utåkningen (loggar utan att skicka).

## Utanför scope (senare)
- SMS-utskick (börja med e-post).
- Proaktiv batchad åkeri-utåkning per region (separat motor).
- Notiser till förare när åkeriet ansluter och läser ansökan.
- Betalning/prissättning för åkerier (slutläge, inte nu).

## Instruktioner till Claude Code
- Läs server/prisma/schema.prisma och docs/SEEDING-JOBTECH-SPEC.md INNAN du skriver kod.
- Återanvänd befintliga mönster: auth/JWT, Conversation/Message, Resend-e-postlib, AdminAuditLog.
- Bygg en etapp i taget och stanna för granskning. Börja med Etapp 1 + 2.
- Allt konfigurerbart via env (throttle-fönster, review-läge vs auto-send). Hårdkoda inget.
- Utskick ska defaulta till review-kö, INTE auto-send.
