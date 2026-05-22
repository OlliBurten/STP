/**
 * PostHog analytics wrapper för STP.
 *
 * - Initieras enbart om användaren har accepterat analytics-cookies (GDPR)
 * - EU-region: eu.i.posthog.com
 * - Exporterar enkla funktioner: identify, track, reset
 * - Alla funktioner är no-ops tills PostHog är initierat
 */

const POSTHOG_KEY = "phc_yAAxbAPm3pGzBTxGaFUR6yvHmbSMgGwwKZkqTufe478z";
const POSTHOG_HOST = "https://eu.i.posthog.com";

let ph = null;
let analyticsSuspended = false;

function safePostHogCall(fn) {
  try {
    fn?.();
  } catch (_) {
    // Analytics must never break admin workflows.
  }
}

function applyAnalyticsSuspension() {
  if (!ph) return;
  if (analyticsSuspended) {
    safePostHogCall(() => ph.stopSessionRecording?.());
    safePostHogCall(() => ph.reset?.());
    safePostHogCall(() => ph.opt_out_capturing?.());
    return;
  }
  safePostHogCall(() => ph.opt_in_capturing?.());
  safePostHogCall(() => ph.startSessionRecording?.());
}

export async function initPostHog() {
  if (analyticsSuspended) return;
  if (ph) return;
  try {
    const { default: posthog } = await import("posthog-js");
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
      session_recording: {
        maskAllInputs: true,         // Dölj lösenord och känsliga fält
        maskInputOptions: { password: true },
        recordCrossOriginIframes: false,
      },
      autocapture: true,             // Automatisk klick/formulär-tracking
      loaded: (posthogInstance) => {
        ph = posthogInstance;
        applyAnalyticsSuspension();
      },
    });
    ph = posthog;
    applyAnalyticsSuspension();
  } catch (e) {
    console.warn("[PostHog] Kunde inte initieras:", e.message);
  }
}

/** Pausa all analytics under admin view-as så målpersonens session inte spelas in eller identifieras. */
export function setAnalyticsSuspended(suspended) {
  const next = Boolean(suspended);
  if (analyticsSuspended === next) return;
  analyticsSuspended = next;
  applyAnalyticsSuspension();
}

/** Identifiera inloggad användare — körs vid login och vid sidladdning om redan inloggad */
export function identifyUser(user) {
  if (analyticsSuspended || !ph || !user?.id) return;
  ph.identify(user.id, {
    email: user.email,
    name: user.name,
    role: user.rawRole || user.role,
    company: user.companyName || undefined,
  });
}

/** Nollställ vid utloggning */
export function resetUser() {
  if (!ph) return;
  ph.reset();
}

/** Tracka en händelse med valfria properties */
export function track(event, properties = {}) {
  if (analyticsSuspended || !ph) return;
  ph.capture(event, properties);
}

/** Gruppera företagsanvändare under sin organisation */
export function groupCompany(orgId, orgName) {
  if (analyticsSuspended || !ph || !orgId) return;
  ph.group("company", orgId, { name: orgName });
}

/** Sätt person-egenskaper — t.ex. profile_completion_pct, onboarding_completed */
export function setPersonProperties(props) {
  if (analyticsSuspended || !ph || !props) return;
  ph.capture("$set", { $set: props });
}

export function __setPostHogClientForTest(client) {
  ph = client;
  analyticsSuspended = false;
}
