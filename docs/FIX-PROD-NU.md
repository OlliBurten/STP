# Åtgärda nedtagen prodsida

**Prod använder nu drivermatch (nodejs).** Om login fortfarande ger fel:

1. **Kontrollera Vercel:** `VITE_API_URL` ska vara `https://nodejs-production-f3b9.up.railway.app`. Redeploy efter ändring.
2. **Kontrollera Railway:** Projekt **drivermatch**, service **nodejs**. `FRONTEND_URL` ska inkludera transportplattformen.se och drivermatch.se.
3. **Databasfel (500):** Om backend returnerar 500 pga. saknade kolumner, kör SQL i Railway → drivermatch → Postgres → Data → Query:

```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyBransch" TEXT[] DEFAULT '{}';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyRegion" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "bransch" TEXT;
```

Se [INFRASTRUKTUR.md](INFRASTRUKTUR.md) för fullständig översikt.
