# Backend-stack och arkitektur

Översikt över vald stack och hur den håller för enterprise-användning.

---

## Nuvarande stack

| Lager | Teknik | Motivering |
|-------|--------|------------|
| **Runtime** | Node.js (LTS) | Stabil, bra ekosystem, enkel att deploya (Railway, Docker). |
| **Server** | Express | Enkel, väldokumenterad, tillräcklig för våra behov. |
| **ORM / DB** | Prisma + PostgreSQL | Typsäker modell, migreringar, bra DX. Postgres är robust och lämplig för produktion. |
| **Auth** | JWT (jsonwebtoken) + bcrypt | Stateless, skalar horisontellt. Lösenord hashas med bcrypt. |
| **E-post** | Resend | Enkel API, bra leverans. Konfigureras via RESEND_API_KEY. |
| **Hosting** | Railway | Enkel deploy, inbyggd Postgres, miljövariabler. |

---

## Vad som är enterprise-klart

- **Separat prod/demo:** Två Railway-projekt, två Postgres, `DEPLOYMENT=production` respektive `DEPLOYMENT=demo`. Demo-seed körs aldrig mot prod (guard i kod).
- **Startvalidering:** I produktion krävs `DATABASE_URL` och `JWT_SECRET`; vid saknad avbryts start med felmeddelande.
- **Health:** `GET /api/health` returnerar DB-status, e-postkonfiguration och `deployment` för att verifiera miljö.
- **CORS:** Begränsad till `FRONTEND_URL` (+ *.vercel.app för preview).
- **Rate limiting:** På auth och API för att begränsa missbruk.
- **Request ID + felhantering:** Spårbarhet och konsekvent felrespons.

---

## Vad som kan förstärkas vid behov

- **Migreringar:** Idag används `prisma db push`. För strikt historik och rollback kan `prisma migrate deploy` användas i CI och i produktion.
- **Strukturerad loggning:** T.ex. JSON-loggning (pino/winston) och loggnivåer underlättar central loggning (Datadog, Logtail, etc.).
- **Secrets:** Railway hanterar secrets som miljövariabler. För högre krav kan extern secrets-manager (t.ex. Vault) användas; koden behöver då bara läsa från env.
- **Övervakning:** Health-endpoint finns. APM (t.ex. OpenTelemetry) kan läggas till om ni vill ha spårning och mätningar.

Stacken är väl lämpad för ert nuvarande behov. Vid skalning eller striktare compliance kan ovan nämnda tillägg prioriteras.
