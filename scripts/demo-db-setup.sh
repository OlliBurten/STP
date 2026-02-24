#!/usr/bin/env bash
# Kör detta när du har en Neon (eller annan Postgres) connection string för DEMO-databasen.
# Exempel: ./scripts/demo-db-setup.sh "postgresql://user:pass@host/db?sslmode=require"
set -e
if [ -z "$1" ]; then
  echo "Användning: $0 <DATABASE_URL>"
  echo "Exempel: $0 \"postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require\""
  exit 1
fi
export DATABASE_URL="$1"
cd "$(dirname "$0")/../server"
echo "Kör prisma db push mot demo-databasen..."
npx prisma generate
npx prisma db push
echo "Kör demo-seed..."
DEMO_SEED=true npm run db:seed:demo
echo "Klart. Sätt nu DATABASE_URL i Railway för drivermatch-demo (railway variables --set DATABASE_URL=\"...\")"
