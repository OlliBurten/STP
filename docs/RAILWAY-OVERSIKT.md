# Railway – översikt (Enterprise-struktur)

## Aktiva projekt (2)

| Projekt | Syfte | Backend-URL | Databas | Används av |
|---------|-------|-------------|---------|------------|
| **drivermatch** | Live prod (STP) | nodejs-production-f3b9.up.railway.app | postgres-yjbv | transportplattformen.se |
| **drivermatch-demo** | Demo | drivermatch-demo-production.up.railway.app | Egen Postgres | transportplattform-demo.vercel.app |
| **drivermatch-clean** | Ej i bruk (deploya med `cd server && railway up`) | expressjs-postgres-production-605b | Egen Postgres | – |

---

## Prod: nodejs + postgres-yjbv

STP-backend deployas till **drivermatch** (nodejs) med `cd server && railway link -p drivermatch -s nodejs && railway up`. Använder postgres-yjbv automatiskt via projektvariabler.

Viktiga prod-variabler för readiness/status: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_API_KEY`, `GOOGLE_CLIENT_ID`, `AZURE_CLIENT_ID`.

---

## CLI-kommandon

```bash
# Prod-backend (STP, nodejs + postgres-yjbv)
railway link -p drivermatch -s nodejs
railway logs -s nodejs
railway variables

# Demo-backend
railway link -p drivermatch-demo
railway logs
```

Se [INFRASTRUKTUR.md](INFRASTRUKTUR.md) för fullständig konfiguration.
