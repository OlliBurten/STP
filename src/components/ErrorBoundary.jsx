import { Component } from "react";
import * as Sentry from "@sentry/react";
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
    Sentry.captureException(error, { extra: errorInfo });
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
