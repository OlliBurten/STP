import { Link } from "react-router-dom";

/**
 * Dark-themed wrapper for all blog article pages.
 *
 * Props:
 *  - breadcrumb: string  — displayed after "Blogg ›" in the nav
 *  - children           — article JSX using existing Tailwind prose classes
 */
export default function BlogPost({ breadcrumb, children }) {
  return (
    <main
      style={{ background: "#060f0f", minHeight: "100vh", marginTop: "-64px", paddingTop: 96 }}
      className="dark-prose"
    >
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 80px" }}>
        <nav style={{ fontSize: 13, color: "rgba(240,250,249,0.4)", marginBottom: 28 }}>
          <Link to="/blogg" style={{ color: "#4ade80", textDecoration: "none" }}>Blogg</Link>
          <span style={{ margin: "0 8px" }}>›</span>
          <span style={{ color: "rgba(240,250,249,0.6)" }}>{breadcrumb}</span>
        </nav>
        {children}
      </div>
    </main>
  );
}
