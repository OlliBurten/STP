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

export async function initPostHog() {
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
      },
    });
    ph = posthog;
  } catch (e) {
    console.warn("[PostHog] Kunde inte initieras:", e.message);
  }
}

/** Identifiera inloggad användare — körs vid login och vid sidladdning om redan inloggad */
export function identifyUser(user) {
  if (!ph || !user?.id) return;
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
  if (!ph) return;
  ph.capture(event, properties);
}

/** Gruppera företagsanvändare under sin organisation */
export function groupCompany(orgId, orgName) {
  if (!ph || !orgId) return;
  ph.group("company", orgId, { name: orgName });
}

/** Sätt person-egenskaper — t.ex. profile_completion_pct, onboarding_completed */
export function setPersonProperties(props) {
  if (!ph || !props) return;
  ph.capture("$set", { $set: props });
}
