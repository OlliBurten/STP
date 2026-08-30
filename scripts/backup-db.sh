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
#
# Härdning 2026-08-30: Railways publika Postgres-proxy tappar sporadiskt
# anslutningen mitt i dumpen (2 av 14 nätter). Tre saker gjorde det värre än
# det behövde vara: den halvskrivna filen låg kvar och såg ut som en backup,
# felet syntes bara i loggen, och ett enda tappat paket sänkte hela natten.
# Nu: städning av ofullständiga dumpar, tre försök, och larmmejl när natten
# ändå går förlorad.
set -euo pipefail

DEST="${STP_BACKUP_DIR:-$HOME/STP-backups}"
KEEP_DAYS=14
ATTEMPTS=3
MIN_BYTES=200000        # under detta är dumpen trasig, inte bara liten
MIN_TABLES=10           # en dump utan tabelldata är värdelös oavsett storlek
MAX_GAP_DAYS=2          # längre lucka än så är värd ett mejl i sig
PROJECT_ID="3fca3ff3-e1c6-461d-aac9-b1fde0fd042c"    # Railway: drivermatch
ENV_ID="c576bd2f-c28b-4387-895e-c4954fd85a37"        # production
PG_SERVICE_ID="9ce8d850-2baa-4639-bfc7-f1c31e770903" # Postgres-YJBV
API_SERVICE_ID="77526423-3605-4425-adbb-f3d27fd753c4" # nodejs (för Resend-nycklarna)
CRED_CACHE="$HOME/.stp/notify.env"
ALARM_FILE="$DEST/LARM-backupen-misslyckades.txt"

LOGFILE=""                 # sätts om vi kan hitta launchds logg
[ -w "$DEST" ] 2>/dev/null && LOGFILE="$DEST/backup.log"

log() { printf '%s  %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }

# ── Larm ──────────────────────────────────────────────────────────────────
# Nycklarna hämtas ur Railway och cachas lokalt. Cachen finns för att det
# vanligaste larmläget — Railway svarar inte — annars vore precis det läge
# där vi inte kan mejla.
load_notify_creds() {
  RESEND_KEY=""; MAIL_FROM=""; MAIL_TO=""
  local json
  if json=$(railway_vars "$API_SERVICE_ID" 2>/dev/null) && [ -n "$json" ]; then
    eval "$(printf '%s' "$json" | python3 -c "
import json,sys,shlex
v=json.load(sys.stdin)
for name,key in (('RESEND_KEY','RESEND_API_KEY'),('MAIL_FROM','EMAIL_FROM'),('MAIL_TO','ADMIN_EMAILS')):
    print('%s=%s' % (name, shlex.quote(v.get(key,''))))" 2>/dev/null || true)"
  fi
  if [ -n "$RESEND_KEY" ] && [ -n "$MAIL_TO" ]; then
    mkdir -p "$(dirname "$CRED_CACHE")"
    umask 077
    printf 'RESEND_KEY=%q\nMAIL_FROM=%q\nMAIL_TO=%q\n' "$RESEND_KEY" "$MAIL_FROM" "$MAIL_TO" > "$CRED_CACHE"
  elif [ -r "$CRED_CACHE" ]; then
    # shellcheck disable=SC1090
    . "$CRED_CACHE"
    log "använder cachade mejlnycklar (Railway svarade inte)"
  fi
}

# notify <ämne> <brödtext>. Får aldrig fälla skriptet — den anropas från fail().
notify() {
  local subject="$1" body="$2"
  set +e
  load_notify_creds
  if [ -z "${RESEND_KEY:-}" ] || [ -z "${MAIL_TO:-}" ]; then
    log "kunde inte mejla larmet — inga Resend-nycklar tillgängliga"
    printf '%s\n\n%s\n' "$subject" "$body" > "$ALARM_FILE"
    set -e; return 0
  fi
  local payload
  payload=$(FROM="${MAIL_FROM:-noreply@transportplattformen.se}" TO="$MAIL_TO" \
            SUBJ="$subject" BODY="$body" python3 -c "
import json,os
print(json.dumps({
  'from': 'STP Backup <%s>' % os.environ['FROM'],
  'to': [a.strip() for a in os.environ['TO'].split(',') if a.strip()],
  'subject': os.environ['SUBJ'],
  'text': os.environ['BODY'],
}))")
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 \
    -X POST https://api.resend.com/emails \
    -H "Authorization: Bearer $RESEND_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload")
  if [ "$code" = "200" ]; then
    log "larmmejl skickat till $MAIL_TO"
    rm -f "$ALARM_FILE"
  else
    log "larmmejlet gick inte fram (HTTP $code)"
    printf '%s\n\n%s\n' "$subject" "$body" > "$ALARM_FILE"
  fi
  set -e
}

# Sista raderna ur loggen ger sammanhang i mejlet — pg_dumps egna felrader
# hamnar där, och det är de som säger vad som faktiskt gick sönder.
log_tail() {
  [ -n "$LOGFILE" ] && [ -r "$LOGFILE" ] && tail -n 25 "$LOGFILE" || echo "(ingen logg)"
}

fail() {
  log "FEL: $*"
  notify "STP: databasbackupen misslyckades $(date '+%Y-%m-%d')" \
"Nattens säkerhetskopia av produktionsdatabasen gick inte igenom.

Orsak: $*

Senast lyckade backup: $(latest_good_desc)

Loggens slut:
$(log_tail)

Kör om för hand med:  bash ~/.stp/bin/backup-db.sh"
  exit 1
}

latest_good_desc() {
  local newest
  newest=$(find "$DEST" -name 'stp-*.dump' -type f -size +${MIN_BYTES}c 2>/dev/null \
           | sort | tail -1)
  if [ -n "$newest" ]; then
    printf '%s (%s)' "$(basename "$newest")" "$(du -h "$newest" | cut -f1)"
  else
    printf 'ingen alls'
  fi
}

# ── Städning ──────────────────────────────────────────────────────────────
# En halvskriven dump är farligare än ingen dump: den ser ut som ett skyddsnät.
# pg_dump skapar filen innan den skriver, så varje avbrott lämnar en kvar.
OK=0
FILE=""
cleanup() {
  local rc=$?
  if [ "$OK" -ne 1 ] && [ -n "$FILE" ] && [ -e "$FILE" ]; then
    rm -f "$FILE"
    log "tog bort ofullständig dump $(basename "$FILE")"
  fi
  exit $rc
}
trap cleanup EXIT

railway_vars() {
  curl -s --max-time 30 -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{\"query\":\"query { variables(projectId: \\\"$PROJECT_ID\\\", environmentId: \\\"$ENV_ID\\\", serviceId: \\\"$1\\\") }\"}" \
    https://backboard.railway.com/graphql/v2 \
    | python3 -c "
import json,sys
d=json.load(sys.stdin)
v=(d.get('data') or {}).get('variables')
if not v: sys.exit(1)
json.dump(v, sys.stdout)" 2>/dev/null
}

command -v pg_dump >/dev/null || fail "pg_dump saknas (brew install postgresql@17)"

# Anslutningssträngen hämtas vid körning ur Railway — inget lösenord i repot.
TOKEN=$(python3 -c "
import json,os
c=json.load(open(os.path.expanduser('~/.railway/config.json')))
print(c.get('user',{}).get('token') or c.get('token') or '')") || fail "kunde inte läsa Railway-token"
[ -n "$TOKEN" ] || fail "tom Railway-token — kör 'railway login'"

DB_URL=$(railway_vars "$PG_SERVICE_ID" | python3 -c "
import json,sys
print(json.load(sys.stdin).get('DATABASE_PUBLIC_URL',''))" 2>/dev/null) || fail "kunde inte nå Railways API"
[ -n "$DB_URL" ] || fail "DATABASE_PUBLIC_URL saknas — kolla att Postgres-tjänsten har en publik proxy"

mkdir -p "$DEST"
chmod 700 "$DEST"

# Hur länge har vi stått utan skyddsnät? Ett larmmejl kan bara skickas den natt
# körningen faktiskt sker — var datorn avstängd i en vecka syns det bara här.
PREV_GOOD=$(find "$DEST" -name 'stp-*.dump' -type f -size +${MIN_BYTES}c -mtime -${MAX_GAP_DAYS} 2>/dev/null | head -1)

STAMP=$(date '+%Y-%m-%d-%H%M')
FILE="$DEST/stp-$STAMP.dump"

# Railway-proxyn tappar anslutningen då och då. Ett tappat paket ska inte
# kosta hela natten.
export PGCONNECT_TIMEOUT=15
DUMP_OK=0
for i in $(seq 1 "$ATTEMPTS"); do
  if [ "$i" -gt 1 ]; then
    log "gör om försöket om $((60 * (i - 1))) s (försök $i av $ATTEMPTS)"
    sleep $((60 * (i - 1)))
  fi
  rm -f "$FILE"
  log "dumpar produktionsdatabasen → $(basename "$FILE")"
  if pg_dump --format=custom --no-owner --no-privileges --file="$FILE" "$DB_URL"; then
    DUMP_OK=1
    break
  fi
  log "pg_dump avbröts (försök $i av $ATTEMPTS)"
done
[ "$DUMP_OK" -eq 1 ] || fail "pg_dump misslyckades $ATTEMPTS gånger i rad"
chmod 600 "$FILE"

# En dump som är misstänkt liten är värre än ingen dump, för den ser ut att
# fungera. Basnivån ligger runt 3 MB — under 200 kB är något fel.
SIZE=$(stat -f %z "$FILE")
[ "$SIZE" -gt "$MIN_BYTES" ] || fail "dumpen är bara $SIZE byte — behåller den inte"

# Storleken räcker inte som kvitto: filen måste också gå att läsa tillbaka och
# faktiskt innehålla tabelldata.
TABLES=$(pg_restore --list "$FILE" 2>/dev/null | grep -c "TABLE DATA" || true)
[ "$TABLES" -ge "$MIN_TABLES" ] || fail "dumpen innehåller bara $TABLES tabeller med data — behåller den inte"

OK=1
log "klar: $(du -h "$FILE" | cut -f1), $TABLES tabeller med data"

# Rotation — behåll de senaste KEEP_DAYS dygnen. Tomma filer från gamla
# avbrutna körningar städas bort oavsett ålder.
EMPTIES=$(find "$DEST" -name 'stp-*.dump' -type f -size -${MIN_BYTES}c -print -delete | wc -l | tr -d ' ')
if [ "$EMPTIES" -gt 0 ]; then log "rensade $EMPTIES ofullständiga dumpar"; fi
DELETED=$(find "$DEST" -name 'stp-*.dump' -type f -mtime +$KEEP_DAYS -print -delete | wc -l | tr -d ' ')
if [ "$DELETED" -gt 0 ]; then log "rensade $DELETED backuper äldre än $KEEP_DAYS dagar"; fi

rm -f "$ALARM_FILE"
log "totalt $(find "$DEST" -name 'stp-*.dump' | wc -l | tr -d ' ') backuper, $(du -sh "$DEST" | cut -f1) på disk"

if [ -z "$PREV_GOOD" ]; then
  log "VARNING: ingen giltig backup fanns de senaste $MAX_GAP_DAYS dygnen — databasen har stått utan skyddsnät"
  notify "STP: backupen är igång igen efter en lucka" \
"Nattens backup gick igenom, men det fanns ingen giltig kopia de senaste $MAX_GAP_DAYS dygnen.
Databasen har alltså stått utan skyddsnät fram till nu.

Ny kopia: $(basename "$FILE") ($(du -h "$FILE" | cut -f1), $TABLES tabeller)

Vanligaste orsaken är att datorn varit avstängd 03:15 flera nätter i rad."
fi
