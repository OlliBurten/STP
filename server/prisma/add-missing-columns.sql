-- Migration: Lägg till saknade kolumner (companyBransch, companyRegion, bransch)
-- Kör detta i Railway Postgres → Data → Query, eller via psql mot prod-databasen.
-- Säker: använder IF NOT EXISTS så det går att köra flera gånger.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyBransch" TEXT[] DEFAULT '{}';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyRegion" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "bransch" TEXT;
