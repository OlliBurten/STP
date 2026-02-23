# DriverMatch – Architecture & Design Direction

## Vision Statement
**DriverMatch** är en marknadsplats för yrkesförare i Sverige. Företag publicerar jobbannonser, chaufförer hittar arbete. Enkel, snabb, gjord för branschen.

---

## 0. Competitive Positioning: Bättre än Simplex Bemanning

**Simplex Bemanning AB** är ett etablerat bemanningsföretag (1300+ medarbetare, 400+ MSEK). Vi måste vara tydligt bättre.

| Område | Simplex | DriverMatch (mål) |
|-------|---------|-------------------|
| **Modell** | Bemanning – Simplex är arbetsgivare, chaufförer är "utlånade" | Direkt – företag och chaufförer träffas utan mellanhand |
| **Chauffören** | Inventory – placeras av Simplex | Användare – driver sitt eget läge, synlighet, ansökningar |
| **Fokus** | Alla branscher (logistik, transport, däck, lager, kundtjänst) | Endast yrkesförare – 100% transport |
| **Jobbflöde** | "Jag söker jobb" ➜ Teamtailor (ATS) ➜ ansökan till Simplex | Ansök direkt till företaget – inget mellanlag |
| **Företagssida** | Rekrytering, bemanning, driftpartner – säljande kontakt | Sök chaufförer själv – filter, reach-out, bjud in till jobb |
| **Relationsskapande** | Ettåriga avtal, placement | Direktrelation – historik, konversationer, uppföljning |
| **Avgifter** | Bemanningsmarginal (dold i kostnad) | Tydlig prismodell – företag betalar för plattformen, inte för chauffören |

### Var vi måste slå Simplex

1. **Mobil UX** – chaufförer söker från lastbilen; Simplex är desktop-först med generisk jobbsida
2. **Snabbhet** – en profil, en ansökan, direkt kontakt – ingen väntan på rekryterare
3. **Företag** – sök chaufförer själv, filtrera på CE/YKB/region, bjud in till jobb – ingen säljare mellan
4. **Transparens** – chaufförer ser vem som söker; företag ser vilka som är tillgängliga; ingen svart låda
5. **Branschkänsla** – CE, YKB, fjärr/lokalt, distribution – Simplex är generisk "logistik"

### Kort slagord

> **"Direktkontakt. Inga mellanhänder. Bara transport."**

---

## 1. Problem We Solve

| Nuvarande (Facebook m.fl.) | DriverMatch |
|---------------------------|-------------|
| Ostrukturerad sökning | Filtrerbar efter körkort, plats, typ |
| Inga standardiserade fält | Specifika fält för transportbranschen |
| Svårt att söka historik | Alla jobb sparade och sökbara |
| Ingen uppföljning | Tydlig status på ansökningar |
| Blandat med allt annat | Endast yrkesförare |

---

## 2. User Personas

### Företag (Arbetsgivare)
- Transportföretag, logistikbolag, distribution
- Behöver snabbt hitta chaufförer med rätt kvalifikationer
- Vill filtrera på: körkort (CE, C), YKB, erfarenhet, plats

### Chaufför ( jobbsökande)
- Yrkesförare med CE/C-kort, YKB
- Söker: fjärrkörning, lokalt, timjobb, fast anställning
- Vill se: lön/kilometerersättning, startdatum, tydliga krav

---

## 3. Core Features (Frontend-First)

### Phase 1 – MVP Design
```
┌─────────────────────────────────────────────────────────────┐
│  HEM          JOBB          OM OSS      LOGGA IN / REGISTRERA│
└─────────────────────────────────────────────────────────────┘

JOBB-SIDA (Huvudflöde)
├── Sökfält + filter
│   ├── Plats / region
│   ├── Körkort (CE, C)
│   ├── Anställningstyp (fast, vikariat, tim)
│   ├── Jobbtyp (fjärr, lokalt, distribution)
│   └── Datum
├── Jobblista (kortvy)
│   ├── Företagsnamn
│   ├── Titel
│   ├── Plats
│   ├── Körkortskrav
│   ├── Ersättning/lön (om angiven)
│   └── Publicerad
└── Jobbdetalj
    ├── Full beskrivning
    ├── Krav (körkort, YKB, erfarenhet)
    ├── Erbjudande (lön, förmåner)
    └── Ansök-knapp (disabled tills backend)

FÖRETAG-SIDA (Publicera jobb)
├── Formulär för ny annons
│   ├── Jobbtitel
│   ├── Beskrivning
│   ├── Körkortskrav
│   ├── Jobbtyp
│   ├── Plats/region
│   ├── Anställningstyp
│   ├── Ersättning (valfritt)
│   └── Kontakt
└── Mina annonser (placeholder)
```

### Truck Driver-Specific Fields
- **Körkort**: C, CE
- **YKB**: Ja/nej
- **Jobbtyp**: Fjärrkörning, Lokalt, Distribution, Timjobb
- **Anställning**: Fast, Vikariat, Timanställning, Egenföretagare
- **Tachograph**: Digital (EU-krav)

### Two-Way Marketplace (Företag söker chaufförer)
- **Driver visibility**: Opt-in "Synlig för företag" – annars synlig endast vid ansökan
- **Regions willing**: Regioner chauffören kan jobba i (viktigt för fjärr)
- **Company search**: Filter på körkort, region, certifikat, tillgänglighet, erfarenhetsår
- **Reach-out**: Generell förfrågan eller "Bjud in till jobb" (konkret annons)

---

## 4. Information Architecture

```
/                         → Landing / Hem
/jobb                      → Jobblista (sök + filter)
/jobb/:id                  → Jobbdetalj
/profil                    → Driver profile (CV)
/foretag                   → För företag (info + CTA)
/foretag/annonsera         → Publicera jobb (formulär)
/foretag/chaufforer        → Sök chaufförer (two-way marketplace)
/foretag/chaufforer/:id    → Chaufförprofil + kontakta
/om-oss                    → Om DriverMatch
/login                     → Inloggning (placeholder)
```

---

## 5. Design Principles

1. **Snabb & tydlig** – Chaufförer ska hitta jobb på sekunder, inte minuter
2. **Mobil först** – Många söker från lastbilen eller fritiden
3. **Svenska konventioner** – Datumformat, språk, branschtermer
4. **Ingen överbelastning** – Färre fält, tydligare val
5. **Branschkänsla** – Ser ut som ett verktyg för transport, inte generisk jobbsida
6. **Guided quality** – Jobbformuläret guider företag till kompletta, konsekventa annonser. Bra kvalitet ska vara enkel – inte något chaufförer måste leta efter. Alla jobb har samma fält; information varierar inte. Detta är vår differentiator mot Simplex och andra: *vi gör det enkelt att göra rätt, inte enkelt att göra fel.*

7. **Structured for matching** – Alla fält i profil och jobb är strukturerade så att vi kan matcha chaufförer med jobb och företag med chaufförer. Ju mer struktur, desto bättre matchning. Fritext minimeras där det påverkar matchning. Plattformen föreslår relevanta jobb för chaufförer och relevanta chaufförer för företag.

### Match Logic (skiss)

**Driver → Job:** Chaufförer får "Rekommenderade jobb" baserat på profil.

**Company → Driver:** Företag får "Chaufförer som matchar" för ett specifikt jobb.

**Matchningspoäng** (högre = bättre):

| Fält | Regel | Poäng |
|------|-------|-------|
| Körkort | driver.licenses ∩ job.license ≠ ∅ | +2 |
| Certifikat | job.certificates ⊆ driver.certificates | +1 per cert |
| Region | job.region ∈ driver.regionsWilling ∨ driver.region | +2 |
| Erfarenhet | driver.yearsExperience ≥ job.experience (min) | +1 |
| Tillgänglighet | driver.availability matchar job.employment | +1 |

Sortera på poäng, visa top N. Över tid: mer vikt på beteende (klick, ansökningar).

---

## 6. Tech Stack (Frontend Only)

- **Framework**: React + Vite (snabb, modern)
- **Routing**: React Router
- **Styling**: Tailwind CSS (flexibelt, snabbt)
- **Data**: Mock/local JSON tills backend finns
- **Språk**: Svenska (UI + content)

---

## 7. Next Steps

1. ✅ Architecture doc (klar)
2. Scaffold React + Vite + Tailwind
3. Bygga komponenter: Header, JobCard, Filter, JobDetail
4. Skapa mockade jobb
5. Implementera sidor enligt strukturen ovan
6. Polish: responsivitet, tillgänglighet, laddningsstates

---

*Nästa: Bygga frontend enligt denna plan.*
