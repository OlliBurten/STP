#!/usr/bin/env bash
#
# STP säker deploy — EN väg till prod. Kan inte skeppa gammal eller divergerad kod.
#
# Vad den gör:
#   1. Säkerställer att du står på main med rent träd
#   2. Synkar mot origin/main (GitHub = sanningskälla). Vägrar vid divergens.
#   3. Bygger frontend (avbryter vid byggfel)
#   4. Deployar frontend (Vercel) + backend (Railway)
#   5. Verifierar /api/health + att sajten svarar 200
#
# Bakgrund: 2026-06-15 hade lokal main och origin/main glidit isär tyst eftersom
# automatiska agenter pushade till main medan deploy skedte via CLI från en lokal
# kopia som låg efter. Prod saknade då 27 kraschfixar. Den här gaten fångar det.
#
# Användning:  bash scripts/deploy.sh            (deployar både frontend + backend)
#              bash scripts/deploy.sh frontend   (endast frontend)
#              bash scripts/deploy.sh backend    (endast backend)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TARGET="${1:-all}"
HEALTH_API="https://nodejs-production-f3b9.up.railway.app/api/health"
SITE="https://transportplattformen.se"
VERCEL_PROJECT="drivermatch-20260212"

red()  { printf '\033[31m%s\033[0m\n' "$*"; }
grn()  { printf '\033[32m%s\033[0m\n' "$*"; }
ylw()  { printf '\033[33m%s\033[0m\n' "$*"; }

# ── 1. Branch + rent träd ──────────────────────────────────────────────────────
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$BRANCH" != "main" ]; then
  red "✗ Du står på '$BRANCH', inte main. Byt till main innan deploy."; exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  red "✗ Arbetsträdet har ocommittade ändringar. Committa eller stasha först:"
  git status --short; exit 1
fi

# ── 2. Synka mot origin/main ────────────────────────────────────────────────────
ylw "→ Hämtar origin/main..."
git fetch -q origin main
BEHIND=$(git rev-list --count main..origin/main)   # commits origin har som vi saknar
AHEAD=$(git rev-list --count origin/main..main)     # commits vi har som origin saknar

if [ "$BEHIND" -gt 0 ] && [ "$AHEAD" -gt 0 ]; then
  red "✗ DIVERGENS: lokal main och origin/main har $AHEAD vs $BEHIND egna commits."
  red "  Deployar INTE — du skulle skeppa något som inte är på GitHub eller missa GitHub-fixar."
  red "  Lös först:  git merge origin/main   (lös ev. krockar, bygg, pusha)  och kör sedan igen."
  exit 1
elif [ "$BEHIND" -gt 0 ]; then
  ylw "→ origin/main ligger $BEHIND commit(s) före. Fast-forward-pullar..."
  git merge --ff-only origin/main
  grn "✓ Synkad med GitHub."
elif [ "$AHEAD" -gt 0 ]; then
  ylw "→ Lokal main har $AHEAD commit(s) som GitHub saknar. Pushar så GitHub = det vi deployar..."
  git push origin main
  grn "✓ Pushad till GitHub."
else
  grn "✓ Lokal main = origin/main."
fi

DEPLOY_SHA="$(git rev-parse --short HEAD)"

# ── 3. Bygg frontend (fångar fel innan deploy) ───────────────────────────────────
if [ "$TARGET" = "all" ] || [ "$TARGET" = "frontend" ]; then
  ylw "→ Bygger frontend..."
  npm run build >/dev/null
  grn "✓ Build OK."
fi

# Vilken huvudbundle serverar domänen just nu? Vites filnamn innehåller en hash
# av innehållet, så ett nytt värde = ny kod live.
#
# UA:t spelar roll: middleware.js SSR:ar "/" för botar, och det svaret innehåller
# inga <script src="/assets/…">. Med bot-UA får vi alltså alltid tom sträng.
# Cache-buster mot CDN:en.
site_asset() {
  curl -s --max-time 15 -H 'Cache-Control: no-cache' \
    -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36' \
    "$SITE/?deploycheck=$$_$1" 2>/dev/null \
    | grep -oE '/assets/index-[^"]*\.js' | head -1
}

# Översta produktionsdeployen hos Vercel. Används bara för att skilja
# "identiskt bygge" från "deployen kom aldrig fram" när bundlen är oförändrad.
vercel_top() {
  vercel ls "$VERCEL_PROJECT" --prod 2>/dev/null \
    | grep -oE 'https://[a-z0-9-]+\.vercel\.app' | head -1
}

# ── 4. Deploya ───────────────────────────────────────────────────────────────────
PRE_ASSET=""
PRE_VERCEL=""
if [ "$TARGET" = "all" ] || [ "$TARGET" = "frontend" ]; then
  # `vercel --prod` returnerar när bygget är klart, men domänen kan fortfarande
  # peka på föregående deploy. Ett 200-svar från sajten bevisar därför ingenting
  # om att den NYA koden är live — samma lucka som Railway-sidan hade.
  PRE_ASSET="$(site_asset pre)"
  PRE_VERCEL="$(vercel_top)"
  if [ -n "$PRE_ASSET" ]; then
    ylw "→ Sajten serverar nu ${PRE_ASSET#/assets/}. Väntar på att den byts ut."
  else
    ylw "→ Kunde inte läsa nuvarande bundle — verifierar bara att sajten svarar 200."
  fi

  ylw "→ Deployar frontend (Vercel)..."
  vercel --cwd "$ROOT" --prod
  grn "✓ Frontend deployad."
fi

# uptimeSec ur /api/health. Tom sträng om API:t inte svarar eller fältet saknas.
health_uptime() {
  curl -s --max-time 10 "$HEALTH_API" 2>/dev/null | sed -n 's/.*"uptimeSec":\([0-9]*\).*/\1/p' | head -1
}

PRE_UPTIME=""
if [ "$TARGET" = "all" ] || [ "$TARGET" = "backend" ]; then
  # Railway bygger asynkront: `railway up` returnerar när koden är uppladdad,
  # inte när den kör. Health svarar hela tiden ok — från den GAMLA instansen.
  # Utan det här måttet rapporterade skriptet "DEPLOY KLAR" mot en container som
  # startats 22 dygn tidigare (2026-08-30). Vi noterar därför uptime före
  # uppladdningen och väntar sedan tills den räknats om från noll.
  PRE_UPTIME="$(health_uptime)"
  if [ -n "$PRE_UPTIME" ]; then
    ylw "→ Nuvarande backend-instans: uptime ${PRE_UPTIME}s. Väntar på att den byts ut."
  else
    ylw "→ Kunde inte läsa uptime före deploy — verifierar bara att health blir ok."
  fi

  ylw "→ Deployar backend (Railway)..."
  ( cd "$ROOT/server" && railway up --service nodejs )
  grn "✓ Backend uppladdad (Railway bygger klart på sin sida)."
fi

# ── 5. Verifiera ──────────────────────────────────────────────────────────────────
ylw "→ Verifierar health (väntar in ev. omstart)..."
# Railway-bygget tar oftast 2–5 minuter. 90 × 8 s ≈ 12 minuter innan vi ger upp;
# tidigare 30 × 8 s räckte inte ens till ett normalt bygge.
TRIES=30
[ -n "$PRE_UPTIME" ] && TRIES=90
[ -n "$PRE_ASSET" ] && TRIES=90

OK=0
NEW_UPTIME=""
NEW_ASSET=""
for i in $(seq 1 $TRIES); do
  H="$(curl -s --max-time 10 "$HEALTH_API" || true)"
  CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$SITE" || echo 000)"
  if echo "$H" | grep -q '"ok":true' && echo "$H" | grep -q '"db":"ok"' && [ "$CODE" = "200" ]; then

    # Frontend: kräv att domänen faktiskt serverar en annan bundle än före
    # deployen. Vites filnamnshash ändras när innehållet ändras.
    if [ -n "$PRE_ASSET" ] && [ -z "$NEW_ASSET" ]; then
      A="$(site_asset "$i")"
      if [ -n "$A" ] && [ "$A" != "$PRE_ASSET" ]; then
        NEW_ASSET="$A"
      else
        [ $((i % 5)) -eq 0 ] && ylw "   …domänen serverar fortfarande ${PRE_ASSET#/assets/}, väntar."
        sleep 8; continue
      fi
    fi

    if [ -z "$PRE_UPTIME" ]; then
      OK=1; break
    fi
    # Backend: kräv att processen faktiskt startats om. Lägre uptime än före
    # uppladdningen är det enda som skiljer den nya instansen från den gamla —
    # health säger "ok" i båda fallen.
    U="$(printf '%s' "$H" | sed -n 's/.*"uptimeSec":\([0-9]*\).*/\1/p' | head -1)"
    if [ -n "$U" ] && [ "$U" -lt "$PRE_UPTIME" ]; then
      NEW_UPTIME="$U"; OK=1; break
    fi
    [ $((i % 5)) -eq 0 ] && ylw "   …gamla instansen svarar fortfarande (uptime ${U:-?}s), väntar."
  fi
  sleep 8
done

echo
# Oförändrad bundle betyder inte nödvändigtvis misslyckad deploy: byggde vi exakt
# samma kod som redan låg ute blir hashen densamma, och då finns inget att vänta
# på. Vercel skapar däremot alltid en ny deploy. Skiljer vi inte på de här två
# fallen får ett ofarligt "identiskt bygge" samma larm som en deploy som aldrig
# nådde fram — och då slutar man lita på larmet.
if [ "$OK" != "1" ] && [ -n "$PRE_ASSET" ] && [ -z "$NEW_ASSET" ]; then
  POST_VERCEL="$(vercel_top)"
  if [ -n "$POST_VERCEL" ] && [ -n "$PRE_VERCEL" ] && [ "$POST_VERCEL" != "$PRE_VERCEL" ]; then
    ylw "→ Bundlen är oförändrad, men Vercel har en ny produktionsdeploy:"
    ylw "  $POST_VERCEL"
    ylw "  Bygget gav alltså byte-identisk utdata — inget nytt att servera."
    NEW_ASSET="$PRE_ASSET"
    [ -z "$PRE_UPTIME" ] && OK=1
    [ -n "$PRE_UPTIME" ] && [ -n "$NEW_UPTIME" ] && OK=1
  fi
fi

if [ "$OK" = "1" ]; then
  MSG="✅ DEPLOY KLAR ($DEPLOY_SHA)."
  [ -n "$NEW_ASSET" ] && MSG="$MSG Sajten serverar ${NEW_ASSET#/assets/}."
  [ -n "$NEW_UPTIME" ] && MSG="$MSG Ny backend-instans uppe (uptime ${NEW_UPTIME}s)."
  grn "$MSG Databas ok."
else
  if [ -n "$PRE_ASSET" ] && [ -z "$NEW_ASSET" ]; then
    red "⚠️  Deploy gjord ($DEPLOY_SHA) men domänen serverar fortfarande ${PRE_ASSET#/assets/}."
    red "    Ingen ny produktionsdeploy hos Vercel heller — frontend-koden är INTE live."
  elif [ -n "$PRE_UPTIME" ]; then
    red "⚠️  Deploy gjord ($DEPLOY_SHA) men den NYA backend-instansen kom aldrig upp inom tidsgränsen."
    red "    Gamla instansen svarar fortfarande — koden du just skickade är alltså INTE live."
  else
    red "⚠️  Deploy gjord ($DEPLOY_SHA) men health verifierades INTE inom tidsgränsen."
  fi
  red "    Kolla Railway/Vercel-loggar och $HEALTH_API manuellt."
  exit 1
fi
