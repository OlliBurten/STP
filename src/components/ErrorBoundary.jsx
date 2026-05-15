import { Component } from "react";
import { Link } from "react-router-dom";
import * as Sentry from "@sentry/react";

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
    Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      if (fallback) return fallback;
      return (
        <main className="min-h-[40vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <h1 className="text-xl font-bold text-slate-900">Något gick fel</h1>
            <p className="mt-2 text-slate-600 text-sm">
              Sidan kunde inte laddas. Försök ladda om eller gå tillbaka till startsidan.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:opacity-90"
              >
                Ladda om
              </button>
              <Link
                to="/"
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
              >
                Till startsidan
              </Link>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-4 p-3 rounded bg-slate-100 text-left text-xs overflow-auto max-h-32">
                {this.state.error?.message || String(this.state.error)}
              </pre>
            )}
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
