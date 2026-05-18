/**
 * Bug Fix Agent — autonom felrättning för STP.
 *
 * Flöde:
 *   1. Ta emot Sentry-error med stack trace
 *   2. Identifiera vilken fil som orsakade felet
 *   3. Hämta filen från GitHub
 *   4. Claude analyserar + skriver fix
 *   5. Committa via GitHub API → Railway auto-deployas
 *   6. Skicka rapport till Oliver
 *
 * Säkerhetsregler:
 *   - Rör aldrig: schema.prisma, auth.js, server.js, middleware/
 *   - Max 1 fil per fix
 *   - Om samma fil fixades för < 30 min sedan — skippa (undvik loopar)
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

// ─── Extrahera relevant fil från stack trace ──────────────────────────────────

function extractTargetFile(stacktrace) {
  if (!stacktrace?.frames) return null;
  // Leta efter sista frame som är vår egen kod (inte node_modules)
  const frames = stacktrace.frames.filter(
    (f) => f.filename && !f.filename.includes("node_modules") && f.in_app !== false
  );
  if (!frames.length) return null;
  const frame = frames[frames.length - 1];
  // Rensa bort absolut sökväg — behåll bara relativ del (server/routes/jobs.js)
  const match = frame.filename.match(/(server\/(?:routes|lib|scripts)\/.+\.js)/);
  return match ? { path: match[1], line: frame.lineno, fn: frame.function } : null;
}

// ─── Huvud-funktion ───────────────────────────────────────────────────────────

export async function attemptBugFix(sentryPayload) {
  const event = sentryPayload?.data?.event || {};
  const issue = sentryPayload?.data?.issue || {};
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

  // Claude analyserar och fixar
  const anthropic = getAnthropic();
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    messages: [{
      role: "user",
      content: `Du är en senior backend-ingenjör för Sveriges Transportplattform (STP) — en Express.js/Prisma/Node.js-app.

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
3. Om du INTE är säker på fixen — svara med SKIP och förklara varför

Svara i EXAKT detta format:

SÄKER: [JA|NEJ]
FÖRKLARING: [vad orsakade felet, 1 mening]
FIX: [vad du ändrade, 1 mening]

\`\`\`javascript
[hela den fixade filen — komplett, inga utelämningar]
\`\`\``,
    }],
  });

  const response = message.content[0].text.trim();

  const confident = response.match(/SÄKER:\s*(JA|NEJ)/i)?.[1]?.toUpperCase();
  const explanation = response.match(/FÖRKLARING:\s*(.+)/i)?.[1]?.trim() || "";
  const fixDescription = response.match(/FIX:\s*(.+)/i)?.[1]?.trim() || "";
  const codeMatch = response.match(/```javascript\n([\s\S]+?)\n```/);

  if (confident !== "JA" || !codeMatch) {
    console.log(`[BugFixAgent] Inte säker på fix för ${target.path} — skickar bara analys`);
    await sendAnalysisEmail(errorTitle, target, explanation, fixDescription, false);
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
  console.log(`[BugFixAgent] Fix committad: ${target.path} — deployas automatiskt via Railway`);

  await sendFixEmail(errorTitle, target, explanation, fixDescription, result);

  return { fixed: true, file: target.path, explanation, fix: fixDescription };
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

Commit: ${sha} → Railway deployas automatiskt inom ~2 min.

Om fixen är fel: gå till GitHub och revertera commit ${sha}.
https://github.com/${process.env.GITHUB_REPO}/commit/${commitResult?.commit?.sha || ""}`;

  for (const to of adminEmails) {
    await sendEmail({ to, subject, text: body }).catch(() => {});
  }
}

async function sendAnalysisEmail(errorTitle, target, explanation, fix, wasFixed) {
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
