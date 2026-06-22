/**
 * PostHog analytics wrapper för STP.
 *
 * - Initieras enbart om användaren har accepterat analytics-cookies (GDPR)
 * - EU-region: eu.i.posthog.com
 * - Exporterar enkla funktioner: identify, track, reset
 * - Anrop som görs INNAN init är klar köas och spelas upp när PostHog laddats.
 *   Tidigare var de no-ops → `user_registered` m.fl. events försvann i racen
 *   mellan den asynkrona importen av posthog-js och första track-anropet.
 */

import { createCallQueue } from "./posthogQueue.js";

// Rätt projekt-nyckel för STP:s PostHog (EU). Tidigare hårdkodad nyckel (phc_yAAx…)
// matchade INTE projektet → 0 events fångades. Läs från env om satt, annars korrekt fallback.
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || "phc_kShkxLGgrao6jypSTnFAjUVdazNiYw6sVijhKGQMxPdt";
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || "https://eu.i.posthog.com";

const queue = createCallQueue();
let initPromise = null;

export function initPostHog() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const { default: posthog } = await import("posthog-js");
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        person_profiles: "identified_only",
        capture_pageview: true,
        capture_pageleave: true,
        // Session-inspelning (rrweb) av DOM gör mobilen märkbart trög — stäng av
        // den kontinuerliga inspelningen. Händelse-/sidanalys (autocapture +
        // pageviews) behålls. Vill man ha inspelningar igen: sampla hårt via
        // PostHog-projektets inställningar i st f att spela in alla sessioner.
        disable_session_recording: true,
        autocapture: true,             // Automatisk klick/formulär-tracking (lättviktig)
      });
      // Spela upp anrop som gjordes innan init var klar (identify/track/…)
      queue.flush(posthog);
    } catch (e) {
      console.warn("[PostHog] Kunde inte initieras:", e.message);
      initPromise = null; // tillåt nytt försök
    }
  })();
  return initPromise;
}

/** Identifiera inloggad användare — körs vid login och vid sidladdning om redan inloggad */
export function identifyUser(user) {
  if (!user?.id) return;
  queue.run((ph) => ph.identify(user.id, {
    email: user.email,
    name: user.name,
    role: user.rawRole || user.role,
    company: user.companyName || undefined,
  }));
}

/** Nollställ vid utloggning */
export function resetUser() {
  queue.run((ph) => ph.reset());
}

/** Tracka en händelse med valfria properties */
export function track(event, properties = {}) {
  queue.run((ph) => ph.capture(event, properties));
}

/** Gruppera företagsanvändare under sin organisation */
export function groupCompany(orgId, orgName) {
  if (!orgId) return;
  queue.run((ph) => ph.group("company", orgId, { name: orgName }));
}

/** Sätt person-egenskaper — t.ex. profile_completion_pct, onboarding_completed */
export function setPersonProperties(props) {
  if (!props) return;
  queue.run((ph) => ph.capture("$set", { $set: props }));
}
