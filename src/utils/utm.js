/**
 * Märk utgående arbetsgivar-/ATS-länkar med UTM så att arbetsgivare ser
 * "stp" i sin statistik (Analytics/ATS) — varje klick är marknadsföring.
 * mailto:-länkar och ogiltiga URL:er lämnas orörda; befintlig query bevaras.
 */
export function withUtm(url, medium = "jobb") {
  if (!url || !/^https?:\/\//i.test(url)) return url;
  try {
    const u = new URL(url);
    if (!u.searchParams.has("utm_source")) {
      u.searchParams.set("utm_source", "stp");
      u.searchParams.set("utm_medium", medium);
      u.searchParams.set("utm_campaign", "jobbannons");
    }
    return u.toString();
  } catch {
    return url;
  }
}

// ─── Inkommande attribution (first touch) ─────────────────────────────────────
//
// Kanalen som faktiskt ger förare är manuella inlägg i Facebook-grupper. Utan
// det här går det inte att se vilken grupp, vilket inlägg eller vilken vinkel
// som fungerade — och en manuell kanal man inte kan mäta går inte att förbättra.
//
// First touch, inte last touch: den länk som förde hit personen är det som ska
// få äran, även om de återkommer via en Google-sökning innan de registrerar sig.

const UTM_STORAGE_KEY = "stp_signup_utm";

/**
 * Källa utan UTM: länkar som delas i Facebook-grupper saknar oftast utm_*, så 13/10
 * blev alla 7 nya förare "okänd" trots att trafiken kom från Facebook. Facebook lägger
 * på fbclid; annars används hänvisande domän (referrer).
 */
function sourceWithoutUtm(p) {
  if (p.get("fbclid")) return { signupSource: "facebook", signupMedium: "social" };
  if (p.get("gclid")) return { signupSource: "google", signupMedium: "cpc" };
  let host = "";
  try { host = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : ""; } catch { host = ""; }
  if (!host || host.endsWith("transportplattformen.se")) return null;
  if (/(^|\.)facebook\.com$|(^|\.)fb\.com$/.test(host)) return { signupSource: "facebook", signupMedium: "social" };
  if (/(^|\.)instagram\.com$/.test(host)) return { signupSource: "instagram", signupMedium: "social" };
  if (/(^|\.)google\./.test(host)) return { signupSource: "google", signupMedium: "organic" };
  if (/(^|\.)bing\.com$/.test(host)) return { signupSource: "bing", signupMedium: "organic" };
  if (/chatgpt\.com$|openai\.com$/.test(host)) return { signupSource: "chatgpt", signupMedium: "referral" };
  return { signupSource: host.slice(0, 100), signupMedium: "referral" };
}

/** Läs utm_*-parametrar (eller hänvisande källa) och spara första besöket. Anropas vid appstart. */
export function captureUtm() {
  try {
    const p = new URLSearchParams(window.location.search);
    if (localStorage.getItem(UTM_STORAGE_KEY)) return; // first touch vinner
    const source = p.get("utm_source");
    if (!source) {
      const fallback = sourceWithoutUtm(p);
      if (fallback) localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fallback));
      return;
    }
    localStorage.setItem(
      UTM_STORAGE_KEY,
      JSON.stringify({
        signupSource: source.slice(0, 100),
        signupMedium: (p.get("utm_medium") || "").slice(0, 100) || undefined,
        signupCampaign: (p.get("utm_campaign") || "").slice(0, 150) || undefined,
      })
    );
  } catch {
    /* privat läge / blockerad storage — attribution är inte värt ett krasch */
  }
}

/** Attributionen att skicka med vid registrering. Tomt objekt om inget finns. */
export function getSignupUtm() {
  try {
    const raw = localStorage.getItem(UTM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
