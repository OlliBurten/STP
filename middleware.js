/**
 * Bot-SSR för startsidan.
 *
 * Rewriten för "/" i vercel.json har aldrig fungerat: Vercel matchar filsystemet
 * FÖRE rewrites, och "/" matchar den byggda index.html — så rewriten nås aldrig
 * och Googles robot fick SPA-skalet (127 tecken text). Alla andra bot-rewrites
 * fungerar eftersom deras sökvägar saknar motsvarande fil.
 *
 * Middleware körs före filsystemet och är därför enda stället som kan fånga "/".
 *
 * Två krav styr utformningen:
 *   1. Människor ska inte betala för det här. Matchern är enbart "/", och för
 *      icke-botar är hela arbetet en regex mot user-agent följt av next().
 *   2. Den ska fela öppet. Går SSR-hämtningen fel — backend nere, timeout, 500 —
 *      faller vi tillbaka på SPA-skalet i stället för att ge en trasig startsida.
 *      En orenderad startsida är ett SEO-problem; en vit startsida är ett haveri.
 */

import { next } from "@vercel/functions";

export const config = {
  runtime: "nodejs",
  matcher: "/",
};

// Samma mönster som bot-rewrites i vercel.json — hålls medvetet identiskt så att
// roten och undersidorna aldrig kan börja klassa samma besökare olika.
const BOT_UA = /([Bb]ot|[Cc]rawler|[Ss]pider|Slurp|facebookexternalhit|Embedly|Quora|Pinterest)/;

const SSR_ORIGIN =
  process.env.SSR_ORIGIN || "https://nodejs-production-f3b9.up.railway.app";

export default async function middleware(request) {
  const ua = request.headers.get("user-agent") || "";
  if (!BOT_UA.test(ua)) return next();

  try {
    const res = await fetch(`${SSR_ORIGIN}/api/ssr/static/home`, {
      headers: { "user-agent": ua },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return next();

    return new Response(await res.text(), {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
        "x-stp-ssr": "home",
      },
    });
  } catch (e) {
    console.error("[middleware-home-ssr]", e?.message || e);
    return next();
  }
}
