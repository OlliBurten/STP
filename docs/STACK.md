# Stack – Enterprise-struktur

Övergripande översikt över hela stacken. Alla lager ska vara konsekvent organiserade.

---

## Arkitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vercel)                         │
├─────────────────────────────┬───────────────────────────────────┤
│ Live                         │ Demo                              │
│ drivermatch-20260212         │ transportplattform-demo           │
│ transportplattformen.se      │ transportplattform-demo.vercel.app│
│ drivermatch.se               │                                   │
└──────────────┬───────────────┴──────────────┬────────────────────┘
               │ VITE_API_URL                 │
               ▼                             ▼
┌──────────────────────────────┬──────────────────────────────────┐
│ BACKEND (Railway)            │ BACKEND (Railway)                 │
│ drivermatch / nodejs         │ drivermatch-demo                  │
│ nodejs-production-f3b9...    │ drivermatch-demo-production...   │
└──────────────┬───────────────┴──────────────┬────────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┬──────────────────────────────────┐
│ DATABAS (Postgres)           │ DATABAS (Postgres)                │
│ drivermatch-projektet        │ drivermatch-demo-projektet        │
│ Prod-data                    │ Demo-data                         │
└──────────────────────────────┴──────────────────────────────────┘
```

---

## Dokumentation

| Dokument | Innehåll |
|----------|----------|
| [INFRASTRUKTUR.md](INFRASTRUKTUR.md) | Miljövariabler, Railway, Vercel – huvudreferens |
| [RAILWAY-OVERSIKT.md](RAILWAY-OVERSIKT.md) | Railway-projekt, vad som är aktivt/avvecklat |
| [VERCEL-SSO.md](VERCEL-SSO.md) | Google/Microsoft-inloggning |
| [RUNBOOK-INLOGGNING.md](RUNBOOK-INLOGGNING.md) | Felsökning inloggning |
| [FIX-PROD-NU.md](FIX-PROD-NU.md) | Akut åtgärd vid nedtagen prod |
| [DATABAS-MIGRATION-PROD.md](DATABAS-MIGRATION-PROD.md) | DB-schema-migration |

---

## Nyckel-URL:er

| Miljö | Frontend | Backend Health |
|-------|----------|----------------|
| Live | https://transportplattformen.se | https://nodejs-production-f3b9.up.railway.app/api/health |
| Demo | https://transportplattform-demo.vercel.app | https://drivermatch-demo-production.up.railway.app/api/health |
