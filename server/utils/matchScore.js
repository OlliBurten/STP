/**
 * Serverns matchning — tunt omslag runt matchCore.js (identisk med src/utils/matchCore.js,
 * se test/matchCore.test.js). Servern kräver rätt anställningsform (strictSegment):
 * aviseringar och tips ska inte gå ut om vikariat till den som bara söker heltid.
 */
import { scoreMatch, driverActivityFactor } from "./matchCore.js";

export { driverActivityFactor };

/** Råpoäng (0 = ingen match). */
export function matchScore(driver, job) {
  return scoreMatch(driver, job, { strictSegment: true }).score;
}

/** Samma som procent (0–100). */
export function matchPercent(driver, job) {
  return scoreMatch(driver, job, { strictSegment: true }).pct;
}

export function driverYearsFromExperience(experience) {
  const list = Array.isArray(experience) ? experience : [];
  if (list.length === 0) return 0;
  const now = new Date().getFullYear();
  let total = 0;
  for (const e of list) {
    const start = e.startYear || now;
    const end = e.current ? now : e.endYear || now;
    total += Math.max(0, end - start);
  }
  return total;
}
