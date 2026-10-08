/**
 * Offentlig profil — åkeriet ser sin publika sida precis som förare och besökare ser den,
 * med en enkel länk att dela (t.ex. på hemsidan).
 */
import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";

const CompanyPublicProfile = lazy(() => import("./CompanyPublicProfile"));

export default function CompanyPublicPreview() {
  usePageTitle("Offentlig profil");
  const { user, activeOrg } = useAuth();
  const [copied, setCopied] = useState(false);
  // Organisationens enkla adress, annars ägarens id (äldre konton utan organisation).
  const key = activeOrg?.slug || user?.companyOwnerId || user?.id;
  const path = activeOrg?.slug ? `/akerier/${activeOrg.slug}` : `/foretag/${key}`;
  const url = `${window.location.origin}${path}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* urklipp blockerat — länken går att markera manuellt */
    }
  };

  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 32px 0" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, margin: "0 0 4px" }}>Offentlig profil</h1>
        <p style={{ fontSize: 14, color: "var(--ink-500)", margin: "0 0 18px" }}>
          Så ser förare och besökare ert åkeri. Alla kan se profilen och era annonser — bara förare kan kontakta er och söka.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: "12px 14px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12 }}>
          <code style={{ flex: 1, minWidth: 220, fontSize: 14, color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</code>
          <button type="button" onClick={copy} style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid var(--line-2)", background: "var(--card)", color: "var(--ink-900)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            {copied ? "Kopierad ✓" : "Kopiera länk"}
          </button>
          <a href={path} target="_blank" rel="noreferrer" style={{ padding: "8px 14px", borderRadius: 9, background: "var(--green)", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            Öppna ↗
          </a>
          <Link to="/foretag/profil" style={{ padding: "8px 14px", borderRadius: 9, color: "var(--green-text)", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            Redigera profilen
          </Link>
        </div>
      </div>
      <div style={{ marginTop: 20, borderTop: "1px solid var(--line)" }}>
        <Suspense fallback={<div className="min-h-[40vh]" />}>
          {key && <CompanyPublicProfile companyId={key} />}
        </Suspense>
      </div>
    </div>
  );
}
