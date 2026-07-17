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
