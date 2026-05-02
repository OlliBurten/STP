import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { mockDrivers } from "../data/mockDrivers";
import { mockJobs } from "../data/mockJobs";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import { calcYearsExperience } from "../utils/profileUtils";
import { getMatchCriteria, getMatchingDriversForJob } from "../utils/matchUtils";
import { DriverListSkeleton } from "../components/LoadingBlock";
import { fetchDrivers } from "../api/drivers.js";
import { fetchMyJobs, fetchJob } from "../api/jobs.js";
import { fetchConversations, createConversation } from "../api/conversations.js";
import { segmentOptions } from "../data/segments";
import { licenseTypes, experienceLevels, regions } from "../data/mockJobs";
import { availabilityTypes, certificateTypes, getCertificateLabel } from "../data/profileData";

/* ── Design tokens ── */
const T = {
  bg: "#050e0e", bg2: "#0a1818", bg3: "#0d2b2b",
  primary: "#1F5F5C", pLight: "#2a7a76",
  pGlow: "rgba(31,95,92,0.25)", pDim: "rgba(31,95,92,0.12)",
  amber: "#F5A623", amberDim: "rgba(245,166,35,0.1)",
  text: "#f0faf9", sub: "rgba(240,250,249,0.5)", muted: "rgba(240,250,249,0.28)",
  border: "rgba(255,255,255,0.07)", border2: "rgba(255,255,255,0.12)",
  card: "rgba(255,255,255,0.03)", green: "rgba(74,222,128,0.75)", red: "rgba(248,113,113,0.7)",
  font: "'DM Sans', system-ui, sans-serif",
};

/* ── Tag atom ── */
function Tag({ c = "p", size = 12, children }) {
  const m = {
    p:     { bg: "rgba(31,95,92,0.12)",    col: "rgba(125,211,200,0.8)",  b: "rgba(31,95,92,0.2)" },
    amber: { bg: "rgba(245,166,35,0.08)",  col: "rgba(245,166,35,0.75)", b: "rgba(245,166,35,0.18)" },
    green: { bg: "rgba(74,222,128,0.07)",  col: "rgba(74,222,128,0.7)",  b: "rgba(74,222,128,0.15)" },
    red:   { bg: "rgba(248,113,113,0.07)", col: "rgba(248,113,113,0.7)", b: "rgba(248,113,113,0.15)" },
    muted: { bg: "rgba(255,255,255,0.04)", col: "rgba(240,250,249,0.3)", b: "rgba(255,255,255,0.07)" },
  };
  const s = m[c] || m.p;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: `2px ${size < 12 ? 7 : 10}px`, borderRadius: 20,
      fontSize: size, fontWeight: 500,
      background: s.bg, color: s.col, border: `1px solid ${s.b}`,
    }}>{children}</span>
  );
}

/* ── Availability dot color ── */
function availDot(av) {
  if (av === "open") return "rgba(74,222,128,0.75)";
  if (av === "inactive") return "rgba(248,113,113,0.7)";
  return "rgba(245,166,35,0.7)";
}

/* ── Driver initials ── */
function initials(name) {
  return (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

/* ── Driver card (minimal dark) ── */
function DarkDriverCard({ driver, matchPct, isSelected, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isSelected ? "rgba(31,95,92,0.07)" : "transparent",
        border: `1px solid ${isSelected ? "rgba(31,95,92,0.3)" : hovered ? "rgba(255,255,255,0.1)" : T.border}`,
        borderRadius: 11, padding: "13px 15px", cursor: "pointer", transition: "border-color .12s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
          background: T.pDim, border: "1px solid rgba(31,95,92,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: "rgba(125,211,200,0.65)",
        }}>{initials(driver.name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{driver.name}</p>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: availDot(driver.availability), flexShrink: 0 }} />
            </div>
            {matchPct != null && (
              <span style={{ fontSize: 11, color: T.muted }}>{matchPct}%</span>
            )}
          </div>
          <p style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>
            {driver.location || driver.region}
            {(driver.yearsExperience ?? calcYearsExperience(driver.experience)) > 0
              ? ` · ${driver.yearsExperience ?? calcYearsExperience(driver.experience)} år`
              : ""}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {(driver.licenses || []).map((l) => <Tag key={l} c="p" size={11}>{l}</Tag>)}
            {(driver.certificates || []).slice(0, 2).map((c) => <Tag key={c} c="muted" size={11}>{c.replace(/_/g, " ")}</Tag>)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Filter chip button ── */
function FilterChip({ active, onClick, children, color = "primary" }) {
  const activeStyles = {
    primary: { bg: T.primary, color: "#fff", border: T.primary },
    amber: { bg: T.amberDim, color: "rgba(245,166,35,0.85)", border: "rgba(245,166,35,0.25)" },
    teal: { bg: T.pDim, color: "rgba(125,211,200,0.85)", border: "rgba(31,95,92,0.2)" },
  };
  const s = active ? (activeStyles[color] || activeStyles.primary) : null;
  return (
    <button onClick={onClick} style={{
      padding: "4px 9px", borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: "pointer",
      fontFamily: T.font, border: `1px solid ${active ? s.border : T.border}`,
      background: active ? s.bg : "transparent", color: active ? s.color : T.sub, transition: "all .1s",
    }}>{children}</button>
  );
}

/* ── Filter drawer ── */
function FilterDrawer({ open, onClose, filters, setFilters }) {
  const toggle = (key, val) => setFilters((p) => ({
    ...p, [key]: p[key] === val ? "" : val,
  }));
  const toggleArr = (key, val) => setFilters((p) => ({
    ...p, [key]: (p[key] || []).includes(val)
      ? (p[key] || []).filter((x) => x !== val)
      : [...(p[key] || []), val],
  }));

  return (
    <div style={{
      width: open ? 240 : 0, flexShrink: 0, overflow: "hidden",
      background: T.bg2, borderRight: open ? `1px solid ${T.border}` : "none",
      transition: "width .2s ease",
    }}>
      <div style={{ width: 240, overflowY: "auto", height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 6px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Filter</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "10px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Region */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted, marginBottom: 7 }}>Region</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {regions.slice(0, 8).map((r) => (
                <FilterChip key={r} active={filters.region === r} onClick={() => toggle("region", r)}>{r}</FilterChip>
              ))}
            </div>
          </div>

          {/* Licenses */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted, marginBottom: 7 }}>Körkort</p>
            <div style={{ display: "flex", gap: 5 }}>
              {["B", "C", "CE", "D"].map((l) => {
                const on = filters.license === l;
                return (
                  <button key={l} onClick={() => toggle("license", l)} style={{
                    width: 40, height: 40, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                    fontFamily: T.font, border: `1.5px solid ${on ? T.primary : T.border}`,
                    background: on ? T.primary : "transparent", color: on ? "#fff" : T.sub, transition: "all .1s",
                  }}>{l}</button>
                );
              })}
            </div>
          </div>

          {/* Certificates */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted, marginBottom: 7 }}>Certifikat</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {["YKB", "ADR", "ADR_Tank", "Kran", "Truck_B", "APV_1_1"].map((c) => {
                const on = filters.certificate === c;
                return (
                  <FilterChip key={c} active={on} color="teal" onClick={() => toggle("certificate", c)}>
                    {c.replace(/_/g, " ")}
                  </FilterChip>
                );
              })}
            </div>
          </div>

          {/* Availability */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted, marginBottom: 7 }}>Tillgänglighet</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {availabilityTypes.map((a) => (
                <FilterChip key={a.value} active={filters.availability === a.value} color="amber" onClick={() => toggle("availability", a.value)}>
                  {a.label}
                </FilterChip>
              ))}
            </div>
          </div>

          {/* Segment */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted, marginBottom: 7 }}>Söker</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {segmentOptions.map((s) => (
                <FilterChip key={s.value} active={filters.segment === s.value} color="teal" onClick={() => toggle("segment", s.value)}>
                  {s.label}
                </FilterChip>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted, marginBottom: 7 }}>Erfarenhet</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {experienceLevels.map((e) => (
                <FilterChip key={e.value} active={filters.experience === e.value} color="teal" onClick={() => toggle("experience", e.value)}>
                  {e.label}
                </FilterChip>
              ))}
            </div>
          </div>

          {/* Search */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted, marginBottom: 7 }}>Sök</p>
            <input
              type="text"
              value={filters.search || ""}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              placeholder="Namn, region…"
              style={{
                width: "100%", padding: "7px 10px", borderRadius: 7, fontSize: 12,
                background: T.card, border: `1px solid ${T.border2}`, color: T.text,
                fontFamily: T.font, outline: "none",
              }}
            />
          </div>

          <button
            onClick={() => setFilters({ search: "", region: "", license: "", certificate: "", segment: "", availability: "", experience: "" })}
            style={{
              padding: "6px", borderRadius: 7, border: `1px solid ${T.border}`,
              background: "transparent", color: T.muted, fontSize: 11, cursor: "pointer", fontFamily: T.font,
            }}
          >Rensa filter</button>
        </div>
      </div>
    </div>
  );
}

/* ── Driver detail panel ── */
function DriverDetailPanel({ driver, matchPct, matchCriteria, isContacted, onClose, onContact }) {
  const avLabels = {
    open: "Öppen för jobb", fast: "Söker fast", vikariat: "Söker vikariat",
    tim: "Söker timjobb", inactive: "Inte aktivt sökande",
  };
  const yearsExp = driver.yearsExperience ?? calcYearsExperience(driver.experience);

  return (
    <div style={{
      width: 360, flexShrink: 0, background: T.bg2, borderLeft: `1px solid ${T.border}`,
      height: "calc(100vh - 56px)", overflowY: "auto", position: "sticky", top: 56,
    }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(160deg, ${T.bg3} 0%, #061414 100%)`, padding: "20px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
              background: T.pDim, border: "1px solid rgba(31,95,92,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: "rgba(125,211,200,0.7)",
            }}>{initials(driver.name)}</div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 3, color: T.text }}>{driver.name}</h2>
              <p style={{ fontSize: 11, color: T.muted }}>📍 {driver.location || "—"}, {driver.region || "—"}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 20, lineHeight: 1, padding: 2 }}>×</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
          {(driver.licenses || []).map((l) => <Tag key={l} c="p" size={11}>{l}</Tag>)}
          {(driver.certificates || []).map((c) => <Tag key={c} c="muted" size={11}>{c.replace(/_/g, " ")}</Tag>)}
        </div>
        {matchPct != null && (
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "7px 7px 0 0", padding: "10px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: T.muted }}>Matchning</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>{matchPct}%</span>
            </div>
            <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,0.07)" }}>
              <div style={{ height: 3, borderRadius: 3, background: T.primary, width: `${matchPct}%` }} />
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onContact(driver)} style={{
            flex: 1, padding: "10px", borderRadius: 9, border: "none",
            background: isContacted ? T.pDim : T.amber,
            color: isContacted ? "rgba(125,211,200,0.85)" : "#0a1010",
            fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: T.font,
          }}>
            {isContacted ? "Skicka igen" : "Kontakta"}
          </button>
          <a
            href={`/forare/${driver.id}`}
            target="_blank"
            rel="noreferrer"
            style={{
              width: 40, height: 40, borderRadius: 9, border: `1px solid ${T.border2}`,
              background: T.card, color: T.sub, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 14, textDecoration: "none",
            }}
            title="Öppna publik profil"
          >↗</a>
        </div>

        {isContacted && (
          <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.12)" }}>
            <p style={{ fontSize: 11, color: "rgba(74,222,128,0.7)" }}>✓ Du har redan kontaktat den här föraren</p>
          </div>
        )}

        {/* Summary */}
        {driver.summary && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "13px 14px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: T.muted, marginBottom: 7 }}>Presentation</p>
            <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.65 }}>{driver.summary}</p>
          </div>
        )}

        {/* Details */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "13px 14px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: T.muted, marginBottom: 10 }}>Detaljer</p>
          {[
            yearsExp > 0 && ["Erfarenhet", `${yearsExp} år`],
            ["Tillgänglighet", avLabels[driver.availability] || driver.availability || "—"],
            driver.primarySegment && ["Segment", segmentOptions.find((s) => s.value === driver.primarySegment)?.label || driver.primarySegment],
            (driver.regionsWilling || []).length > 0 && ["Kan jobba i", (driver.regionsWilling || []).join(", ")],
          ].filter(Boolean).map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: 12, color: T.muted }}>{k}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: T.sub }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Match criteria */}
        {matchCriteria && matchCriteria.length > 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "13px 14px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: T.muted, marginBottom: 10 }}>Matchkriterier</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {matchCriteria.map((criterion, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: criterion.met ? "rgba(74,222,128,0.7)" : T.muted }}>
                    {criterion.met ? "✓" : "○"}
                  </span>
                  <span style={{ fontSize: 12, color: criterion.met ? T.sub : T.muted }}>{criterion.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {(driver.experience || []).length > 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "13px 14px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: T.muted, marginBottom: 10 }}>Erfarenhet</p>
            {(driver.experience || []).map((exp, i) => (
              <div key={exp.id || i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < driver.experience.length - 1 ? 10 : 0 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: i === 0 ? "rgba(74,222,128,0.6)" : T.border2, marginTop: 5, flexShrink: 0,
                }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{exp.role}</p>
                  <p style={{ fontSize: 11, color: T.muted }}>
                    {exp.company} · {exp.startYear || "?"}{exp.current ? "–nu" : exp.endYear ? `–${exp.endYear}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Contact modal ── */
function ContactModal({ driver, jobs, onClose, onSent }) {
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || "");
  const selectedJob = jobs.find((j) => j.id === selectedJobId);
  const firstName = (driver.name || "").split(" ")[0];
  const jobTitle = selectedJob?.title || "en tjänst";
  const [msg, setMsg] = useState(
    `Hej ${firstName}!\n\nVi söker en ${(driver.licenses || []).includes("CE") ? "CE-förare" : "förare"} och din profil verkar passa bra för ${jobTitle}. Är du intresserad av att höra mer?\n\nMed vänlig hälsning`
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSend() {
    setSending(true);
    setError("");
    try {
      await createConversation({ driverId: driver.id, jobId: selectedJobId || undefined, message: msg });
      setSent(true);
      onSent && onSent(driver.id);
    } catch (e) {
      setError(e.message || "Kunde inte skicka meddelandet.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
        <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 14, padding: 36, textAlign: "center", maxWidth: 380, width: "90%" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(74,222,128,0.08)", border: "1.5px solid rgba(74,222,128,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 14px" }}>✓</div>
          <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: T.text }}>Skickat!</p>
          <p style={{ fontSize: 13, color: T.sub, marginBottom: 22, lineHeight: 1.6 }}>
            {firstName} får en notifikation och kan svara via chatten.
          </p>
          <button onClick={onClose} style={{ width: "100%", padding: "10px", borderRadius: 9, border: "none", background: T.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>
            Stäng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24, maxWidth: 460, width: "90%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.pDim, border: "1px solid rgba(31,95,92,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "rgba(125,211,200,0.7)" }}>
              {initials(driver.name)}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: T.text }}>Kontakta {firstName}</p>
              <p style={{ fontSize: 11, color: T.muted }}>Skicka ett första meddelande</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 22 }}>×</button>
        </div>

        {jobs.length > 1 && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6 }}>Jobb att koppla</p>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: T.card, border: `1px solid ${T.border2}`, color: T.text, fontSize: 13, fontFamily: T.font, outline: "none" }}
            >
              <option value="">Inget specifikt jobb</option>
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
        )}

        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          rows={7}
          style={{ width: "100%", padding: 12, borderRadius: 9, background: T.card, border: `1px solid ${T.border2}`, color: T.text, fontSize: 13, outline: "none", lineHeight: 1.65, resize: "none", marginBottom: 14, fontFamily: T.font }}
        />
        {error && <p style={{ fontSize: 12, color: "#f87171", marginBottom: 10 }}>{error}</p>}
        <p style={{ fontSize: 11, color: T.muted, marginBottom: 14, lineHeight: 1.5 }}>Föraren ser ditt företagsnamn och svarar i chatten.</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleSend} disabled={sending || !msg.trim()} style={{
            flex: 1, padding: "10px 22px", borderRadius: 9, border: "none",
            background: T.amber, color: "#0a1010", fontSize: 14, fontWeight: 700,
            cursor: "pointer", fontFamily: T.font, opacity: (sending || !msg.trim()) ? 0.5 : 1,
          }}>
            {sending ? "Skickar…" : "Skicka"}
          </button>
          <button onClick={onClose} style={{
            padding: "10px 22px", borderRadius: 9, border: "none",
            background: "rgba(255,255,255,0.07)", color: T.sub, fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: T.font,
          }}>Avbryt</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════ MAIN ══════════ */
const FILTER_KEYS = ["search", "region", "license", "certificate", "segment", "availability", "experience"];

export default function DriverSearch() {
  const { hasApi } = useAuth();
  const { profile } = useProfile();
  const { state: locationState } = useLocation();
  const navigate = useNavigate();
  const forJobId = locationState?.forJobId;
  const forJobTitle = locationState?.forJobTitle;

  const [apiDrivers, setApiDrivers] = useState([]);
  const [apiJobs, setApiJobs] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [driversError, setDriversError] = useState("");
  const [matchJobId, setMatchJobId] = useState(forJobId ?? "");
  const [fullMatchJob, setFullMatchJob] = useState(null);
  const [contactedDriverIds, setContactedDriverIds] = useState(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [contactingDriver, setContactingDriver] = useState(null);
  const [filters, setFilters] = useState({
    search: "", region: "", license: "", certificate: "",
    segment: "", availability: "", experience: "",
  });

  const effectiveJobId = matchJobId === "__none__" ? null : matchJobId || forJobId || null;
  const jobsForMatch = hasApi ? apiJobs : mockJobs;
  const matchJob = useMemo(
    () => (effectiveJobId ? jobsForMatch.find((j) => j.id === effectiveJobId) || null : null),
    [effectiveJobId, jobsForMatch]
  );

  const driverQueryParams = useMemo(() => ({
    region: filters.region || undefined,
    license: filters.license || undefined,
    certificate: filters.certificate || undefined,
    segment: filters.segment || undefined,
    availability: filters.availability || undefined,
    experience: filters.experience || undefined,
  }), [filters.region, filters.license, filters.certificate, filters.segment, filters.availability, filters.experience]);

  useEffect(() => {
    if (!hasApi) return;
    setLoadingDrivers(true);
    setDriversError("");
    fetchDrivers(driverQueryParams)
      .then((data) => setApiDrivers(Array.isArray(data) ? data : []))
      .catch((err) => { setApiDrivers([]); setDriversError(err.message || "Kunde inte hämta förare."); })
      .finally(() => setLoadingDrivers(false));
    fetchMyJobs()
      .then((data) => setApiJobs(Array.isArray(data) ? data : []))
      .catch(() => setApiJobs([]));
  }, [hasApi, driverQueryParams]);

  useEffect(() => {
    if (!hasApi) return;
    fetchConversations()
      .then((convos) => setContactedDriverIds(new Set((convos || []).map((c) => c.driverId))))
      .catch(() => {});
  }, [hasApi]);

  useEffect(() => {
    if (!effectiveJobId) { setFullMatchJob(null); return; }
    fetchJob(effectiveJobId).then(setFullMatchJob).catch(() => setFullMatchJob(null));
  }, [effectiveJobId]);

  const currentUserAsDriver = useMemo(() => {
    if (hasApi) return null;
    if (!profile.visibleToCompanies) return null;
    const years = calcYearsExperience(profile.experience);
    return {
      id: profile.id, name: profile.name, location: profile.location, region: profile.region,
      regionsWilling: profile.regionsWilling || [profile.region],
      licenses: profile.licenses || [], certificates: profile.certificates || [],
      availability: profile.availability || "open", yearsExperience: years,
      primarySegment: profile.primarySegment || "", secondarySegments: profile.secondarySegments || [],
      summary: profile.summary, experience: profile.experience || [], visibleToCompanies: true,
    };
  }, [hasApi, profile]);

  const allDrivers = useMemo(() => {
    if (hasApi) return apiDrivers;
    const base = mockDrivers.map((d) => currentUserAsDriver && d.id === currentUserAsDriver.id ? currentUserAsDriver : d);
    if (currentUserAsDriver && !base.some((d) => d.id === currentUserAsDriver.id)) base.unshift(currentUserAsDriver);
    return base;
  }, [hasApi, apiDrivers, currentUserAsDriver]);

  const filteredDrivers = useMemo(() => {
    const searchLower = filters.search.toLowerCase();
    return allDrivers.filter((driver) => {
      const matchesSearch = !filters.search || driver.name.toLowerCase().includes(searchLower) || (driver.summary || "").toLowerCase().includes(searchLower) || (driver.regionsWilling || []).some((r) => r.toLowerCase().includes(searchLower));
      const matchesRegion = hasApi || !filters.region || driver.region === filters.region || (driver.regionsWilling || []).includes(filters.region);
      const matchesLicense = hasApi || !filters.license || (driver.licenses || []).includes(filters.license);
      const matchesCertificate = hasApi || !filters.certificate || (driver.certificates || []).includes(filters.certificate);
      const matchesSegment = hasApi || !filters.segment || driver.primarySegment === filters.segment || (driver.secondarySegments || []).includes(filters.segment);
      const matchesAvailability = hasApi || !filters.availability || driver.availability === filters.availability;
      const matchesExperience = (() => {
        if (hasApi || !filters.experience) return true;
        const y = driver.yearsExperience || 0;
        if (filters.experience === "10+") return y >= 10;
        if (filters.experience === "5+") return y >= 5;
        const [min, max] = filters.experience.split("-").map(Number);
        return y >= min && (max === undefined || Number.isNaN(max) || y <= max);
      })();
      return matchesSearch && matchesRegion && matchesLicense && matchesCertificate && matchesSegment && matchesAvailability && matchesExperience;
    });
  }, [allDrivers, filters, hasApi]);

  const sortedDrivers = useMemo(() => {
    if (!matchJob) return filteredDrivers.map((d) => ({ driver: d, score: 0, pct: null, details: null }));
    const matched = getMatchingDriversForJob(matchJob, filteredDrivers, 0, 999);
    const matchedIds = new Set(matched.map(({ driver }) => driver.id));
    const unmatched = filteredDrivers.filter((d) => !matchedIds.has(d.id)).map((d) => ({ driver: d, score: 0, pct: null, details: null }));
    return [...matched, ...unmatched];
  }, [matchJob, filteredDrivers]);

  const activeFilterCount = FILTER_KEYS.filter((k) => filters[k]).length;

  /* Selected driver data from sorted list */
  const selectedDriverData = useMemo(() => {
    if (!selectedDriver) return null;
    return sortedDrivers.find(({ driver }) => driver.id === selectedDriver.id) || null;
  }, [selectedDriver, sortedDrivers]);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: T.font }}>
      <div style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden" }}>

        {/* ── Slide-in filter drawer ── */}
        <FilterDrawer
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          filters={filters}
          setFilters={setFilters}
        />

        {/* ── Center — results ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px" }}>

          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2, color: T.text }}>
                Förare{filters.region ? ` i ${filters.region}` : ""}
              </h2>
              <p style={{ fontSize: 11, color: T.muted }}>
                {loadingDrivers ? "Hämtar…" : `${filteredDrivers.length} förare`}
                {matchJob && <> · matchning mot <strong style={{ color: T.sub }}>{forJobTitle || matchJob.title}</strong></>}
              </p>
            </div>
            <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
              {/* Job match selector */}
              <select
                value={effectiveJobId || "__none__"}
                onChange={(e) => setMatchJobId(e.target.value)}
                style={{
                  padding: "6px 10px", borderRadius: 7, background: T.card,
                  border: `1px solid ${matchJob ? "rgba(31,95,92,0.35)" : T.border}`,
                  color: matchJob ? "rgba(125,211,200,0.85)" : T.muted,
                  fontSize: 11, fontFamily: T.font, cursor: "pointer", outline: "none",
                }}
              >
                <option value="__none__">Visa alla</option>
                {jobsForMatch.filter((j) => !j.filledAt && j.status !== "REMOVED").map((j) => (
                  <option key={j.id} value={j.id}>{j.title}{j.location ? ` · ${j.location}` : ""}</option>
                ))}
              </select>
              {/* Filter toggle */}
              <button
                onClick={() => setFilterOpen((p) => !p)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 13px", borderRadius: 8,
                  cursor: "pointer", fontFamily: T.font, fontSize: 12, fontWeight: 500,
                  border: `1px solid ${filterOpen || activeFilterCount > 0 ? "rgba(31,95,92,0.35)" : T.border}`,
                  background: filterOpen || activeFilterCount > 0 ? T.pDim : T.card,
                  color: filterOpen || activeFilterCount > 0 ? "rgba(125,211,200,0.85)" : T.sub,
                  transition: "all .12s",
                }}
              >
                <svg width="13" height="10" viewBox="0 0 13 10" fill="none"><path d="M1 2h11M3 5.5h7M5 9h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                Filter
                {activeFilterCount > 0 && (
                  <span style={{ background: T.primary, color: "#fff", borderRadius: 8, fontSize: 10, fontWeight: 700, padding: "1px 5px" }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Job requirements banner */}
          {fullMatchJob && (
            <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 10, background: T.pDim, border: "1px solid rgba(31,95,92,0.2)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: T.muted, marginBottom: 8 }}>Jobbet kräver</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {fullMatchJob.region && <Tag c="muted" size={11}>📍 {fullMatchJob.region}</Tag>}
                {(fullMatchJob.license || []).map((l) => <Tag key={l} c="p" size={11}>{l}</Tag>)}
                {(fullMatchJob.certificates || []).map((c) => <Tag key={c} c="muted" size={11}>{getCertificateLabel(c)}</Tag>)}
                {fullMatchJob.experience && <Tag c="muted" size={11}>{experienceLevels.find((e) => e.value === fullMatchJob.experience)?.label ?? fullMatchJob.experience}</Tag>}
                {fullMatchJob.employment && <Tag c="amber" size={11}>{fullMatchJob.employment === "fast" ? "Fast" : fullMatchJob.employment === "vikariat" ? "Vikariat" : "Tim"}</Tag>}
              </div>
            </div>
          )}

          {/* Driver list */}
          {driversError ? (
            <div style={{ padding: 24, background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#f87171", marginBottom: 6 }}>Kunde inte hämta förare</p>
              <p style={{ fontSize: 13, color: T.muted }}>{driversError}</p>
            </div>
          ) : loadingDrivers ? (
            <DriverListSkeleton count={5} />
          ) : sortedDrivers.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {sortedDrivers.map(({ driver, pct }) => (
                <DarkDriverCard
                  key={driver.id}
                  driver={driver}
                  matchPct={matchJob && pct ? pct : null}
                  isSelected={selectedDriver?.id === driver.id}
                  onClick={() => setSelectedDriver(selectedDriver?.id === driver.id ? null : driver)}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <p style={{ fontSize: 13, color: T.muted, marginBottom: 8 }}>Inga förare matchar dina filter.</p>
              <p style={{ fontSize: 12, color: T.muted }}>Prova att bredda filtret — endast synliga profiler visas.</p>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters({ search: "", region: "", license: "", certificate: "", segment: "", availability: "", experience: "" })}
                  style={{ marginTop: 16, padding: "8px 18px", borderRadius: 8, border: "none", background: T.pDim, color: "rgba(125,211,200,0.85)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}
                >
                  Rensa filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Right — driver detail panel ── */}
        {selectedDriver && selectedDriverData && (
          <DriverDetailPanel
            driver={selectedDriver}
            matchPct={selectedDriverData.pct}
            matchCriteria={matchJob && selectedDriverData.score > 0 ? getMatchCriteria(selectedDriver, matchJob, selectedDriverData.details) : []}
            isContacted={contactedDriverIds.has(selectedDriver.id)}
            onClose={() => setSelectedDriver(null)}
            onContact={(driver) => setContactingDriver(driver)}
          />
        )}
      </div>

      {/* Contact modal */}
      {contactingDriver && (
        <ContactModal
          driver={contactingDriver}
          jobs={apiJobs.filter((j) => j.status === "ACTIVE" || j.status === "HIDDEN")}
          onClose={() => setContactingDriver(null)}
          onSent={(driverId) => {
            setContactedDriverIds((prev) => new Set([...prev, driverId]));
            setTimeout(() => setContactingDriver(null), 2000);
          }}
        />
      )}
    </div>
  );
}
