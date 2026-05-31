import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchPublicDriver, trackDriverProfileView, fetchPublicDriverReviews } from "../api/drivers.js";
import { availabilityTypes, getCertificateLabel } from "../data/profileData";
import { segmentLabel } from "../data/segments";
import { LocationIcon } from "../components/Icons";
import PageMeta from "../components/PageMeta";
import DriverProfileView from "../components/DriverProfileView.jsx";

const EXP_VEHICLE_TYPES = [
  { value: "ce_lastbil", label: "CE Lastbil" },
  { value: "c_lastbil", label: "C Lastbil" },
  { value: "tankbil", label: "Tankbil" },
  { value: "kylbil", label: "Kylbil" },
  { value: "containerbil", label: "Container" },
  { value: "skåpbil", label: "Skåp/budbil" },
  { value: "kranbil", label: "Kranbil" },
  { value: "timmerbil", label: "Timmerbil" },
  { value: "betongbil", label: "Betongbil" },
];
const EXP_JOB_TYPES = [
  { value: "farjkorning", label: "Fjärrkörning" },
  { value: "distribution", label: "Distribution" },
  { value: "lokalt", label: "Lokalkörning" },
  { value: "tim", label: "Timkörning" },
  { value: "natt", label: "Nattransport" },
];

function formatYearRange(exp) {
  if (exp.current) return `${exp.startYear || "?"} – nu`;
  return `${exp.startYear || "?"} – ${exp.endYear || "?"}`;
}

function StatBlock({ label, value, accent }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "12px 8px", borderRadius: 12,
      background: accent ? "var(--amber-tint)" : "var(--paper-2)",
      border: `1px solid ${accent ? "rgba(245,166,35,0.3)" : "var(--line)"}`,
    }}>
      <span style={{ fontSize: 16, fontWeight: 800, color: accent ? "var(--amber-text)" : "var(--ink-900)" }}>{value}</span>
      <span style={{ fontSize: 11, marginTop: 2, color: accent ? "var(--amber-text)" : "var(--ink-400)", opacity: accent ? 0.85 : 1 }}>{label}</span>
    </div>
  );
}

export default function PublicDriverProfile() {
  const { id } = useParams();
  const { user, isCompany } = useAuth();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [shared, setShared] = useState(false);
  const [driverReviews, setDriverReviews] = useState([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchPublicDriver(id)
      .then(setDriver)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    fetchPublicDriverReviews(id).then(setDriverReviews).catch(() => setDriverReviews([]));
  }, [id]);

  useEffect(() => {
    if (!id || !isCompany || user?.id === id) return;
    trackDriverProfileView(id).catch(() => {});
  }, [id, isCompany, user?.id]);

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${driver?.name} – Förare på STP`;
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  if (loading) {
    return (
      <main style={{ background: "var(--paper)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: "2px solid var(--line)", borderTopColor: "var(--green)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </main>
    );
  }

  if (error || !driver) {
    return (
      <main style={{ background: "var(--paper)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 24px" }}>
        <div>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🚛</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink-900)", margin: "0 0 10px" }}>Föraren hittades inte</h1>
          <p style={{ fontSize: 14, color: "var(--ink-400)", margin: "0 0 24px" }}>Föraren har kanske valt att inte synas offentligt.</p>
          <Link to="/jobb" style={{ fontSize: 14, color: "var(--green-text)", textDecoration: "none" }}>Se lediga jobb →</Link>
        </div>
      </main>
    );
  }

  const primaryLicense = driver.licenses?.filter((l) => ["CE", "C", "C1"].includes(l)).sort().reverse()[0];
  const metaDescription = [
    driver.location && `Baserad i ${driver.location}`,
    primaryLicense && `Körkort ${primaryLicense}`,
    driver.yearsExperience > 0 && `${driver.yearsExperience} års erfarenhet`,
  ].filter(Boolean).join(" · ");

  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "24px 32px 80px" }}>
      <PageMeta
        title={`${driver.name} – Förarprofil på STP`}
        description={metaDescription || "Förarprofil på Sveriges Transportplattform"}
        canonical={`/forare/${id}`}
        type="profile"
        image="https://transportplattformen.se/hero.png"
      />

      {/* Navigering */}
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }} className="print:hidden">
        <Link to="/" style={{ fontSize: 13, color: "var(--ink-400)", textDecoration: "none" }}>
          ← Sveriges Transportplattform
        </Link>
      </div>

      <DriverProfileView
        profile={driver}
        owner={{ name: driver.name, id: driver.id }}
        mode="public"
        reviews={driverReviews}
      />

      {/* Print footer */}
      <div className="hidden print:block" style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: "var(--ink-400)" }}>
        Profil skapad via Sveriges Transportplattform · transportplattformen.se
      </div>
      </div>
    </main>
  );
}
