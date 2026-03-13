# Databasmigration på produktion (drivermatch-clean)

Om backend returnerar 500 vid login med felet **"column X does not exist"** har databasen inte körts med senaste schema. Denna guide fixar det.

## Snabbfix – kör SQL manuellt

1. Öppna [Railway](https://railway.app) → projekt **drivermatch-clean** → service **Postgres**.
2. Gå till **Data** → **Query** (eller Connect → psql).
3. Kör innehållet i `server/prisma/add-missing-columns.sql`:

```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyBransch" TEXT[] DEFAULT '{}';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyRegion" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "bransch" TEXT;
```

4. Testa login på transportplattformen.se.

## Alternativ – Prisma db push via Railway

Om du har `DATABASE_PUBLIC_URL` från Postgres-tjänsten (sätt den i expressjs-postgres om den saknas):

```bash
cd server
railway link -p drivermatch-clean -s expressjs-postgres
railway run env | grep DATABASE_PUBLIC_URL  # verifiera att den finns
# Om den finns:
DATABASE_URL="<kopiera DATABASE_PUBLIC_URL>" npx prisma db push
```

**OBS:** `railway run` ger ofta intern `DATABASE_URL` som inte når från din dator. Då är SQL-metoden ovan enklast.
