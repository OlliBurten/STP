# Railway – översikt (Enterprise-struktur)

## Aktiva projekt (2)

| Projekt | Syfte | Backend-URL | Används av |
|---------|-------|-------------|------------|
| **drivermatch** | Live prod | nodejs-production-f3b9.up.railway.app | transportplattformen.se, drivermatch.se |
| **drivermatch-demo** | Demo | drivermatch-demo-production.up.railway.app | transportplattform-demo.vercel.app |

---

## Avvecklat projekt

| Projekt | Status | Åtgärd |
|---------|--------|--------|
| **drivermatch-clean** | Avvecklat | Pausa eller ta bort i Railway dashboard. Användes tidigare av transportplattformen.se men ersattes av drivermatch (nodejs). |

---

## CLI-kommandon

```bash
# Prod-backend
railway link -p drivermatch -s nodejs
railway logs -s nodejs
railway variables

# Demo-backend
railway link -p drivermatch-demo
railway logs
```

Se [INFRASTRUKTUR.md](INFRASTRUKTUR.md) för fullständig konfiguration.
