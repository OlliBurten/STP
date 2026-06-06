/**
 * Bug Fix Agent — autonom felrättning för STP.
 *
 * Flöde:
 *   1. Ta emot Sentry-error med stack trace
 *   2. Identifiera vilken fil som orsakade felet
 *   3. Hämta filen från GitHub
 *   4. Claude analyserar + skriver fix
 *   5. Committa via GitHub API → Railway/Vercel auto-deployas
 *   6. Markera Sentry-issue som resolved
 *   7. Skicka rapport till Oliver
 *
 * Säkerhetsregler:
 *   - Rör aldrig: schema.prisma, auth.js, server.js, middleware/
 *   - Max 1 fil per fix
 *   - Om samma fil fixades för < 30 min sedan — skippa (undvika loopar)
 *   - Om Claude inte är säker — skicka bara analys, committa inte
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
  const token = process.env.SENTRY_AUTH_TOKEN;
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

async function githubCommit(path, content, message, sha) {
  const { token, repo } = getGitHub();
  const resp = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString("base64"),
      sha,
      branch: "main",
    }),
  });
  return resp.ok ? resp.json() : null;
}

// ─── Sentry API helpers ───────────────────────────────────────────────────────

async function sentryResolveIssue(issueId) {
  if (!issueId) return;
  const { token, org } = getSentry();
  if (!token) return;
  await fetch(`https://sentry.io/api/0/organizations/${org}/issues/${issueId}/`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "resolved" }),
  }).catch(() => {});
}

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

  // Committa till GitHub
  const commitMsg = `fix: auto-fix ${target.path} — ${fixDescription.slice(0, 80)}\n\n[BugFixAgent] Triggered by Sentry: ${errorTitle.slice(0, 100)}\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`;

  const result = await githubCommit(target.path, fixedCode, commitMsg, fileData.sha);

  if (!result) {
    console.log("[BugFixAgent] GitHub commit misslyckades");
    return { fixed: false, reason: "commit_failed" };
  }

  recentlyFixed.set(target.path, Date.now());
  console.log(`[BugFixAgent] Fix committad: ${target.path} — deployas automatiskt`);

  // Markera Sentry-issue som resolved
  if (issueId) {
    await sentryResolveIssue(issueId);
    console.log(`[BugFixAgent] Sentry issue ${issueId} markerad som resolved`);
  }

  await sendFixEmail(errorTitle, target, explanation, fixDescription, result);

  return { fixed: true, file: target.path, explanation, fix: fixDescription };
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
      console.error(`[BugFixAgent] Fel vid issue ${issue.id}:`, e.message);
    }
  }

  console.log(`[BugFixAgent] Backlog klar: ${processed} processerade, ${fixed} fixade`);
  return { processed, fixed };
}

// ─── Email-rapporter ──────────────────────────────────────────────────────────

async function sendFixEmail(errorTitle, target, explanation, fix, commitResult) {
  const adminEmails = getAdminEmails();
  if (!adminEmails.length) return;

  const sha = commitResult?.commit?.sha?.slice(0, 7) || "?";
  const subject = `✅ Auto-fix deployed: ${target.path}`;
  const body = `BugFixAgent fixade ett produktionsfel och pushade till main.

FEL: ${errorTitle}
FIL: ${target.path} (rad ~${target.line})

ORSAK: ${explanation}
FIX: ${fix}

Commit: ${sha} → deployas automatiskt inom ~2 min.

Om fixen är fel: gå till GitHub och revertera commit ${sha}.
https://github.com/${process.env.GITHUB_REPO}/commit/${commitResult?.commit?.sha || ""}`;

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
