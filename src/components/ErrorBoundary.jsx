import { Component } from "react";
import ErrorPage from "./ErrorPage";

/** Fångar render-fel så att appen inte visar helt blank sida. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
    // Dynamisk import: en statisk `import * as Sentry` här drog in hela
    // @sentry/react (148 kB gzip) i den ivriga bundlen på VARJE sidladdning —
    // 38 % av allt JavaScript — trots att main.jsx redan laddar Sentry lazily
    // och först efter cookiesamtycke. Ett renderfel är sällsynt nog att tåla
    // en extra hämtning, och är Sentry redan initierad är chunken cachad.
    import("@sentry/react")
      .then((Sentry) => Sentry.captureException(error, { extra: errorInfo }))
      .catch(() => { /* utan Sentry räcker console-loggen ovan */ });
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      if (fallback) return fallback;
      return <ErrorPage variant="500" />;
    }
    return this.props.children;
  }
}
