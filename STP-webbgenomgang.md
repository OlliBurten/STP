# STP – Webbgenomgång (live-sajt, transportplattformen.se)

Komplett genomgång 2026-05-22 av **alla tre ytor**: publik (utloggad) sajt, inloggad förarvy och inloggad åkerivy. Detaljerade avsnitt per yta längre ned i dokumentet.

## Sammanfattning (alla tre ytor)

**Produkten är imponerande byggd — långt bortom en typisk en-persons-MVP.** Designen är professionell, founder-storyn på /om-oss är stark, bloggen och verktygen (Lönekalkylator, YKB-timer) är riktiga tillgångar, och både förar- och åkeri-apparna har djup (100/100-profil, 4-stegs jobb-wizard med live-förhandsvisning, team-roller, livscykelhantering). Hantverket är inte problemet.

**Två teman går igenom alla tre ytor och är det som håller tillbaka produkten just nu:**

1. **Hela produkten utger sig för att vara en livlig tvåsidig marknadsplats som ännu inte finns.** Heron lovar "4 080 nya tjänster" (1 jobb finns), "hundratals åkerier" (1 finns), regionfilter överallt ger noll träffar, och – mest skadligt – ett inloggat **åkeri** som söker "Hitta förare" ser **0 förare** trots att förare är största tillgången. Varje sådan sak signalerar "tomt" till en ny besökare.  
2. **Kärnlöftet – matchning – är buggigt.** Samma jobb \+ samma förare visar **fyra olika matchningssiffror** beroende på vy (0 % / 5 % / 29 % / 45 %), och råa databasfältnamn ("Digitalt\_fardskrivarkort") läcker till UI:t.

**Topp-3 att fixa (prioriterat):**

1. Inkonsekvent matchningsprocent (0/5/29/45 % för samma jobb). Kärnfunktionen.  
2. "Hitta förare" visar 0 förare för inloggade åkerier (sannolikt overifierad-grind utan tydligt budskap).  
3. Rama om uppblåsta siffror/CTA:er till ärligt, marknadsramat språk och lyft fram profilskapande medan marknadsplatsen fylls – ligger i linje med förare-först-strategin.

---

## Det som är starkt (behåll)

- **Designen håller hög nivå.** Mörkt, industriellt, amber-accent, stark typografi, roterande rubrik ("Rätt Match / Förare / Åkeri. Direkt"). Ser ut som en riktig produkt, inte ett sidoprojekt.  
- **Positioneringen är vass och tydlig:** inga mellanhänder, inga bemanningsbolag, inga avgifter, direktkontakt. Stark wedge mot bemanningsbolag som tar 25–40 %.  
- **/om-oss är sajtens bästa sida.** Founder-storyn ("Byggt av en som sökte jobb och inte hittade rätt ställe") är äkta och förtroendeingivande, med branschstöd (Transportföretagen, Sveriges Åkeriföretag) och ärlig "STP är i tidig fas".  
- **Bloggen (/blogg) är en riktig tillgång.** \~12 guider (CE-körkort, YKB, ADR, löner, kollektivavtal, fjärrkörning …) med officiella källor. Stark SEO-motor för att dra in förare organiskt.  
- **Förarregistreringen är smidig:** namn, e-post, lösenord \+ Google/Microsoft. Låg friktion.  
- **Bra detaljer:** snygg 404-sida, segmentstruktur (fast/flex/utbildning), automatisk Bolagsverket-verifiering, FAQ som bemöter "är ni ett bemanningsbolag?".

---

## Att åtgärda (prioriterat)

### P1 – Trovärdighetsgapet (viktigast)

Hero visar stora siffror ("4 080 nya tjänster att tillsätta", "5 662 nyanställda senaste 12 mån", "36 % av åkerier har rekryteringsproblem"). En besökare läser dem som **plattformens** aktivitet – men nästa klick ("Se lediga jobb") visar **1 jobb**. Det känns som bait-and-switch, även om det inte är meningen.

- **Märk siffrorna tydligt som marknads-/branschdata**, inte plattformsdata. T.ex. "4 080 lediga förartjänster i Sverige varje år".  
- **Gör "Skapa förarprofil" till primär CTA** istället för "Se lediga jobb" så länge jobben är få. Profilskapande funkar utmärkt med en tom marknadsplats – det är så du bygger förarsidan.

### P1 – Återkommande överlöfte: "hundratals åkerier"

Frasen "hundratals åkerier" / "hundratals möjligheter" återkommer (registrering, blogg-CTA m.fl.). Med \~1 anslutet åkeri riskerar det förtroendet. **Mjuka upp till samma ärliga, framåtblickande ton som redan finns på /om-oss och /forare.**

### P2 – Copy-bugg på jobbsidan

Står "**1 annonser**" – ska vara "**1 annons**" (singular). Liten men syns på den viktigaste sidan.

### P2 – Tomma regionfilter

Region-chipsen på jobbsidan (Stockholm, Skåne, Göteborg …) ger noll träffar vid klick. UI:t antyder rikstäckande aktivitet som inte finns. **Överväg att dölja regionvalen tills volymen finns, eller visa ett snyggt tomt-läge** ("Inga jobb i \[region\] än – skapa en profil så hör rätt åkeri av sig") som fångar leadet i stället för att exponera tomheten.

### P3 – Bloggen behöver fräschas upp

Inläggen är daterade mars–april 2025 (\~13 mån gamla) och refererar till "2025". Planera uppdatering \+ nya inlägg – bra både för trovärdighet och löpande SEO.

### P3 – Tunn utbudssida även för åkerier

"Se åkerier på STP" exponerar att det knappt finns åkerier än. Samma tomt-läge-tänk som för jobben.

---

## Koppling till strategin (förare först)

Sajten är byggd för en blomstrande tvåsidig marknadsplats du ännu inte har. I förare-först-fasen:

1. Led **alla** CTA mot profilskapande (inte jobblistan).  
2. Rama om siffror som **marknadsmöjlighet**, inte plattformsaktivitet.  
3. Använd den **ärliga beta-tonen överallt** – den finns redan på /om-oss och /forare. Då slutar tom-läget skada.

När du har \~100 förare med region \+ segment registrerade vänder du på det och kör cold outreach mot åkerier med en konkret morot.

---

---

## Inloggad förarvy (granskad 2026-05-22)

Granskat som inloggad förare: profil, Matchningar, jobbsök, åkeridatabas.

### Starkt

- **Profilstyrka 100/100** med checklista – bra gamification som driver förare att fylla i allt.  
- **Delbar profillänk** (transportplattformen.se/forare/\[id\]) – åkerier ser profilen utan inloggning. Smart.  
- **6-stegs produkttur** för nya förare ("visar dig runt på 1 minut"). Bra onboarding.  
- **Matchningssignaler** på jobbkort: visar uppfyllda vs ej uppfyllda krav (✓ CE, ✓ YKB, – Norrbotten).  
- **Imponerande segment-taxonomi** i åkeridatabasen (50+ segment).  
- Ärliga tomt-lägen ("Inga visningar än").  
- Extra verktyg syns i footern: **Lönekalkylator, YKB-timer, Praktik & APL, Vision & roadmap**.

### Buggar / problem att fixa

**P1 – Matchningsprocenten är inkonsekvent (viktigast på förarsidan).** Samma jobb \+ samma förare visar **fyra olika matchningssiffror** beroende på var man tittar:

- Fliken Matchningar: **0 %**  
- Jobblistan \+ Favoriter: **5 %**  
- Åkeriprofilens jobblista: **29 %**  
- Jobbets detaljsida: **45 %**

Matchningen beräknas eller hämtas alltså olika i minst fyra komponenter. Eftersom "smart matchning" är hela produktlöftet är detta den enskilt viktigaste buggen att fixa. Sannolikt i `matchUtils.js` \+ de olika vyernas anrop.

**Övriga buggar:**

- **Råa databasfältnamn läcker till UI.** På jobbdetaljsidan: "Certifikat: YKB, **Digitalt\_fardskrivarkort, Forarkort**" – understreck och saknade å/ö. Visar interna enum-nycklar i stället för etiketter.  
- **Inkonsekvent certifikatcheck.** Jobblistan visar individuellt (✓ YKB, ✓ Digitalt färdskrivarkort, – Förarkort) medan detaljsidan slår ihop hela gruppen till ett ✗ trots att föraren har YKB \+ digitalt färdskrivarkort.  
- **Dubbla budskap på jobbsidan.** Visar ett jobb *och* "Inga jobb hittades / rensa filter" samtidigt.  
- **Datainkonsekvens mellan vyer.** Samma jobb: publikt/detalj \= "Kaunis Iron Logistik AB" (Verifierat), i Matchningar-fliken \= "Okänt företag · Norrbotten".  
- **Dubbla/placeholder-sektioner i jobbtexten.** Efter en komplett annonstext kommer generiska tomma sektioner ("Arbetsuppgifter specificeras vid intervju", "Krav specificeras vid kontakt"). Ser redundant ut.  
- **Två konkurrerande ansökningsvägar.** STP:s egen "Ansök nu"-knapp \+ en extern ATS-länk (candidate.hr-manager.net) i brödtexten. Förvirrande och krockar med direktkontakt-löftet.  
- **Tomma profilfält** på åkerikortet (Förare –, Flotta –, Grundat –).  
- **"Marknad i din region"** säger "Andel **aktiva jobb** som kräver respektive" men datan är TYA-marknadsdata, inte plattformens jobb.

### Det som funkar bra (inloggad förare)

- **Profil \+ redigeringsläge:** Profilstyrka 100/100 med checklista, inline-redigering, smart "Inga ändringar"-knapp när inget ändrats.  
- **Statistik-fliken:** tre stat-kort (visningar 7/30 dgr, kontaktade av åkerier) med konkreta nudges och vänligt "din profil är ny"-läge.  
- **Favoriter / Mina ansökningar / Meddelanden:** rena vyer med snygga, vägledande tomt-lägen och statusfilter i inkorgen.  
- **Jobbdetalj:** fyllig, "Din profil är ditt CV — inget att ladda upp" är en stark USP, Snabbfakta \+ liknande jobb.  
- **Åkeriprofil:** Verifierat-badge, "Skicka meddelande" (direktkontakt), omdömessektion, svarsfrekvens.  
- **Branschverktyg (riktiga tillgångar för förarvärvning \+ SEO):**  
  - **Lönekalkylatorn** – interaktiv, baserad på Transportavtalet 2025–2027; ger avtalsgolv \+ uppskattad marknadslön per erfarenhet/körtyp/cert/region/OB. Stark och delningsbar.  
  - **YKB-timer** – räknar ut när YKB löper ut \+ förnyelsefakta.  
  - **Praktik & APL** – riktar sig till elever/åkerier/skolor, smart AF-vinkel (AF-finansierade CE/YKB-elever → första jobbet). Bra supply-wedge.

### Strategiskt att kolla

- Det enda jobbet (Kaunis Iron) avslutas med en **extern ansökningslänk** (HR-manager ATS) och "Annons- och rekryteringsföretag undanbedes". Ser ut som en **importerad annons** där ansökan sker utanför STP. Verifiera om detta är det riktiga åkeriet du onboardade eller seedat innehåll.

---

---

## Inloggad åkeri-/företagsvy (granskad 2026-05-22)

Granskat som inloggat åkeri ("E Gustavssons Bilservice AB", ej verifierat ännu): Översikt, Hitta förare, Publicera jobb, Mina annonser, Team, Meddelanden.

### Det som funkar bra

- **Översikt/dashboard:** verifieringschecklista (2 av 4 steg), stat-kort, jobbvisningschart (12 v), aktivitetsflöde, "Synlighet i åkeridatabasen 33 %"-prompt. Onboarding-fokuserat och tydligt.  
- **Publicera jobb – en höjdpunkt.** 4-stegs wizard (Grundinfo → Annonstext → Villkor & lön → Förhandsgranska) med **live "Förarens vy"-förhandsvisning**, "Annonsens styrka"-mätare och mycket genomtänkta fält (alla körkortsklasser, lång certifikatlista, erfarenhet, schema).  
- **Mina annonser:** livscykel-flikar (Aktiva/Pausade/Avslutade/Alla).  
- **Team:** fleranvändarstöd med tydliga roller (**Ägare/Admin/Teammedlem**) \+ e-postinbjudan. Bra för större åkerier.  
- **Meddelanden:** samma rena inkorg som förarsidan.

### Buggar / problem att fixa

**P1 – "Hitta förare" visar 0 förare.** Åkerisidans kärnfunktion (sök i förardatabasen) visar **"0 förare · Inga förare matchar dina filter"** utan filter – trots att förare är din största tillgång och minst en komplett, synlig förarprofil finns. Troligen **verifieringsgrinden** (overifierat åkeri kan inte se förare) men sidan **säger inte det** – den ser ut som en tom databas i stället för "verifiera för att låsa upp sök". Antingen missvisande tomt-läge på den viktigaste åkerifunktionen, eller en bugg. Bör utredas i koden.

**Övrigt:**

- **Marknad vs verklighet i verifiering.** Publika "För åkerier" lovar "verifiering sker automatiskt mot Bolagsverket och ni kan publicera jobb direkt". Verkliga flödet kräver uppladdning av F-skattsedel \+ trafiktillstånd och "normalt 1 arbetsdag". Förena budskapen.  
- **Dubbletter i certifikatlistan** i jobb-wizarden ("Truck A/B/C/D" förekommer två gånger – en gång med beskrivning, en gång som bara namn).  
- **Webbläsartiteln uppdateras inte** på /foretag/team (visar "Mina annonser").  
- **Inkonsekvent inkorg:** åkeri-inkorgen saknar statusfiltren (Alla/Olästa/…) som förar-inkorgen har.

---

## Inte granskat än (kan göras vid behov)

- Kontomeny/inställningar (avatar-menyn): notisinställningar, utloggning, radera konto.  
- Verifieringens dokumentuppladdning (F-skattsedel, trafiktillstånd) och vad som låses upp efter verifiering.  
- Sista steget i "Publicera jobb" (om publicering blockeras för overifierat åkeri).  
- Företagsprofil-redigering i sin helhet, samt växling mellan flera åkerier (company switcher).  
- Info-undersidor: Så fungerar STP, Nyheter/Vad är nytt, Branschinsikter, Vision & roadmap.

