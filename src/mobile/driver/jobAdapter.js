// Maps a real API Job object onto the field shape the ported prototype
// screens/sheets expect (job.initials, job.match, job.pay, job.type, …).
import { matchScore } from "../../utils/matchUtils";

const EMPLOYMENT_LABEL = {
  fast: "Heltid",
  vikariat: "Vikariat",
  tim: "Timanställning",
  praktik: "Praktik",
};

export function initialsFor(name = "") {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just nu";
  if (min < 60) return `${min} min sedan`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} tim sedan`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Igår";
  if (d < 7) return `${d} dagar sedan`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w} ${w === 1 ? "vecka" : "veckor"} sedan`;
  const mo = Math.floor(d / 30);
  return `${mo} mån sedan`;
}

export function payLabel(job) {
  if (job.salary && String(job.salary).trim()) return job.salary;
  if (job.kollektivavtal) return "Enligt kollektivavtal";
  const min = job.salaryMin;
  const max = job.salaryMax;
  const fmt = (n) => Number(n).toLocaleString("sv-SE");
  if (min && max) return `${fmt(min)}–${fmt(max)} kr/mån`;
  if (min) return `Från ${fmt(min)} kr/mån`;
  return "Ej specificerat";
}

export function employmentLabel(job) {
  return EMPLOYMENT_LABEL[job.employment] || (job.segment === "FLEX" ? "Vikariat" : "Heltid");
}

// Augment a real Job with the prototype view fields. `profile` is optional;
// when present, computes the match %.
export function toJobView(job, profile) {
  const licenses = Array.isArray(job.license)
    ? job.license
    : Array.isArray(job.licenses)
    ? job.licenses
    : [];
  const match = profile ? matchScore(profile, job).pct : null;
  return {
    ...job,
    initials: initialsFor(job.company),
    licenses,
    type: employmentLabel(job),
    pay: payLabel(job),
    posted: timeAgo(job.published || job.createdAt),
    imported: job.source === "AGGREGATED",
    deadline: job.applicationDeadline || null,
    verified: Boolean(job.companyVerified),
    desc: job.description || "",
    reqs: Array.isArray(job.requirements) ? job.requirements : [],
    match,
  };
}
