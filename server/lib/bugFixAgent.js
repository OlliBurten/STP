/**
 * Bug Fix Agent — autonom fel-ANALYS för STP (FÖRSLAGSLÄGE).
 *
 * Flöde:
 *   1. Ta emot Sentry-error med stack trace
 *   2. Identifiera vilken fil som orsakade felet
 *   3. Hämta filen från GitHub
 *   4. Claude analyserar + skriver ett fix-FÖRSLAG
 *   5. Mejla förslaget till Oliver för manuell granskning
 *
 * VIKTIGT — servern skriver ALDRIG kod till repot:
 *   Tidigare committade den fixar direkt till main via GitHub API och trodde
 *   att det auto-deployade (det gör det inte — alla deployer är manuella CLI).
 *   Det maskerade dessutom Sentry-fel (markerade som resolved fast inget
 *   deployats) och orsakade tyst divergens mot lokal main. Nu föreslår den bara.
 *   Faktiska fixar görs av daglig-sentry-triage (branch + PR) och deployas av
 *   en människa via scripts/deploy.sh.
 *
 * Säkerhetsregler:
 *   - Rör aldrig: schema.prisma, auth.js, server.js, middleware/
 *   - Max 1 fil per analys
 *   - Om samma fil analyserades för < 30 min sedan — skippa (undvika loopar)
 */

import Anthropic from "@anthropic-ai/sdk";
import { sendEmail } from "./email.js";

const BLOCKED_PATHS = [
  "prisma/schema",
  "middleware/auth",
  "server.js",
  "lib/config",
  "lib/prisma",
];

// Håll koll på nyligen fixade filer för att undvika loopar
const recentlyFixed = new Map(); // filePath → timestamp

function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY saknas");
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function getAdminEmails() {
  return String(process.env.ADMIN_EMAILS || "")
    .split(",").map((e) => e.trim()).filter(Boolean);
}

function getGitHub() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) throw new Error("GITHUB_TOKEN eller GITHUB_REPO saknas");
  return { token, repo };
}

function getSentry() {
  const token = process.env.SENTRY_API_TOKEN || process.env.SENTRY_AUTH_TOKEN;
  const org = process.env.SENTRY_ORG || "stp-jb";
  return { token, org };
}

// ─── GitHub API helpers ───────────────────────────────────────────────────────

async function githubGet(path) {
  const { token, repo } = getGitHub();
  const resp = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!resp.ok) return null;
  return resp.json();
}

// OBS: githubCommit (direkt skrivning till main) och sentryResolveIssue är
// medvetet borttagna. Servern föreslår fixar via mejl men skriver aldrig kod
// och markerar aldrig Sentry-issues som resolved (det maskerade verkliga fel).

// ─── Sentry API helpers ───────────────────────────────────────────────────────

export async function sentryFetchUnresolvedIssues(limit = 50) {
  const { token, org } = getSentry();
  if (!token) return [];
  const resp = await fetch(
    `https://sentry.io/api/0/organizations/${org}/issues/?limit=${limit}&query=is:unresolved&sort=date`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!resp.ok) return [];
  return resp.json();
}

async function sentryGetIssueEvents(issueId) {
  const { token, org } = getSentry();
  if (!token) return null;
  const resp = await fetch(
    `https://sentry.io/api/0/organizations/${org}/issues/${issueId}/events/latest/`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!resp.ok) return null;
  return resp.json();
}

// ─── Extrahera relevant fil från stack trace ──────────────────────────────────

function extractTargetFile(stacktrace) {
  if (!stacktrace?.frames) return null;
  // Leta efter sista frame som är vår egen kod (inte node_modules)
  const frames = stacktrace.frames.filter(
    (f) => f.filename && !f.filename.includes("node_modules") && f.in_app !== false
  );
  if (!frames.length) return null;
  const frame = frames[frames.length - 1];

  // Backend: server/routes/..., server/lib/..., server/scripts/...
  const backendMatch = frame.filename.match(/(server\/(?:routes|lib|scripts)\/.+\.js)/);
  if (backendMatch) return { path: backendMatch[1], line: frame.lineno, fn: frame.function };

  // Frontend: src/pages/..., src/components/..., src/utils/..., src/hooks/...
  const frontendMatch = frame.filename.match(/(src\/(?:pages|components|utils|hooks|context|api)\/.+\.[jt]sx?)/);
  if (frontendMatch) return { path: frontendMatch[1], line: frame.lineno, fn: frame.function };

  return null;
}

// ─── Huvud-funktion ───────────────────────────────────────────────────────────

export async function attemptBugFix(sentryPayload) {
  const event = sentryPayload?.data?.event || sentryPayload?.event || {};
  const issue = sentryPayload?.data?.issue || sentryPayload?.issue || {};
  const issueId = issue.id || sentryPayload?.issue_id || null;
  const errorTitle = event.title || issue.title || "Okänt fel";
  const errorType = event.exception?.values?.[0]?.type || "";
  const errorValue = event.exception?.values?.[0]?.value || "";
  const stacktrace = event.exception?.values?.[0]?.stacktrace;

  console.log(`[BugFixAgent] Startar analys: ${errorTitle}`);

  // Identifiera fil
  const target = extractTargetFile(stacktrace);
  if (!target) {
    console.log("[BugFixAgent] Ingen tillämplig fil i stack trace — skippar");
    return { fixed: false, reason: "no_target_file" };
  }

  // Säkerhetskontroll
  if (BLOCKED_PATHS.some((b) => target.path.includes(b))) {
    console.log(`[BugFixAgent] ${target.path} är blockad — skippar`);
    return { fixed: false, reason: "blocked_path" };
  }

  // Anti-loop: skippa om vi fixade samma fil nyligen
  const lastFixed = recentlyFixed.get(target.path);
  if (lastFixed && Date.now() - lastFixed < 30 * 60 * 1000) {
    console.log(`[BugFixAgent] ${target.path} fixades nyligen — skippar`);
    return { fixed: false, reason: "recently_fixed" };
  }

  // Hämta filen från GitHub
  const fileData = await githubGet(target.path);
  if (!fileData?.content) {
    console.log(`[BugFixAgent] Kunde inte hämta ${target.path} från GitHub`);
    return { fixed: false, reason: "file_not_found" };
  }

  const originalCode = Buffer.from(fileData.content, "base64").toString("utf-8");

  const isFrontend = target.path.startsWith("src/");
  const techContext = isFrontend
    ? "React SPA (Vite + React 18). Filen är JSX/JS. Inga TypeScript-typer."
    : "Express.js + Prisma + Node.js backend.";

  // Claude analyserar och fixar
  const anthropic = getAnthropic();
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    messages: [{
      role: "user",
      content: `Du är en senior ingenjör för Sveriges Transportplattform (STP) — ${techContext}

Ett produktionsfel har inträffat:
FEL: ${errorType}: ${errorValue}
FIL: ${target.path} (rad ~${target.line}, funktion: ${target.fn || "okänd"})
SENTRY: ${errorTitle}

HÄR ÄR HELA FILEN (${target.path}):
\`\`\`javascript
${originalCode}
\`\`\`

Din uppgift:
1. Identifiera exakt vad som orsakar felet
2. Skriv en minimal, korrekt fix
3. Om du INTE är säker på fixen — svara med SÄKER: NEJ och förklara varför

Svara i EXAKT detta format:

SÄKER: [JA|NEJ]
FÖRKLARING: [vad orsakade felet, 1 mening]
FIX: [vad du ändrade, 1 mening]

\`\`\`javascript
[hela den fixade filen — komplett, inga utelämningar]
\`\`\``,
    }],
  });

  const response = (message.content?.[0]?.text ?? '').trim();

  const confident = response.match(/SÄKER:\s*(JA|NEJ)/i)?.[1]?.toUpperCase();
  const explanation = response.match(/FÖRKLARING:\s*(.+)/i)?.[1]?.trim() || "";
  const fixDescription = response.match(/FIX:\s*(.+)/i)?.[1]?.trim() || "";
  const codeMatch = response.match(/```javascript\n([\s\S]+?)\n```/);

  if (confident !== "JA" || !codeMatch) {
    console.log(`[BugFixAgent] Inte säker på fix för ${target.path} — skickar bara analys`);
    await sendAnalysisEmail(errorTitle, target, explanation, fixDescription);
    return { fixed: false, reason: "not_confident", explanation };
  }

  const fixedCode = codeMatch[1];

  // Säkerhetskoll: fixad kod ska inte vara kortare än 50% av originalet (undvik att Claude raderar kod)
  if (fixedCode.length < originalCode.length * 0.5) {
    console.log("[BugFixAgent] Fix verkar ta bort för mycket kod — avbryter");
    return { fixed: false, reason: "suspicious_diff" };
  }

  // FÖRSLAGSLÄGE: skriv ALDRIG till repot från servern. Mejla förslaget så att
  // en människa (eller daglig-sentry-triage via branch + PR) kan granska + deploya.
  recentlyFixed.set(target.path, Date.now()); // anti-loop: undvik upprepade mejl om samma fil
  console.log(`[BugFixAgent] Fix-förslag klart för ${target.path} — mejlar för granskning (committar ej)`);
  await sendProposalEmail(errorTitle, target, explanation, fixDescription, issueId);

  return { fixed: false, reason: "proposal_sent", file: target.path, explanation, fix: fixDescription };
}

// ─── Backlog-processor: hämta och fixa alla öppna Sentry-issues ──────────────

/**
 * Hämtar alla öppna Sentry-issues och försöker auto-fixa dem en efter en.
 * Körs via POST /api/webhooks/sentry/process-backlog (admin-only).
 */
export async function processBacklog() {
  console.log("[BugFixAgent] Startar backlog-processing...");

  const issues = await sentryFetchUnresolvedIssues(50);
  if (!issues.length) {
    console.log("[BugFixAgent] Inga öppna issues att processera");
    return { processed: 0, fixed: 0 };
  }

  console.log(`[BugFixAgent] Hittade ${issues.length} öppna issues`);

  let processed = 0;
  let fixed = 0;

  for (const issue of issues) {
    try {
      // Hämta senaste eventet för att få stack trace
      const latestEvent = await sentryGetIssueEvents(issue.id);
      if (!latestEvent) {
        console.log(`[BugFixAgent] Inget event för issue ${issue.id} — skippar`);
        continue;
      }

      // Bygg ett payload-format som attemptBugFix förväntar sig
      const payload = {
        data: {
          event: latestEvent,
          issue: {
            id: issue.id,
            title: issue.title,
            web_url: issue.permalink,
            count: issue.count,
          },
        },
      };

      const result = await attemptBugFix(payload);
      processed++;
      if (result.fixed) fixed++;

      // 2 sekunders paus mellan fixar för att inte spamma GitHub API
      await new Promise((r) => setTimeout(r, 2000));
    } catch (e) {
      console.error(`[BugFixAgent] Fel vid issue ${issue.id}:`, e?.message || String(e));
    }
  }

  console.log(`[BugFixAgent] Backlog klar: ${processed} processerade, ${fixed} fixade`);
  return { processed, fixed };
}

// ─── Email-rapporter ──────────────────────────────────────────────────────────

async function sendProposalEmail(errorTitle, target, explanation, fix, issueId) {
  const adminEmails = getAdminEmails();
  if (!adminEmails.length) return;

  const subject = `🛠️ Fix-förslag: ${target.path}`;
  const body = `BugFixAgent analyserade ett produktionsfel och har ETT FÖRSLAG på fix.
(Servern skriver aldrig kod själv — du eller daglig-sentry-triage implementerar och deployar.)

FEL: ${errorTitle}
FIL: ${target.path} (rad ~${target.line})

ORSAK: ${explanation}
FÖRESLAGEN FIX: ${fix}

Nästa steg: låt daglig-sentry-triage ta fram en PR, eller fixa manuellt och kör scripts/deploy.sh.${issueId ? `\nSentry-issue: ${issueId}` : ""}`;

  for (const to of adminEmails) {
    await sendEmail({ to, subject, text: body }).catch(() => {});
  }
}

async function sendAnalysisEmail(errorTitle, target, explanation, fix) {
  const adminEmails = getAdminEmails();
  if (!adminEmails.length) return;

  const subject = `🟡 Manuell fix behövs: ${target.path}`;
  const body = `BugFixAgent hittade ett fel men var inte säker nog att auto-fixa det.

FEL: ${errorTitle}
FIL: ${target.path} (rad ~${target.line})

ANALYS: ${explanation}
FÖRESLAGEN FIX: ${fix || "Se Sentry för detaljer"}

Behöver manuell granskning.`;

  for (const to of adminEmails) {
    await sendEmail({ to, subject, text: body }).catch(() => {});
  }
}
