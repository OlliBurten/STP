# Åtgärda login 500 – DB-migration (drivermatch-clean)

Backend returnerar 500 vid login pga. saknade databaskolumner. **Kör denna SQL en gång:**

## Steg

1. Öppna **[railway.app](https://railway.app)** → projekt **drivermatch-clean**
2. Klicka på **Postgres**-tjänsten
3. **Data** → **Query** (eller **Query**-fliken)
4. Klistra in och kör:

```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyBransch" TEXT[] DEFAULT '{}';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyRegion" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "bransch" TEXT;
```

5. Testa login igen på transportplattformen.se.

---

**Microsoft "invalid redirect_uri":** Lägg till `https://transportplattformen.se` i Azure Portal → App registrations → din app → Authentication → Redirect URIs. Se [VERCEL-SSO.md](VERCEL-SSO.md).
