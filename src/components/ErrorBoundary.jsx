import { Component } from "react";
import ErrorPage from "./ErrorPage";

/**
 * Fångar render-fel så att appen inte visar helt blank sida.
 *
 * "Försök igen" monterar om trädet i stället för att ladda om sidan, så att det
 * användaren hunnit fylla i finns kvar. Det spelar roll: de renderfel vi
 * faktiskt sett i produktion (Sentry STP-FRONTEND-T och -X, juli–aug 2026) är
 * removeChild-krascher på /registrera och /jobb när webbläsaren översätter
 * sidan — och en omladdning mitt i registreringen tömmer formuläret.
 *
 * Hjälper inte omstarten kraschar det igen direkt. Då byter knappen tillbaka
 * till en riktig omladdning (ErrorPage gör det när onRetry saknas) i stället
 * för att låta användaren trycka i en loop som inte leder någonstans.
 */

/** Kraschar det igen inom så här lång tid räknar vi omstarten som misslyckad. */
const RETRY_GRACE_MS = 5000;

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, softRetryFailed: false };
    this.retriedAt = 0;
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
    const soonAfterRetry = this.retriedAt > 0 && Date.now() - this.retriedAt < RETRY_GRACE_MS;
    if (soonAfterRetry) this.setState({ softRetryFailed: true });
    // Dynamisk import: en statisk `import * as Sentry` här drog in hela
    // @sentry/react (148 kB gzip) i den ivriga bundlen på VARJE sidladdning —
    // 38 % av allt JavaScript — trots att main.jsx redan laddar Sentry lazily
    // och först efter cookiesamtycke. Ett renderfel är sällsynt nog att tåla
    // en extra hämtning, och är Sentry redan initierad är chunken cachad.
    import("@sentry/react")
      .then((Sentry) => Sentry.captureException(error, { extra: { ...errorInfo, stpRetried: soonAfterRetry } }))
      .catch(() => { /* utan Sentry räcker console-loggen ovan */ });
  }

  handleRetry() {
    this.retriedAt = Date.now();
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      if (fallback) return fallback;
      // Utan onRetry laddar ErrorPage om sidan — dit faller vi tillbaka när ett
      // omount redan visat sig otillräckligt.
      return <ErrorPage variant="500" onRetry={this.state.softRetryFailed ? undefined : this.handleRetry} />;
    }
    return this.props.children;
  }
}
