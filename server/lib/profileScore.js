/**
 * Profilstyrka-score för förare (0–100).
 * Exponeras i GET /api/profile och GET /api/drivers/:id.
 */

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * @param {object} profile  — DriverProfile row
 * @param {object} user     — User row (name, lastLoginAt)
 * @returns {{ score: number, breakdown: object[], tips: string[] }}
 */
export function computeProfileScore(profile, user) {
  const experience = Array.isArray(profile.experience)
    ? profile.experience
    : typeof profile.experience === "string"
      ? (() => { try { return JSON.parse(profile.experience || "[]"); } catch { return []; } })()
      : [];

  const recentlyActive =
    user?.lastLoginAt &&
    Date.now() - new Date(user.lastLoginAt).getTime() < THIRTY_DAYS_MS;

  const breakdown = [
    {
      key: "summary",
      label: "Sammanfattning",
      points: 20,
      earned: Boolean(profile.summary && profile.summary.trim().length >= 20),
      tip: "Lägg till en kort sammanfattning om dig själv (minst 20 tecken) — det är det första åkerier läser.",
    },
    {
      key: "licenses",
      label: "Körkort",
      points: 20,
      earned: Array.isArray(profile.licenses) && profile.licenses.length > 0,
      tip: "Ange dina körkort (CE, C m.fl.) — körkort är det viktigaste filtret när åkerier söker.",
    },
    {
      key: "certificates",
      label: "Certifikat",
      points: 15,
      earned: Array.isArray(profile.certificates) && profile.certificates.length > 0,
      tip: "Lägg till dina certifikat som YKB, ADR eller truckkort.",
    },
    {
      key: "region",
      label: "Region",
      points: 10,
      earned: Boolean(profile.region),
      tip: "Ange din region så dyker du upp i sökningar för rätt geografiskt område.",
    },
    {
      key: "availability",
      label: "Tillgänglighet",
      points: 10,
      earned: Boolean(profile.availability),
      tip: "Sätt din tillgänglighetsstatus så vet åkerier om du aktivt söker jobb.",
    },
    {
      key: "phone",
      label: "Telefonnummer",
      points: 10,
      earned: Boolean(profile.phone && profile.phone.trim()),
      tip: "Lägg till ett telefonnummer — många åkerier föredrar att ringa direkt.",
    },
    {
      key: "experience",
      label: "Arbetslivserfarenhet",
      points: 10,
      earned: experience.length > 0,
      tip: "Lägg till minst en tidigare arbetsplats under erfarenhet.",
    },
    {
      key: "recentlyActive",
      label: "Aktiv senaste månaden",
      points: 5,
      earned: Boolean(recentlyActive),
      tip: "Logga in regelbundet för att visa att din profil är aktuell.",
    },
  ];

  const score = breakdown.reduce((sum, b) => sum + (b.earned ? b.points : 0), 0);
  const tips = breakdown.filter((b) => !b.earned).map((b) => b.tip);

  return { score, breakdown, tips };
}

/** Kort etikett baserat på poäng */
export function profileScoreLabel(score) {
  if (score >= 90) return "Utmärkt profil";
  if (score >= 70) return "Stark profil";
  if (score >= 50) return "Bra profil";
  if (score >= 30) return "Under uppbyggnad";
  return "Grundläggande profil";
}
