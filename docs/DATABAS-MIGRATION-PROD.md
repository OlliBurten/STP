# Databasmigration på produktion

**Prod-backend:** Railway-projekt **drivermatch**, service **nodejs**.

Om backend returnerar 500 vid login med felet **"column X does not exist"** har databasen inte körts med senaste schema.

## Snabbfix – kör SQL manuellt

1. Öppna [Railway](https://railway.app) → projekt **drivermatch** → service **Postgres**.
2. Gå till **Data** → **Query**.
3. Kör:

```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyBransch" TEXT[] DEFAULT '{}';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyRegion" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "bransch" TEXT;
```

4. Testa login på transportplattformen.se eller drivermatch.se.
