#!/usr/bin/env bash
# Daglig säkerhetskopia av produktionsdatabasen.
#
# Bakgrund: Railways volymbackuper är en Pro-funktion. När workspacet gick ner
# till Hobby (2026-08-17) slutade både schemalagda och manuella backuper att
# fungera — API:t svarar "Not Authorized". Den här rutinen ersätter dem.
#
# Kopian hamnar på Olivers egen dator (Sverige), inte hos tredje part. Det är
# en kopia av personuppgifter och ska stå i GDPR-registret.
#
# Körs dagligen 03:15 av launchd (se.transportplattformen.dbbackup) men går
# lika bra att köra för hand före riskabla ingrepp:  bash scripts/backup-db.sh
#
# OBS vid ändringar: launchd får inte läsa filer under ~/Desktop (macOS TCC
# svarar "Operation not permitted"), så den schemalagda körningen använder en
# installerad kopia. Efter varje ändring här:
#
#   cp scripts/backup-db.sh ~/.stp/bin/backup-db.sh
#
# Återställning från en dump:
#   createdb stp_restore && pg_restore -d stp_restore --no-owner ~/STP-backups/stp-<datum>.dump
set -euo pipefail

DEST="${STP_BACKUP_DIR:-$HOME/STP-backups}"
KEEP_DAYS=14
PROJECT_ID="3fca3ff3-e1c6-461d-aac9-b1fde0fd042c"   # Railway: drivermatch
ENV_ID="c576bd2f-c28b-4387-895e-c4954fd85a37"       # production
PG_SERVICE_ID="9ce8d850-2baa-4639-bfc7-f1c31e770903" # Postgres-YJBV

log() { printf '%s  %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
fail() { log "FEL: $*"; exit 1; }

command -v pg_dump >/dev/null || fail "pg_dump saknas (brew install postgresql@17)"

# Anslutningssträngen hämtas vid körning ur Railway — inget lösenord i repot.
TOKEN=$(python3 -c "
import json,os
c=json.load(open(os.path.expanduser('~/.railway/config.json')))
print(c.get('user',{}).get('token') or c.get('token') or '')") || fail "kunde inte läsa Railway-token"
[ -n "$TOKEN" ] || fail "tom Railway-token — kör 'railway login'"

DB_URL=$(curl -s --max-time 30 -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"query\":\"query { variables(projectId: \\\"$PROJECT_ID\\\", environmentId: \\\"$ENV_ID\\\", serviceId: \\\"$PG_SERVICE_ID\\\") }\"}" \
  https://backboard.railway.com/graphql/v2 \
  | python3 -c "
import json,sys
d=json.load(sys.stdin)
v=(d.get('data') or {}).get('variables') or {}
print(v.get('DATABASE_PUBLIC_URL',''))") || fail "kunde inte nå Railways API"
[ -n "$DB_URL" ] || fail "DATABASE_PUBLIC_URL saknas — kolla att Postgres-tjänsten har en publik proxy"

mkdir -p "$DEST"
chmod 700 "$DEST"
STAMP=$(date '+%Y-%m-%d-%H%M')
FILE="$DEST/stp-$STAMP.dump"

log "dumpar produktionsdatabasen → $(basename "$FILE")"
pg_dump --format=custom --no-owner --no-privileges --file="$FILE" "$DB_URL" \
  || fail "pg_dump misslyckades"
chmod 600 "$FILE"

# En dump som är misstänkt liten är värre än ingen dump, för den ser ut att
# fungera. Basnivån ligger runt 1 MB — under 200 kB är något fel.
SIZE=$(stat -f %z "$FILE")
[ "$SIZE" -gt 200000 ] || fail "dumpen är bara $SIZE byte — behåller den inte"

TABLES=$(pg_restore --list "$FILE" | grep -c "TABLE DATA" || true)
log "klar: $(du -h "$FILE" | cut -f1), $TABLES tabeller med data"

# Rotation — behåll de senaste KEEP_DAYS dygnen.
DELETED=$(find "$DEST" -name 'stp-*.dump' -type f -mtime +$KEEP_DAYS -print -delete | wc -l | tr -d ' ')
[ "$DELETED" -gt 0 ] && log "rensade $DELETED backuper äldre än $KEEP_DAYS dagar"

log "totalt $(find "$DEST" -name 'stp-*.dump' | wc -l | tr -d ' ') backuper, $(du -sh "$DEST" | cut -f1) på disk"
