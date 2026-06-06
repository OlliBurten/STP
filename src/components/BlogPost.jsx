import { Link } from "react-router-dom";

/**
 * Light-themed wrapper for all blog article pages.
 *
 * Props:
 *  - breadcrumb: string  — displayed after "Blogg ›" in the nav
 *  - children           — article JSX using existing Tailwind prose classes
 */
export default function BlogPost({ breadcrumb, children }) {
  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh", paddingTop: 32 }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 80px" }}>
        <nav style={{ fontSize: "var(--text-sm)", color: "var(--ink-400)", marginBottom: 28 }}>
          <Link to="/blogg" style={{ color: "var(--green-text)", textDecoration: "none" }}>Blogg</Link>
          <span style={{ margin: "0 8px" }}>›</span>
          <span style={{ color: "var(--ink-500)" }}>{breadcrumb}</span>
        </nav>
        {children}
      </div>
    </main>
  );
}
