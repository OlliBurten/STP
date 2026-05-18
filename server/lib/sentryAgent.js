/**
 * Sentry AI Agent
 * Tar emot Sentry webhook-events, analyserar med Claude och skickar rapport till admin.
 */
import Anthropic from "@anthropic-ai/sdk";
import { sendEmail } from "./email.js";
import { attemptBugFix } from "./bugFixAgent.js";

function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY saknas");
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function getAdminEmails() {
  return String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Analyserar ett Sentry-event med Claude och skickar alert till admin vid CRITICAL/WARNING.
 * @param {object} payload - Sentry webhook payload
 */
export async function handleSentryEvent(payload) {
  try {
    const event = payload?.data?.event || payload?.event || {};
    const issue = payload?.data?.issue || {};

    const errorTitle = event.title || issue.title || payload?.message || "Okänt fel";
    const errorType = event.exception?.values?.[0]?.type || "";
    const errorValue = event.exception?.values?.[0]?.value || "";
    const stackTrace = formatStackTrace(event.exception?.values?.[0]?.stacktrace);
    const url = event.request?.url || "";
    const userAgent = event.request?.headers?.["User-Agent"] || "";
    const userId = event.user?.id || event.user?.email || "";
    const environment = event.environment || "production";
    const level = event.level || "error";
    const count = issue.count || issue.times_seen || 1;
    const issueUrl = issue.web_url || issue.permalink || "";

    const anthropic = getAnthropic();

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{
        role: "user",
        content: `Du är en senior STP-plattformsingenjör. Analysera detta produktionsfel och svara på svenska.

FEL: ${errorTitle}
TYP: ${errorType}: ${errorValue}
MILJÖ: ${environment} | NIVÅ: ${level} | ANTAL: ${count}x
URL: ${url}
ANVÄNDARE: ${userId || "ej inloggad"}

STACK TRACE:
${stackTrace || "(ej tillgänglig)"}

Svara i exakt detta format:

ALLVARLIGHET: [CRITICAL|WARNING|INFO]
SAMMANFATTNING: [1 mening vad som gick fel]
PÅVERKAN: [vad påverkas för användarna]
TROLIG ORSAK: [vad är sannolikt fel]
ÅTGÄRD: [konkret nästa steg, max 2 meningar]`,
      }],
    });

    const analysis = message.content[0].text.trim();
    const severityMatch = analysis.match(/ALLVARLIGHET:\s*(CRITICAL|WARNING|INFO)/i);
    const severity = severityMatch?.[1]?.toUpperCase() || "WARNING";

    // Skicka mail endast för CRITICAL och WARNING
    if (severity === "INFO") {
      console.log(`[SentryAgent] INFO-event ignorerat: ${errorTitle}`);
      return { severity, skipped: true };
    }

    const adminEmails = getAdminEmails();
    if (adminEmails.length === 0) {
      console.warn("[SentryAgent] Inga admin-emails konfigurerade");
      return { severity };
    }

    const emoji = severity === "CRITICAL" ? "🔴" : "🟡";
    const subject = `${emoji} STP ${severity}: ${errorTitle.slice(0, 80)}`;

    const body = `${analysis}

---
${issueUrl ? `Sentry: ${issueUrl}\n` : ""}Tid: ${new Date().toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" })}
Miljö: ${environment} | Antal förekomster: ${count}x
${url ? `URL: ${url}` : ""}`;

    for (const to of adminEmails) {
      await sendEmail({ to, subject, text: body }).catch((e) =>
        console.error("[SentryAgent] Kunde inte skicka mail:", e.message)
      );
    }

    console.log(`[SentryAgent] ${severity} alert skickat: ${errorTitle}`);

    // Försök auto-fixa om vi har GitHub-credentials och felet är CRITICAL/WARNING
    if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
      attemptBugFix(payload).then((result) => {
        if (result.fixed) {
          console.log(`[SentryAgent] Auto-fix deployed: ${result.file}`);
        } else {
          console.log(`[SentryAgent] Auto-fix skippat: ${result.reason}`);
        }
      }).catch((e) => console.error("[SentryAgent] BugFixAgent fel:", e.message));
    }

    return { severity, emailSent: true };
  } catch (e) {
    console.error("[SentryAgent] Fel:", e.message);
    return { severity: "ERROR", error: e.message };
  }
}

function formatStackTrace(stacktrace) {
  if (!stacktrace?.frames) return "";
  return stacktrace.frames
    .slice(-8) // sista 8 frames är mest relevanta
    .map((f) => `  ${f.filename || "?"}:${f.lineno || "?"} in ${f.function || "?"}`)
    .join("\n");
}
