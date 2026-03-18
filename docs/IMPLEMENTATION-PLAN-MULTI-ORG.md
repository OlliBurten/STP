# Implementation plan: Rekryterare + Multi-organisation

## Vision

1. **Registrering**: "Chaufför" vs "Rekryterare" – rekryterare skapar personkonto först, lägger till företag senare.
2. **Multi-org**: En rekryterare kan hantera flera åkerier/företag under samma konto (t.ex. koncern med flera dotterbolag).

---

## Nuvarande modell (kort)

- **User** (role=COMPANY) har företagsdata direkt: companyName, companyOrgNumber, companySegmentDefaults, etc.
- **Job.userId** = företagets "owner" (User.id)
- **Conversation.companyId** = User.id (företagets owner)
- **CompanyMember** länkar inbjudna användare till en "company owner" (User.id)
- **CompanyInvite** = inbjudan till companyOwnerId

---

## Ny datamodell

### Organization (ny huvudentitet)

Företag/åkeri som egen entitet – oberoende av användare.

```prisma
model Organization {
  id                  String   @id @default(cuid())
  name                String
  orgNumber           String   @unique
  description         String?
  website             String?
  location            String?
  segmentDefaults     String[] @default([])  // FULLTIME, FLEX, INTERNSHIP
  bransch             String[] @default([])
  region              String?
  status              String   @default("PENDING")  // PENDING | VERIFIED | REJECTED
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  userOrganizations   UserOrganization[]
  jobs                Job[]
  conversations       Conversation[]
  reviews             CompanyReview[]
  invites             OrganizationInvite[]
}
```

### UserOrganization (many-to-many: användare ↔ organisationer)

```prisma
model UserOrganization {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  role           String   @default("MEMBER")  // OWNER | ADMIN | MEMBER
  joinedAt       DateTime @default(now())

  @@unique([userId, organizationId])
  @@index([organizationId])
  @@index([userId])
}
```

### User – förenklad

- **role**: `DRIVER` | `RECRUITER` (ersätter COMPANY)
- Ta bort: companyName, companyOrgNumber, companyDescription, companyWebsite, companyLocation, companySegmentDefaults, companyBransch, companyRegion, companyStatus
- Ta bort: lastMatchJobEmailAt, lastMatchDriverEmailAt (flytta till Organization om behövs)
- Behåll: driverProfile (för DRIVER), userOrganizations (för RECRUITER)
- CompanyInvite/CompanyMember ersätts av OrganizationInvite/UserOrganization

### Job

```prisma
// Ändring
organizationId  String
organization    Organization @relation(...)
// Behåll userId som createdBy (valfritt) eller ta bort
```

### Conversation

```prisma
// Ändring: companyId -> organizationId
organizationId  String
organization    Organization @relation(...)
```

### CompanyReview → OrganizationReview

```prisma
organizationId  String
organization    Organization @relation(...)
```

### OrganizationInvite (ersätter CompanyInvite)

```prisma
model OrganizationInvite {
  id             String   @id @default(cuid())
  email          String
  organizationId String
  organization   Organization @relation(...)
  invitedById    String
  tokenHash      String   @unique
  expiresAt      DateTime
  status         String   @default("PENDING")
  createdAt      DateTime @default(now())

  @@unique([email, organizationId])
}
```

---

## Migration från nuvarande modell

### Steg 1: Skapa Organization + UserOrganization

För varje User där role=COMPANY och companyOrgNumber finns:

1. Skapa `Organization` med data från User (name, orgNumber, description, …).
2. Skapa `UserOrganization(userId, organizationId, role=OWNER)`.
3. Uppdatera alla Job där userId = denna User: sätt organizationId.
4. Uppdatera alla Conversation där companyId = userId: sätt organizationId.
5. Uppdatera CompanyReview: companyId → organizationId (via mapping).

### Steg 2: Migrera CompanyMember

För varje CompanyMember:

1. Hitta owner: companyOwnerId → User → hitta dess Organization (via UserOrganization med OWNER).
2. Skapa UserOrganization(memberUserId, organizationId, role=MEMBER).
3. Ta bort CompanyMember.

### Steg 3: Migrera CompanyInvite

- Mappa companyOwnerId → organizationId.
- Skapa OrganizationInvite med organizationId.
- Ta bort CompanyInvite.

### Steg 4: Rensa User

- Ta bort company-fält från User (eller låt dem vara tomma under övergång).
- Byt role COMPANY → RECRUITER.

---

## Registreringsflöde

### Idag
- Chaufför: e-post, lösenord, namn → DriverProfile
- Företag: e-post, lösenord, namn, företagsnamn, org.nr → User med företagsdata

### Nytt
- **Chaufför**: oförändrat (e-post, lösenord, namn)
- **Rekryterare**: e-post, lösenord, namn – inga företagsfält
- Efter registrering som rekryterare: onboarding "Lägg till företag" (företagsnamn, org.nr, etc.) → skapa Organization + UserOrganization(OWNER)

### UI-text
- "Registrera som chaufför" / "Registrera som rekryterare"
- Vid login: "Chaufför" / "Rekryterare" (ej "Företag")

---

## Aktiva organisationen (context)

Rekryterare med flera organisationer behöver en vald organisation:

- **activeOrganizationId** i session/context (t.ex. localStorage + React context)
- Vid login: om endast en org → sätt som aktiv; om flera → använd senast vald eller första
- **Org-switcher** i headern eller dashboard: dropdown med användarens organisationer

---

## API-ändringar

### Auth

- `role`: RECRUITER istället för COMPANY
- JWT: `activeOrganizationId` (valfritt) för snabb åtkomst
- Vid login: returnera `organizations: [{ id, name, role }]`

### Companies → Organizations

| Gammal | Ny |
|--------|-----|
| GET /api/companies/me/profile | GET /api/organizations/me (lista) + GET /api/organizations/:id/profile |
| PUT /api/companies/me/profile | PUT /api/organizations/:id/profile |
| GET /api/companies/search | GET /api/organizations/search |
| GET /api/companies/:id/public | GET /api/organizations/:id/public |

### Nya endpoints

- `POST /api/organizations` – skapa organisation (rekryterare, onboarding eller "Lägg till företag")
- `GET /api/organizations/me` – användarens organisationer + roller
- `PATCH /api/me/active-organization` – sätt aktiv org (body: organizationId)
- Invites: `/api/organizations/:id/invites` (istället för /api/companies/me/invites)
- Invite accept: behåll `/api/invites/accept`, men koppla till Organization istället för User

### Jobs

- `POST /api/jobs`: kräver `organizationId` (eller använder activeOrganizationId)
- `GET /api/jobs/mine`: filtrera på användarens organisationer (via UserOrganization)

### Conversations

- `companyId` → `organizationId` överallt

---

## Frontend-ändringar

### Registrering/Login

- Byta "Företag" till "Rekryterare"
- Rekryterare: inga företagsfält i registrering
- OAuth: samma rollval "Rekryterare"

### Onboarding rekryterare

- Första gången: "Lägg till ditt första företag" (företagsnamn, org.nr, etc.)
- Om användaren inte har någon org: redirect till onboarding
- OnboardingGate: rekryterare utan org → `/rekryterare/onboarding` eller `/foretag/onboarding` (add-first-org)

### Org-switcher

- Dropdown i header/dashboard: "Åkeri X", "Åkeri Y", "+ Lägg till företag"
- Spara val i localStorage + context
- Alla företags-sidor använder activeOrganizationId

### "Lägg till företag"

- Sida eller modal: företagsnamn, org.nr, övriga fält
- Skapa Organization + UserOrganization(OWNER)
- Välj ny org som aktiv

### Företagsprofil

- `/foretag/profil` → `/foretag/:orgId/profil` eller använd activeOrganizationId
- För flera org: byt via org-switcher

---

## Faser (rekommenderad ordning)

### Fas 0: Förberedelser
- [ ] Backup av produktion
- [ ] Besluta om parallell körning (feature flags) eller big-bang migration

### Fas 1: Datamodell
- [ ] Skapa Organization, UserOrganization, OrganizationInvite
- [ ] Migrera CompanyInvite → OrganizationInvite (organizationId)
- [ ] Migrera CompanyMember → UserOrganization
- [ ] Lägg till Job.organizationId, Conversation.organizationId
- [ ] Migreringsskript: User (COMPANY) → Organization + UserOrganization
- [ ] Uppdatera CompanyReview till organizationId
- [ ] Ta bort/deprecatera company-fält på User

### Fas 2: Backend API
- [ ] Nya routes: /api/organizations, /api/organizations/me
- [ ] Migrera /api/companies/* till /api/organizations/*
- [ ] Uppdatera auth: role RECRUITER, organizations i svar
- [ ] activeOrganizationId i context/JWT
- [ ] Uppdatera jobs, conversations, invites

### Fas 3: Registrering & onboarding
- [ ] Byta "Företag" → "Rekryterare" i registrering
- [ ] Ta bort företagsfält ur registrering för rekryterare
- [ ] Onboarding: "Lägg till första företag"
- [ ] OAuth: samma rollbyte

### Fas 4: Org-switcher + "Lägg till företag"
- [ ] Context för activeOrganizationId
- [ ] Org-switcher i UI
- [ ] "Lägg till företag" för rekryterare med befintliga org

### Fas 5: Slutlig migration
- [ ] Migrera all data
- [ ] Ta bort gamla CompanyInvite, CompanyMember
- [ ] Rensa company-fält från User
- [ ] Uppdatera alla referenser till companies → organizations
- [ ] Tester och manuell verifiering

### Fas 6: Invite-flöde
- [ ] Uppdatera invite till Organization ( OrganizationInvite )
- [ ] Accept-flöde kopplat till Organization

---

## Risker & mjuk övergång

- **Breaking change**: alla company-referenser byter. Bra med feature flag för att växla mellan gammalt och nytt.
- **Migration**: kräver noggrann datamigrering och verifiering.
- **Backward compatibility**: övergångsperiod med både gamla och nya fält kan behövas.
- **Rollback-plan**: behåll gamla tabeller tills ny modell är stabil.

---

## Berörda filer (översikt)

| Område | Filer |
|--------|-------|
| Schema | `server/prisma/schema.prisma` |
| Migration | Nytt migreringsskript |
| Auth | `server/routes/auth.js`, `server/middleware/auth.js` |
| Orgs | `server/routes/organizations.js` (ny/ersätter companies) |
| Jobs | `server/routes/jobs.js` |
| Conversations | `server/routes/conversations.js` |
| Invites | `server/routes/invites.js`, `server/lib/invites.js` |
| Frontend | Login, Registrering, ForCompanies, CompanyProfile, Header |
| Context | AuthContext, ny OrganizationContext |

---

## Estimat

- Fas 1 (Datamodell + migration): 1–2 dagar
- Fas 2 (Backend API): 1–2 dagar
- Fas 3 (Registrering & onboarding): 0.5–1 dag
- Fas 4 (Org-switcher): 0.5–1 dag
- Fas 5–6 (Slutlig migration + invites): 1 dag

**Totalt**: grovt 4–7 dagar beroende på omfattning och tester.
