# Implementation plan: Team member invites för företagskonton

## Bakgrund

Företag X registreras av Person A. Person B från samma företag ska kunna bjudas in och få åtkomst till samma workspace utan att skapa ett nytt företagskonto. Inviterade användare behöver inte göra onboarding – bara skapa konto (e-post/SSO) och verifiera.

## Nuvarande modell

- **User** (role=COMPANY) har all företagsdata direkt: companyName, companyOrgNumber, companySegmentDefaults, etc.
- **Job** har `userId` = den som äger/visar jobbet (företagets "owner")
- **Conversation** använder companyId = userId (företagets owner)

## Ny datamodell

### Nya tabeller

```prisma
model CompanyInvite {
  id              String   @id @default(cuid())
  email           String
  companyOwnerId  String   // User.id av företagets ägare
  company         User     @relation("CompanyInvites", fields: [companyOwnerId], references: [id], onDelete: Cascade)
  invitedById     String   // User.id av den som skickade inbjudan
  inviter         User     @relation("SentInvites", fields: [invitedById], references: [id], onDelete: Cascade)
  tokenHash       String   @unique
  expiresAt       DateTime
  status          String   @default("PENDING")  // PENDING | ACCEPTED | EXPIRED
  createdAt       DateTime @default(now())

  @@unique([email, companyOwnerId])  // en inbjudan per e-post per företag
  @@index([tokenHash])
  @@index([companyOwnerId])
}

model CompanyMember {
  id              String   @id @default(cuid())
  userId          String   @unique  // en användare kan (först) bara vara med i ett företag
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  companyOwnerId  String
  company         User     @relation("CompanyMembers", fields: [companyOwnerId], references: [id], onDelete: Cascade)
  role            String   @default("MEMBER")  // OWNER (implicit) | MEMBER
  joinedAt        DateTime @default(now())

  @@unique([userId, companyOwnerId])
  @@index([companyOwnerId])
}
```

### Ändringar i User

Lägg till relations:

```prisma
// I User-modellen
companyInvitesReceived  CompanyInvite[]  // om vi vill spåra vilka inbjudan user fick
companyMembership       CompanyMember?   @relation("CompanyMember")  // null = owner/standalone
companyInvites          CompanyInvite[]   @relation("CompanyInvites")
companyMembers          CompanyMember[]  @relation("CompanyMembers")
sentInvites             CompanyInvite[]   @relation("SentInvites")
```

## Arkitektur: "Company" = Owner User

Vi behåller att företag = den User som skapade det (companyOwnerId = owner's userId). Inviterade användare har:
- `User` med role=COMPANY men utan companyName, companyOrgNumber etc.
- `CompanyMember` som länkar deras userId till companyOwnerId

När en member är inloggad: all company-data hämtas från owner (User med id=companyOwnerId).

## Faser

### Fas 1: Datamodell och migration
1. Lägg till `CompanyInvite` och `CompanyMember` i schema
2. Kör `npx prisma migrate dev --name add_company_invites`
3. Uppdatera auth/JWT så att invited members får `companyOwnerId` + företagets segment i token

### Fas 2: Backend API för inbjudan
1. **POST /api/companies/me/invites** – Skicka inbjudan (email krävs). Kräver att användaren är owner eller member med rättighet.
2. **GET /api/companies/me/invites** – Lista skickade inbjudan (PENDING, ACCEPTED)
3. **DELETE /api/companies/me/invites/:id** – Återkalla inbjudan
4. E-postutskick vid invite med länk: `/invite/accept?token=XXX`

### Fas 3: Invite accept-flöde
1. **GET /api/invites/accept?token=XXX** – Validera token, returnera företagsnamn + info
2. **POST /api/invites/accept** – Acceptera invite (body: token, och antingen login-credentials ELLER ny registrering: email, password, name). Backend:
   - Verifierar token
   - Om användare finns: koppla till företag via CompanyMember
   - Om användare saknas: skapa User (role=COMPANY, utan företagsfält) + CompanyMember
   - Skicka verifieringsmail om e-post inte redan verifierad
   - Returnera JWT

### Fas 4: Auth och JWT för members
1. Vid login: kolla om User har CompanyMember → sätt companyOwnerId i JWT
2. Vid JWT-issue: för members, hämta owner's companySegmentDefaults, companyName etc. och inkludera i token
3. Middleware `requireCompany`: tillåt både (a) role=COMPANY med egen company-data OCH (b) role=COMPANY med CompanyMember
4. Endpoints som /me/profile, jobs etc.: för members, använd companyOwnerId för att hämta/skriva mot rätt företag

### Fas 5: Onboarding-logik för invited users
1. Invited users ska ALDRIG se company-onboarding (de ärver företagets data)
2. OnboardingGate: om `user.companyOwnerId` finns (member) → ingen onboarding
3. Verifieringskrav: invited users måste ha verifierad e-post innan full åtkomst (samma som idag för companies)

### Fas 6: Frontend – skicka inbjudan
1. Ny sida eller sektion under företagsinställningar: "Bjud in teammedlemmar"
2. Formulär: e-post, knapp "Skicka inbjudan"
3. Lista över skickade inbjudan (status, e-post, datum)

### Fas 7: Frontend – acceptera inbjudan
1. Ny route: `/invite/accept?token=XXX`
2. Om token ogiltig: visa felmeddelande
3. Om token giltig: visa företagsnamn + två lägen:
   - **Har redan konto**: Logga in (e-post + lösenord eller SSO)
   - **Har inte konto**: Registrera (e-post, lösenord, namn) – inga företagsfält
4. Efter lyckad login/registrering: omdirigera till `/foretag` eller dashboard

### Fas 8: Jobb och övriga features för members
1. **Skapa jobb**: När member skapar jobb, sätt Job.userId = companyOwnerId (så jobbet tillhör företaget)
2. **Konversationer**: companyId i Conversation = companyOwnerId
3. **Profil/inställningar**: Members kan se (ev. read-only) företagsprofil; endast owner kan redigera vissa fält (valfritt)
4. **Meddelanden**: Members ska se företagets konversationer

### Fas 9: Begränsningar (valfritt för v1)
- Max antal inbjudna per företag (t.ex. 5–10)
- Endast owner får bjuda in (members kan inte bjuda in nya)
- Roller (admin/member) för framtida utbyggnad

## Tekniska anteckningar

### E-post
- Använd befintlig `sendEmail` i `server/lib/email.js` för invite-meddelanden
- Mall: "Du är inbjuden till [Företagsnamn] på Transportplattformen. [Länk med token]. Länken gäller 7 dagar."

### Token
- Token: `crypto.randomBytes(32).toString("hex")`
- Lagra tokenHash (SHA256) i DB, skicka raw token endast i e-post
- TTL: 7 dagar (konfigurerbar)

### Säkerhet
- E-post måste matcha invite-email när man accepterar
- En användare kan bara acceptera en invite om e-post stämmer (för SSO: account linking gäller redan)
- Verifiera att inviter har åtkomst till företaget (owner eller med rättighet)

## Berörda filer (översikt)

| Område | Filer |
|--------|-------|
| Schema | `server/prisma/schema.prisma` |
| Auth/JWT | `server/routes/auth.js`, `server/middleware/auth.js` |
| Companies | `server/routes/companies.js` (nya endpoints) |
| Invites | `server/routes/invites.js` (ny fil) |
| E-post | `server/lib/email.js`, ny `server/lib/inviteEmail.js` |
| Onboarding | `src/components/OnboardingGate.jsx`, `src/pages/ForCompanies.jsx` |
| Frontend | Ny `src/pages/InviteAccept.jsx`, `src/pages/CompanySettings.jsx` eller liknande |
| Auth context | `src/context/AuthContext.jsx` (hantera companyOwnerId i user) |

## Ordföljd för implementation

1. Schema + migration  
2. Auth/JWT + middleware (så members fungerar i backend)  
3. Invite API (skicka, lista, acceptera)  
4. E-post vid invite  
5. Invite accept-frontend  
6. Onboarding-skip för members  
7. Frontend för att skicka inbjudan  
8. Jobb/conversation-logik för members  
