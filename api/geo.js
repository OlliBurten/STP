/**
 * Ungefärlig plats för besökaren, från Vercels egna geo-huvuden (ingen extern tjänst,
 * ingen IP lagras här). Används för åkeriernas annonsstatistik: "var besökarna finns".
 * Sverige: län från ISO 3166-2-koden (SE-F = Jönköping).
 */
const SE_REGIONS = {
  AB: "Stockholm", C: "Uppsala", D: "Södermanland", E: "Östergötland", F: "Jönköping", G: "Kronoberg",
  H: "Kalmar", I: "Gotland", K: "Blekinge", M: "Skåne", N: "Halland", O: "Västra Götaland", S: "Värmland",
  T: "Örebro", U: "Västmanland", W: "Dalarna", X: "Gävleborg", Y: "Västernorrland", Z: "Jämtland",
  AC: "Västerbotten", BD: "Norrbotten",
};

export default function handler(req, res) {
  const h = (k) => {
    const v = req.headers[k];
    if (!v) return null;
    try { return decodeURIComponent(String(v)); } catch { return String(v); }
  };
  const country = h("x-vercel-ip-country");
  const regionCode = h("x-vercel-ip-country-region");
  res.setHeader("Cache-Control", "private, no-store");
  res.status(200).json({
    country,
    city: h("x-vercel-ip-city"),
    region: country === "SE" ? SE_REGIONS[regionCode] || null : null,
  });
}
