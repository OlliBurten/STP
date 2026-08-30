// Maps a real API Job object onto the field shape the ported prototype
// screens/sheets expect (job.initials, job.match, job.pay, job.type, …).
import { matchScore } from "../../utils/matchUtils";
import { salaryLabel } from "../../utils/jobUtils";
import { getCertificateLabel } from "../../data/profileData";

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

// Delegerar till den delade lönelogiken — mobilen sa tidigare "Ej specificerat"
// där desktop sa "Lön ej angiven" för exakt samma jobb.
export function payLabel(job) {
  return salaryLabel(job);
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
    // true = STP kan vidarebefordra ansökan (kontaktmejl finns). false = bara
    // AF-länken funkar. null för STP-egna jobb (alltid på plattformen).
    reachableViaStp: job.reachableViaStp ?? null,
    deadline: job.applicationDeadline || null,
    // AF-paritet: mejl-ansökan + referens/kontakt/adress/lönetyp (spreaden ovan
    // tar med applyEmail m.fl. — merit normaliseras här)
    merit: job.qualifications?.niceToHave || [],
    verified: Boolean(job.companyVerified),
    desc: job.description || "",
    reqs: Array.isArray(job.requirements) ? job.requirements : [],
    // Behörigheterna ligger i egna fält (license/certificates) och ingår därför
    // inte i requirements — berikarens prompt säger uttryckligen "krav utöver
    // körkort". Utan den här listan visade kravsektionen bara de mjuka kraven,
    // så YKB, ADR och digitalt förarkort syntes aldrig i mobilens jobbvyer.
    credentials: [
      ...licenses.map((l) => `${l}-behörighet`),
      ...(Array.isArray(job.certificates) ? job.certificates : []).map(getCertificateLabel),
    ],
    match,
  };
}
