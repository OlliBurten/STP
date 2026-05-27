#!/usr/bin/env python3
"""
Transportplattformen — daglig outreach-agent för åkerier.
Kör varje vardag via GitHub Actions.
"""
import json
import os
import subprocess
import sys
import time
from datetime import date

TODAY = str(date.today())
API_KEY = os.environ["RESEND_API_KEY"]
FROM_ADDR = "Oliver på Transportplattformen <noreply@transportplattformen.se>"
SIGNUP_URL = "https://transportplattformen.se/registrera?typ=foretag"
SUBJECT = "Hitta kvalificerade lastbilsförare – gratis för åkerier"
MAX_PER_DAY = 15

# ── Kandidatpool – utökas löpande ────────────────────────────────────────────
# Format: {"name": "Visningsnamn", "email": "kontakt@foretag.se"}
CANDIDATE_POOL = [
    {"name": "Aldos Åkeri AB",                "email": "bokning@aldosakeri.se"},
    {"name": "Haninge Åkeri",                 "email": "info@haninge-akeri.se"},
    {"name": "Frakttjänst i Umeå AB",         "email": "info@frakttjanst.se"},
    {"name": "Åkare i Sverige Åkersberga AB", "email": "info@akareisverige.se"},
    {"name": "Börje Jönsson Åkeri AB",        "email": "forfragan@bjtrucks.com"},
    {"name": "Abbekås Transport",             "email": "marknad@abbekastransport.se"},
    {"name": "T. Mohlins Åkeri AB",           "email": "info@mohlinsakeri.com"},
    {"name": "Tornfrakt AB",                  "email": "tornfrakt@tornfrakt.se"},
    {"name": "Skoogs Åkeri & Logistik AB",    "email": "info@skoogsakeri.se"},
    {"name": "Ahréns Åkeri AB",               "email": "traffic@ahrensakeri.se"},
    {"name": "Almroths Express & Åkeri AB",   "email": "info@almroths.se"},
    {"name": "Stockholms Åkeri AB",           "email": "info@stockholmsakeri.se"},
    {"name": "Sune Jansson Åkeri AB",         "email": "info@janssonakeri.se"},
    {"name": "Rosenlunds Åkeri AB",           "email": "info@rosenlundsakeri.se"},
    {"name": "Bengts Åkeri AB",               "email": "tony.johansson@bengtsakeri.se"},
    {"name": "G:sons Åkeri AB",               "email": "info@gsonsakeri.se"},
    {"name": "Alltransport AB",               "email": "info@alltransport.se"},
    {"name": "Wiklunds Åkeri AB",             "email": "info@wiklunds.se"},
    {"name": "Carrier Transport AB",          "email": "info@carrier.se"},
    {"name": "Åkeri Stockholm AB",            "email": "info@akeristockholm.se"},
]

# ── HTML e-postmall ──────────────────────────────────────────────────────────
HTML_TEMPLATE = """\
<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px}}
  .wrap{{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;
         overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)}}
  .hd{{background:#1e3a5f;padding:28px 32px}}
  .hd h1{{color:#fff;margin:0;font-size:22px;letter-spacing:.4px}}
  .hd p{{color:#a8c4e0;margin:4px 0 0;font-size:14px}}
  .bd{{padding:32px;color:#333;line-height:1.75}}
  .bd h2{{color:#1e3a5f;font-size:18px;margin-top:0}}
  .box{{background:#f0f6ff;border-radius:6px;padding:20px 24px;margin:24px 0}}
  .box ul{{margin:0;padding-left:20px}}
  .box li{{margin-bottom:8px}}
  .cta{{text-align:center;margin:32px 0}}
  .cta a{{background:#e85d04;color:#fff;text-decoration:none;
           padding:14px 32px;border-radius:6px;font-size:16px;
           font-weight:bold;display:inline-block}}
  .sig{{margin-top:32px;border-top:1px solid #e0e0e0;
        padding-top:20px;font-size:14px;color:#555}}
  .ft{{background:#f5f5f5;padding:16px 32px;font-size:12px;
       color:#999;text-align:center;border-top:1px solid #e0e0e0}}
</style>
</head>
<body>
<div class="wrap">
  <div class="hd">
    <h1>Transportplattformen</h1>
    <p>Sveriges direkta länk mellan åkerier och yrkesförare</p>
  </div>
  <div class="bd">
    <h2>Hej {company_name},</h2>
    <p>
      Jag heter <strong>Oliver Harburt</strong> och är grundare av
      <strong>Transportplattformen</strong> &mdash; en ny svensk jobbplattform
      som kopplar ihop åkerier direkt med kvalificerade lastbilsförare, helt
      utan mellanhänder eller rekryteringsbyråer som tar provision.
    </p>
    <div class="box">
      <strong>Med Transportplattformen kan ni:</strong>
      <ul>
        <li>Hitta förare med <strong>CE/C-körkort</strong> och giltiga intyg
            (YKB, ADR)</li>
        <li>Filtrera på <strong>region och tillgänglighet</strong></li>
        <li>Kontakta förare <strong>direkt</strong> &mdash; ingen provision,
            inga mellanhänder</li>
        <li>Publicera jobbannonser och ta emot ansökningar</li>
      </ul>
    </div>
    <p>
      Plattformen är <strong>helt gratis</strong> att registrera sig och börja
      använda för åkerier. Vi vill göra det enklare för svenska
      transportföretag att hitta rätt förare snabbt.
    </p>
    <div class="cta">
      <a href="{signup_url}">Registrera ert åkeri gratis &rarr;</a>
    </div>
    <p>Tveka inte att höra av er om ni har frågor!</p>
    <div class="sig">
      <strong>Oliver Harburt</strong><br>
      Grundare, Transportplattformen<br>
      <a href="https://transportplattformen.se"
         style="color:#1e3a5f">transportplattformen.se</a>
    </div>
  </div>
  <div class="ft">
    Du får detta mejl eftersom vi tror att Transportplattformen kan vara
    relevant för ert företag.<br>
    Om du inte vill ta emot fler utskick, svara med
    <em>"Avregistrera"</em> i ämnesraden.
  </div>
</div>
</body>
</html>"""


def send_email(company_name: str, to_email: str) -> bool:
    html = HTML_TEMPLATE.format(company_name=company_name, signup_url=SIGNUP_URL)
    payload = json.dumps({
        "from": FROM_ADDR,
        "to": [to_email],
        "subject": SUBJECT,
        "html": html,
    })
    cmd = [
        "curl", "-s", "-X", "POST", "https://api.resend.com/emails",
        "-H", f"Authorization: Bearer {API_KEY}",
        "-H", "Content-Type: application/json",
        "-d", payload,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    resp = result.stdout.strip()
    ok = '"id"' in resp
    status = "✓" if ok else "✗"
    print(f"{status} {company_name} <{to_email}> → {resp[:120]}")
    return ok


def main():
    contacted_path = "outreach/contacted.json"
    os.makedirs("outreach", exist_ok=True)

    if os.path.exists(contacted_path):
        with open(contacted_path) as f:
            already_contacted = json.load(f)
    else:
        already_contacted = []

    already_emails = {e.get("email", "").lower() for e in already_contacted}

    # Filter candidates not yet contacted
    new_candidates = [
        c for c in CANDIDATE_POOL
        if c["email"].lower() not in already_emails
    ]

    if not new_candidates:
        print("Inga nya kandidater att kontakta idag. Avslutar.")
        sys.exit(0)

    to_send = new_candidates[:MAX_PER_DAY]
    print(f"Skickar till {len(to_send)} åkerier ({len(already_emails)} redan kontaktade)")

    sent = []
    for co in to_send:
        if send_email(co["name"], co["email"]):
            sent.append({
                "email": co["email"].lower(),
                "company": co["name"],
                "date": TODAY,
            })
        time.sleep(0.5)

    # Persist updated tracking
    updated = already_contacted + sent
    with open(contacted_path, "w") as f:
        json.dump(updated, f, ensure_ascii=False, indent=2)

    print(f"\n=== Klar: {len(sent)}/{len(to_send)} skickade ===")
    for s in sent:
        print(f"  + {s['company']} → {s['email']}")


if __name__ == "__main__":
    main()
