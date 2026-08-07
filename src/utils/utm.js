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

/** Läs utm_*-parametrar ur URL:en och spara första besöket. Anropas vid appstart. */
export function captureUtm() {
  try {
    const p = new URLSearchParams(window.location.search);
    const source = p.get("utm_source");
    if (!source) return;
    if (localStorage.getItem(UTM_STORAGE_KEY)) return; // first touch vinner
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
