/**
 * Calculate years of experience from experience array
 */
export function calcYearsExperience(experience) {
  if (!experience?.length) return 0;
  const now = new Date().getFullYear();
  let total = 0;
  for (const exp of experience) {
    const start = exp.startYear || now;
    const end = exp.current ? now : exp.endYear || now;
    total += Math.max(0, end - start);
  }
  return total;
}
