/**
 * Batched match-alerts för nyimporterade jobb.
 *
 * När jobIngestor hämtar in nya AGGREGATED-jobb (var 2:e timme) vill vi väcka
 * förare vars profil matchar — men EN notis per förare som summerar alla nya
 * matchningar i körningen, inte en notis per jobb (det vore spam).
 *
 * createNotification skapar in-app-notis + skickar web-push. E-post skickas med
 * 24h cooldown per förare (samma som per-jobb-flödet i routes/jobs.js).
 */
import { prisma } from "./prisma.js";
import { matchScore, driverYearsFromExperience } from "../utils/matchScore.js";
import { createNotification } from "./notifications.js";
import { notifyRecommendedJobMatch } from "./email.js";

const ENABLED = process.env.MATCH_ALERTS_ENABLED !== "false";
const EMAIL_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const MAX_RECIPIENTS = 200;       // tak per körning (skydd mot massutskick)
const MAX_PROFILES = 1000;        // hur många profiler vi poängsätter
const MAX_JOBS_IN_MSG = 5;        // hur många jobb vi listar i notis/mejl

function parseExpSafe(v) { try { return JSON.parse(v || "[]"); } catch { return []; } }

/**
 * @param {string[]} jobIds  — id:n för nyskapade jobb i denna ingestions-körning.
 * @returns {{notified:number, emailed:number}}
 */
export async function notifyDriversOfNewJobs(jobIds) {
  if (!ENABLED || !Array.isArray(jobIds) || jobIds.length === 0) return { notified: 0, emailed: 0 };

  const jobs = await prisma.job.findMany({
    where: { id: { in: jobIds }, status: "ACTIVE" },
    select: {
      id: true, title: true, company: true, region: true,
      license: true, certificates: true, segment: true, employment: true,
      jobType: true, bransch: true, description: true, requirements: true,
      experience: true, schedule: true, extraRequirements: true,
    },
  });
  if (jobs.length === 0) return { notified: 0, emailed: 0 };

  // Förfiltrera förare på körkort (hård diskvalificerare i matchScore) i DB.
  const allLicenses = [...new Set(jobs.flatMap((j) => j.license || []))];
  const profiles = await prisma.driverProfile.findMany({
    where: {
      visibleToCompanies: true,
      ...(allLicenses.length > 0 && { licenses: { hasSome: allLicenses } }),
    },
    take: MAX_PROFILES,
    include: { user: { select: { id: true, name: true, email: true, lastMatchJobEmailAt: true } } },
  });

  const now = new Date();
  let notified = 0;
  const emailQueue = [];

  for (const p of profiles) {
    if (notified >= MAX_RECIPIENTS) break;
    if (!p.user?.id || !p.user?.email) continue;

    const exp = Array.isArray(p.experience)
      ? p.experience
      : typeof p.experience === "string" ? parseExpSafe(p.experience) : [];
    const driver = {
      licenses: p.licenses || [],
      certificates: p.certificates || [],
      region: p.region || "",
      regionsWilling: p.regionsWilling || [],
      availability: p.availability || "open",
      primarySegment: p.primarySegment || null,
      secondarySegments: p.secondarySegments || [],
      privateMatchNotes: p.privateMatchNotes || "",
      yearsExperience: driverYearsFromExperience(exp),
    };

    const matched = jobs.filter((j) => matchScore(driver, j) > 0);
    if (matched.length === 0) continue;

    const top = matched.slice(0, MAX_JOBS_IN_MSG);
    const count = matched.length;
    const single = count === 1;
    const title = single ? "Nytt jobb som matchar dig" : `${count} nya jobb som matchar dig`;
    const body = single
      ? `${top[0].company}: ${top[0].title}${top[0].region ? ` (${top[0].region})` : ""}`
      : top.slice(0, 3).map((j) => j.title).join(", ") + (count > 3 ? " m.fl." : "");

    await createNotification({
      userId: p.user.id,
      type: "MATCH_JOBS",
      title,
      body,
      link: single ? `/jobb/${top[0].id}` : "/jobb",
      relatedJobId: single ? top[0].id : null,
    }).catch((e) => console.error("[MatchAlerts] notis-fel:", e?.message || e));
    notified++;

    const last = p.user.lastMatchJobEmailAt;
    if (!last || now.getTime() - new Date(last).getTime() > EMAIL_COOLDOWN_MS) {
      emailQueue.push({
        userId: p.user.id,
        email: p.user.email,
        name: p.user.name,
        jobs: top.map((j) => ({ title: j.title, company: j.company, region: j.region })),
      });
    }
  }

  await Promise.allSettled(
    emailQueue.map((r) =>
      notifyRecommendedJobMatch({ driverEmail: r.email, driverName: r.name, jobs: r.jobs })
    )
  );
  if (emailQueue.length > 0) {
    await prisma.user.updateMany({
      where: { id: { in: emailQueue.map((r) => r.userId) } },
      data: { lastMatchJobEmailAt: now },
    });
  }

  console.log(`[MatchAlerts] ${jobs.length} nya jobb → ${notified} förare notifierade, ${emailQueue.length} mejlade`);
  return { notified, emailed: emailQueue.length };
}
