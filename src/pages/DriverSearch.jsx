import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsMobile } from "../hooks/useIsMobile";
import { useProfile } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import CompanyBottomNav from "../components/CompanyBottomNav";
import { calcYearsExperience } from "../utils/profileUtils";
import { getMatchCriteria, getMatchingDriversForJob } from "../utils/matchUtils";
import { DriverListSkeleton } from "../components/LoadingBlock";
import { fetchDrivers } from "../api/drivers.js";
import { fetchMyJobs, fetchJob } from "../api/jobs.js";
import { fetchConversations, createConversation } from "../api/conversations.js";
import { segmentOptions } from "../data/segments";
import { regions } from "../data/mockJobs";
import { availabilityTypes } from "../data/profileData";
import { mockDrivers } from "../data/mockDrivers";
import { mockJobs } from "../data/mockJobs";

/* ── Helpers ── */
function initials(name) {
  return (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function driverColor(driver) {
  const colors = ["var(--amber)", "#7dd3c8", "#a78bfa", "var(--success)", "var(--info)", "#fbbf24", "var(--danger)", "#34d399"];
  const hash = (driver.id || driver.name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function matchColor(pct) {
  if (pct >= 85) return "var(--success)";
  if (pct >= 70) return "var(--amber)";
  if (pct >= 55) return "var(--info)";
  return "var(--ink-300)";
}

function availColor(av) {
  return av === "open" ? "var(--success)" : "var(--amber)";
}

/* ── Icons ── */
function Icon({ name, size = 18 }) {
  const icons = {
    search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    filter: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/><circle cx="4" cy="12" r="1.5"/><circle cx="16" cy="6" r="1.5"/><circle cx="8" cy="18" r="1.5"/></svg>,
    x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    msg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    star: <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>,
    starOutline: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>,
    chevDown: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
    ext: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  };
  return <span style={{ display: "inline-flex", width: size, height: size, flexShrink: 0 }}>{icons[name]}</span>;
}

/* ── Driver card ── */
function DriverCard({ driver, pct, onClick }) {
  const [hover, setHover] = useState(false);
  const color = driverColor(driver);
  const exp = driver.yearsExperience ?? calcYearsExperience(driver.experience);
  const segLabel = segmentOptions.find(s => s.value === driver.primarySegment)?.label || driver.primarySegment || "";
  const isActive = driver.availability === "open";
  const mc = pct != null ? matchColor(pct) : null;

  return (
    <article
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "var(--card)", border: `1px solid ${hover ? "var(--line-2)" : "var(--line)"}`,
        borderRadius: "var(--r-lg)", padding: "18px 20px",
        boxShadow: hover ? "var(--sh)" : "var(--sh-sm)",
        transition: "box-shadow .15s, border-color .15s", cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ width: 46, height: 46, borderRadius: 99, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-base)", color: "#fff", flexShrink: 0 }}>
          {initials(driver.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 2 }}>
            <div>
              <div style={{ fontSize: "var(--text-md)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.2 }}>{driver.name}</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 2 }}>
                {[driver.location, exp > 0 && `${exp} års erfarenhet`].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>

          {/* Pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10, marginBottom: 12 }}>
            {(driver.licenses || []).slice(0, 2).map(l => (
              <span key={l} style={{ padding: "3px 9px", borderRadius: 6, background: "var(--green-tint)", border: "1px solid var(--green-tint-2)", color: "var(--green-text)", fontSize: "var(--text-2xs)", fontWeight: 700 }}>{l}</span>
            ))}
            {(driver.certificates || []).slice(0, 2).map(c => (
              <span key={c} style={{ padding: "3px 9px", borderRadius: 6, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-700)", fontSize: "var(--text-2xs)", fontWeight: 600 }}>{c.replace(/_/g, " ")}</span>
            ))}
            {segLabel && (
              <span style={{ padding: "3px 9px", borderRadius: 6, background: "var(--card-2)", border: "1px solid var(--line)", color: "var(--ink-500)", fontSize: "var(--text-2xs)", fontWeight: 600 }}>{segLabel}</span>
            )}
          </div>

          {/* Bottom bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: isActive ? "var(--success)" : "var(--amber)", display: "inline-block" }} />
              <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-700)", fontWeight: 600 }}>
                {isActive ? "Söker aktivt" : "Öppen för förslag"}
              </span>
            </div>
            {pct != null && mc && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: pct >= 85 ? "var(--success-tint)" : "var(--green-tint)" }}>
                <span style={{ fontSize: "var(--text-base)", fontWeight: 800, fontFamily: "var(--mono)", color: pct >= 85 ? "var(--success)" : "var(--green-text)" }}>{pct}%</span>
                <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: pct >= 85 ? "var(--success)" : "var(--green-text)" }}>match</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/* ── Inline FilterSelect ── */
function FilterSelect({ value, onChange, options, placeholder }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: "none", WebkitAppearance: "none",
          padding: "11px 32px 11px 14px",
          background: value ? "var(--green-tint)" : "var(--card)",
          border: `1px solid ${value ? "var(--green)" : "var(--line-2)"}`,
          borderRadius: 10, fontSize: "var(--text-sm)", fontWeight: value ? 700 : 500,
          color: value ? "var(--green-text)" : "var(--ink-900)",
          boxShadow: "var(--sh-sm)", cursor: "pointer", fontFamily: "var(--font)", outline: "none",
          minWidth: 120,
        }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: value ? "var(--green-text)" : "var(--ink-500)", display: "inline-flex" }}>
        <Icon name="chevDown" size={14} />
      </span>
    </div>
  );
}

/* ── Filter sheet (right panel on desktop, bottom sheet on mobile) ── */
function FilterSheet({ open, filters, setFilters, onClose, isMobile }) {
  if (!open) return null;
  const toggle = (key, val) => setFilters(p => ({ ...p, [key]: p[key] === val ? "" : val }));

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 12 }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{children}</div>
    </div>
  );
  const Chip = ({ on, onClick, children }) => (
    <button onClick={onClick} style={{
      padding: "7px 14px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
      background: on ? "var(--green-tint)" : "var(--paper-2)",
      border: `1px solid ${on ? "var(--green-tint-2)" : "var(--line)"}`,
      color: on ? "var(--green-text)" : "var(--ink-700)",
      fontSize: "var(--text-xs)", fontWeight: 600, transition: "all .15s",
      minHeight: 40,
    }}>{children}</button>
  );

  const filterContent = (
    <>
      <Section title="Tillgänglighet">
        {availabilityTypes.slice(0, 3).map(a => (
          <Chip key={a.value} on={filters.availability === a.value} onClick={() => toggle("availability", a.value)}>{a.label}</Chip>
        ))}
      </Section>
      <Section title="Körkort">
        {["C", "CE"].map(l => (
          <Chip key={l} on={filters.license === l} onClick={() => toggle("license", l)}>{l}</Chip>
        ))}
      </Section>
      <Section title="Segment">
        {segmentOptions.map(s => (
          <Chip key={s.value} on={filters.segment === s.value} onClick={() => toggle("segment", s.value)}>{s.label}</Chip>
        ))}
      </Section>
      <Section title="Region">
        {regions.slice(0, 9).map(r => (
          <Chip key={r} on={filters.region === r} onClick={() => toggle("region", r)}>{r}</Chip>
        ))}
      </Section>
      <Section title="Certifikat">
        {["YKB", "ADR", "ADR_Tank", "Kran", "Truck_B"].map(c => (
          <Chip key={c} on={filters.certificate === c} onClick={() => toggle("certificate", c)}>{c.replace(/_/g, " ")}</Chip>
        ))}
      </Section>
      <Section title="Minsta erfarenhet">
        {[["1-3", "1+ år"], ["3-5", "3+ år"], ["5-10", "5+ år"], ["10+", "10+ år"]].map(([val, label]) => (
          <Chip key={val} on={filters.experience === val} onClick={() => toggle("experience", val)}>{label}</Chip>
        ))}
      </Section>
    </>
  );

  if (isMobile) {
    return (
      <>
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 60 }} />
        <div style={{
          position: "fixed", left: 0, right: 0, bottom: 0,
          background: "var(--card)", borderTopLeftRadius: 24, borderTopRightRadius: 24,
          borderTop: "1px solid var(--line)",
          zIndex: 70, maxHeight: "80vh", display: "flex", flexDirection: "column",
          animation: "slideUp .25s ease",
        }}>
          <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 6px" }}>
            <div style={{ width: 38, height: 4, borderRadius: 99, background: "var(--line-2)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 20px 14px" }}>
            <h3 style={{ fontSize: "var(--text-xl)", fontWeight: 800, letterSpacing: -0.4, color: "var(--ink-900)" }}>Filter</h3>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 99, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-700)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="x" size={16} /></button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
            {filterContent}
          </div>
          <div style={{ padding: "16px 20px 36px", display: "flex", gap: 10, borderTop: "1px solid var(--line)" }}>
            <button
              onClick={() => setFilters({ search: "", region: "", license: "", certificate: "", segment: "", availability: "", experience: "" })}
              style={{ flex: 1, padding: "14px", borderRadius: 99, background: "transparent", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontSize: "var(--text-base)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >Rensa</button>
            <button onClick={onClose} style={{ flex: 1.5, padding: "14px", borderRadius: 99, background: "var(--green)", border: "none", color: "#fff", fontSize: "var(--text-base)", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Visa resultat</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 60 }} />
      <div style={{ position: "fixed", top: 0, right: 0, height: "100vh", width: 380, maxWidth: "100vw", background: "var(--card)", borderLeft: "1px solid var(--line)", zIndex: 70, display: "flex", flexDirection: "column", boxShadow: "var(--sh-md)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 24px", borderBottom: "1px solid var(--line)" }}>
          <h3 style={{ fontSize: "var(--text-xl)", fontWeight: 800, letterSpacing: -0.3, color: "var(--ink-900)" }}>Filter</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--ink-500)", cursor: "pointer", display: "flex" }}><Icon name="x" size={20} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {filterContent}
        </div>
        <div style={{ padding: "18px 24px", borderTop: "1px solid var(--line)", display: "flex", gap: 10 }}>
          <button
            onClick={() => setFilters({ search: "", region: "", license: "", certificate: "", segment: "", availability: "", experience: "" })}
            style={{ flex: 1, padding: "12px", borderRadius: 11, background: "transparent", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontSize: "var(--text-sm)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >Rensa</button>
          <button onClick={onClose} style={{ flex: 1.5, padding: "12px", borderRadius: 11, background: "var(--green)", border: "none", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Visa resultat</button>
        </div>
      </div>
    </>
  );
}

/* ── Detail modal ── */
function DetailModal({ driver, pct, matchJob, criteria, isContacted, onClose, onContact, navigate }) {
  if (!driver) return null;
  const mc = pct != null ? matchColor(pct) : null;
  const matchLabel = pct >= 85 ? "Stark match" : pct >= 70 ? "Bra match" : pct >= 55 ? "Delvis match" : "Svag match";
  const color = driverColor(driver);
  const exp = driver.yearsExperience ?? calcYearsExperience(driver.experience);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 70 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 460, maxWidth: "calc(100vw - 40px)", maxHeight: "calc(100vh - 80px)", overflowY: "auto",
        background: "var(--card)", border: "1px solid var(--line)", borderRadius: 18, zIndex: 80,
        boxShadow: "var(--sh-md)",
      }}>
        {/* Header */}
        <div style={{ padding: "24px 26px 20px", borderBottom: "1px solid var(--line)", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 18, right: 18, width: 30, height: 30, borderRadius: 99, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-500)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="x" size={15} />
          </button>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 64, height: 64, borderRadius: 99, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-xl)", color: "#fff" }}>
                {initials(driver.name)}
              </div>
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 16, height: 16, borderRadius: 99, background: availColor(driver.availability), border: "3px solid var(--card)" }} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, letterSpacing: -0.4, marginBottom: 4, color: "var(--ink-900)" }}>{driver.name}</h2>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)" }}>
                {[driver.location, exp > 0 && `${exp} år`, segmentOptions.find(s => s.value === driver.primarySegment)?.label].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>
        </div>

        {/* Match section */}
        {pct != null && matchJob && (
          <div style={{ padding: "20px 26px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: 99, background: "var(--paper-2)", border: `2px solid var(--line-2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: mc }}>{pct}<span style={{ fontSize: "var(--text-2xs)" }}>%</span></div>
              </div>
              <div>
                <div style={{ fontSize: "var(--text-base)", fontWeight: 800, color: mc, marginBottom: 2 }}>{matchLabel}</div>
                <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)" }}>mot {matchJob.title}</div>
              </div>
            </div>
            {criteria && criteria.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {criteria.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "var(--text-sm)" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 99, background: c.met ? "var(--success-tint)" : "var(--danger-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {c.met
                        ? <Icon name="check" size={10} />
                        : <Icon name="x" size={10} />}
                    </div>
                    <span style={{ color: c.met ? "var(--ink-900)" : "var(--ink-400)" }}>{c.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        {driver.summary && (
          <div style={{ padding: "20px 26px", borderBottom: "1px solid var(--line)" }}>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-700)", lineHeight: 1.6 }}>{driver.summary}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: "20px 26px 24px", display: "flex", gap: 10 }}>
          <button
            onClick={() => { onClose(); onContact(driver); }}
            style={{ flex: 1, padding: "12px", borderRadius: 11, background: isContacted ? "var(--green-tint)" : "var(--green)", color: isContacted ? "var(--green-text)" : "#fff", fontSize: "var(--text-sm)", fontWeight: 800, border: isContacted ? "1px solid var(--green-tint-2)" : "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: "inherit" }}
          >
            <Icon name="msg" size={14} /> {isContacted ? "Skicka igen" : "Skicka meddelande"}
          </button>
          <button
            onClick={() => navigate(`/foretag/chaufforer/${driver.id}`)}
            style={{ padding: "12px 16px", borderRadius: 11, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-900)", fontSize: "var(--text-sm)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >Hela profilen</button>
        </div>
      </div>
    </>
  );
}

/* ── Contact modal ── */
function ContactModal({ driver, jobs, onClose, onSent }) {
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || "");
  const selectedJob = jobs.find(j => j.id === selectedJobId);
  const firstName = (driver.name || "").split(" ")[0];
  const jobTitle = selectedJob?.title || "en tjänst";
  const [msg, setMsg] = useState(`Hej ${firstName}!\n\nVi söker en ${(driver.licenses || []).includes("CE") ? "CE-förare" : "förare"} och din profil verkar passa bra för ${jobTitle}. Är du intresserad av att höra mer?\n\nMed vänlig hälsning`);
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

  const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 };
  const modal = { background: "var(--card)", border: "1px solid var(--line)", borderRadius: 18, padding: 24, maxWidth: 480, width: "90%", maxHeight: "calc(100vh-80px)", overflowY: "auto", boxShadow: "var(--sh-md)" };

  if (sent) {
    return (
      <div style={overlay}>
        <div style={{ ...modal, textAlign: "center", maxWidth: 380 }}>
          <div style={{ width: 52, height: 52, borderRadius: 99, background: "var(--success-tint)", border: "1.5px solid var(--success)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "var(--success)" }}>
            <Icon name="check" size={22} />
          </div>
          <p style={{ fontSize: "var(--text-xl)", fontWeight: 800, marginBottom: 8, color: "var(--ink-900)" }}>Skickat!</p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginBottom: 22, lineHeight: 1.6 }}>{firstName} får en notis och kan svara via chatten.</p>
          <button onClick={onClose} style={{ width: "100%", padding: 12, borderRadius: 11, border: "none", background: "var(--green)", color: "#fff", fontSize: "var(--text-base)", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Stäng</button>
        </div>
      </div>
    );
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h3 style={{ fontSize: "var(--text-xl)", fontWeight: 800, letterSpacing: -0.3, color: "var(--ink-900)" }}>Skicka meddelande</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--ink-500)", cursor: "pointer", display: "flex" }}><Icon name="x" size={18} /></button>
        </div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginBottom: 18 }}>{firstName} ser ditt meddelande tillsammans med en länk till annonsen.</div>

        {jobs.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", marginBottom: 7, fontWeight: 600 }}>Annons</div>
            <div style={{ position: "relative" }}>
              <select
                value={selectedJobId}
                onChange={e => setSelectedJobId(e.target.value)}
                style={{ width: "100%", padding: "12px 40px 12px 14px", borderRadius: 10, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-900)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", outline: "none", appearance: "none", fontFamily: "inherit" }}
              >
                <option value="">Inget specifikt jobb</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
              <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--ink-400)" }}><Icon name="chevDown" size={14} /></div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", marginBottom: 7, fontWeight: 600 }}>Meddelande</div>
          <textarea
            value={msg}
            onChange={e => setMsg(e.target.value)}
            rows={5}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-900)", fontSize: "var(--text-sm)", lineHeight: 1.5, fontFamily: "inherit", resize: "none", outline: "none" }}
          />
        </div>
        {error && <p style={{ fontSize: "var(--text-xs)", color: "var(--danger)", marginBottom: 10 }}>{error}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 11, background: "transparent", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontSize: "var(--text-sm)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Avbryt</button>
          <button onClick={handleSend} disabled={sending || !msg.trim()} style={{ flex: 1.5, padding: 12, borderRadius: 11, background: "var(--green)", border: "none", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: (sending || !msg.trim()) ? 0.5 : 1 }}>
            {sending ? "Skickar…" : "Skicka meddelande"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════ MAIN ══════════ */
const EMPTY_FILTERS = { search: "", region: "", license: "", certificate: "", segment: "", availability: "", experience: "" };

export default function DriverSearch() {
  const isMobile = useIsMobile();
  const { hasApi } = useAuth();
  const { profile } = useProfile();
  const { state: locationState } = useLocation();
  const navigate = useNavigate();
  const forJobId = locationState?.forJobId;

  const [apiDrivers, setApiDrivers] = useState([]);
  const [apiJobs, setApiJobs] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [driversError, setDriversError] = useState("");
  const [matchJobId, setMatchJobId] = useState(forJobId ?? "");
  const [fullMatchJob, setFullMatchJob] = useState(null);
  const [contactedDriverIds, setContactedDriverIds] = useState(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [contactingDriver, setContactingDriver] = useState(null);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [search, setSearch] = useState("");

  const effectiveJobId = matchJobId === "__none__" ? null : matchJobId || null;
  const jobsForMatch = hasApi ? apiJobs : mockJobs;
  const matchJob = useMemo(
    () => effectiveJobId ? jobsForMatch.find(j => j.id === effectiveJobId) || null : null,
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
      .then(data => setApiDrivers(Array.isArray(data) ? data : []))
      .catch(err => { setApiDrivers([]); setDriversError(err.message || "Kunde inte hämta förare."); })
      .finally(() => setLoadingDrivers(false));
    fetchMyJobs()
      .then(data => setApiJobs(Array.isArray(data) ? data : []))
      .catch(() => setApiJobs([]));
  }, [hasApi, driverQueryParams]);

  useEffect(() => {
    if (!hasApi) return;
    fetchConversations()
      .then(convos => setContactedDriverIds(new Set((convos || []).map(c => c.driverId))))
      .catch(() => {});
  }, [hasApi]);

  useEffect(() => {
    if (!effectiveJobId) { setFullMatchJob(null); return; }
    fetchJob(effectiveJobId).then(setFullMatchJob).catch(() => setFullMatchJob(null));
  }, [effectiveJobId]);

  const currentUserAsDriver = useMemo(() => {
    if (hasApi || !profile.visibleToCompanies) return null;
    return { id: profile.id, name: profile.name, location: profile.location, region: profile.region, regionsWilling: profile.regionsWilling || [profile.region], licenses: profile.licenses || [], certificates: profile.certificates || [], availability: profile.availability || "open", yearsExperience: calcYearsExperience(profile.experience), primarySegment: profile.primarySegment || "", summary: profile.summary, experience: profile.experience || [], visibleToCompanies: true };
  }, [hasApi, profile]);

  const allDrivers = useMemo(() => {
    if (hasApi) return apiDrivers;
    const base = [...mockDrivers];
    if (currentUserAsDriver && !base.some(d => d.id === currentUserAsDriver.id)) base.unshift(currentUserAsDriver);
    return base;
  }, [hasApi, apiDrivers, currentUserAsDriver]);

  const filteredDrivers = useMemo(() => {
    const q = search.toLowerCase();
    return allDrivers.filter(driver => {
      if (q && !driver.name.toLowerCase().includes(q) && !(driver.location || "").toLowerCase().includes(q)) return false;
      if (!hasApi) {
        if (filters.region && driver.region !== filters.region && !(driver.regionsWilling || []).includes(filters.region)) return false;
        if (filters.license && !(driver.licenses || []).includes(filters.license)) return false;
        if (filters.certificate && !(driver.certificates || []).includes(filters.certificate)) return false;
        if (filters.segment && driver.primarySegment !== filters.segment) return false;
        if (filters.availability && driver.availability !== filters.availability) return false;
      }
      return true;
    });
  }, [allDrivers, search, filters, hasApi]);

  const sortedDrivers = useMemo(() => {
    if (!matchJob) return filteredDrivers.map(d => ({ driver: d, pct: null, details: null }));
    const matched = getMatchingDriversForJob(matchJob, filteredDrivers, 0, 999);
    const matchedIds = new Set(matched.map(({ driver }) => driver.id));
    const unmatched = filteredDrivers.filter(d => !matchedIds.has(d.id)).map(d => ({ driver: d, pct: null, details: null }));
    return [...matched, ...unmatched];
  }, [matchJob, filteredDrivers]);

  const selectedEntry = useMemo(() => selectedDriverId ? sortedDrivers.find(({ driver }) => driver.id === selectedDriverId) : null, [selectedDriverId, sortedDrivers]);

  const activeCriteria = useMemo(() => {
    if (!selectedEntry || !fullMatchJob || !selectedEntry.pct) return [];
    return getMatchCriteria(selectedEntry.driver, fullMatchJob, selectedEntry.details) || [];
  }, [selectedEntry, fullMatchJob]);

  const activeFilterCount = Object.values(filters).filter(v => v).length;

  const availableJobs = (hasApi ? apiJobs : mockJobs).filter(j => j.status !== "REMOVED");

  const [view, setView] = useState("list");

  const activeChips = [];
  if (filters.license)  activeChips.push({ key: "license",  label: filters.license + "-körkort" });
  if (filters.segment)  activeChips.push({ key: "segment",  label: segmentOptions.find(s => s.value === filters.segment)?.label || filters.segment });
  if (filters.region)   activeChips.push({ key: "region",   label: filters.region });

  const licenseOptions = ["C", "CE"];
  const segmentFilterOptions = segmentOptions.map(s => s.label);
  const regionOptions = regions.slice(0, 9);

  function setFilterKey(key, val) {
    if (key === "segment") {
      const sv = segmentOptions.find(s => s.label === val)?.value || val;
      setFilters(f => ({ ...f, segment: sv }));
    } else {
      setFilters(f => ({ ...f, [key]: val }));
    }
  }
  function clearFilterKey(key) { setFilters(f => ({ ...f, [key]: "" })); }

  const segmentLabelValue = filters.segment ? (segmentOptions.find(s => s.value === filters.segment)?.label || filters.segment) : "";

  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--paper)", color: "var(--ink-900)", paddingTop: 56, paddingBottom: 80 }}>
        <div style={{ padding: "20px 20px 0" }}>
          <p style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 6 }}>För åkerier</p>
          <h1 style={{ fontSize: "var(--text-4xl)", fontWeight: 900, letterSpacing: -1, marginBottom: 4, color: "var(--ink-900)" }}>Hitta förare</h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginBottom: 20 }}>{sortedDrivers.length} tillgängliga förare</p>
        </div>
        <div style={{ padding: "0 20px 14px", display: "flex", gap: 10 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)", display: "inline-flex" }}><Icon name="search" size={15} /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sök namn, ort, kompetens..." style={{ width: "100%", padding: "12px 14px 12px 40px", background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 10, fontSize: "var(--text-base)", outline: "none", color: "var(--ink-900)", fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>
          <button onClick={() => setFiltersOpen(true)} style={{ padding: "0 16px", borderRadius: 10, background: activeFilterCount > 0 ? "var(--green-tint)" : "var(--card)", border: `1px solid ${activeFilterCount > 0 ? "var(--green)" : "var(--line-2)"}`, color: activeFilterCount > 0 ? "var(--green-text)" : "var(--ink-700)", fontSize: "var(--text-sm)", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: "inherit", whiteSpace: "nowrap" }}>
            <Icon name="filter" size={14} /> Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
        </div>
        <div style={{ padding: "0 20px 80px" }}>
          {loadingDrivers ? <DriverListSkeleton count={4} /> : sortedDrivers.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", background: "var(--paper-2)", border: "1px dashed var(--line-2)", borderRadius: 14 }}>
              <div style={{ fontSize: "var(--text-base)", color: "var(--ink-500)" }}>Inga förare matchar filtren</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sortedDrivers.map(({ driver, pct }) => (
                <DriverCard key={driver.id} driver={driver} pct={matchJob ? pct : null} onClick={() => setSelectedDriverId(driver.id)} />
              ))}
            </div>
          )}
        </div>
        <FilterSheet open={filtersOpen} filters={filters} setFilters={setFilters} onClose={() => setFiltersOpen(false)} isMobile={true} />
        <CompanyBottomNav />
        {selectedEntry && (
          <DetailModal driver={selectedEntry.driver} pct={selectedEntry.pct} matchJob={fullMatchJob} criteria={activeCriteria} isContacted={contactedDriverIds.has(selectedEntry.driver.id)} onClose={() => setSelectedDriverId(null)} onContact={d => setContactingDriver(d)} navigate={navigate} />
        )}
        {contactingDriver && (
          <ContactModal driver={contactingDriver} jobs={apiJobs.filter(j => j.status === "ACTIVE" || j.status === "HIDDEN")} onClose={() => setContactingDriver(null)} onSent={driverId => { setContactedDriverIds(prev => new Set([...prev, driverId])); setTimeout(() => setContactingDriver(null), 2000); }} />
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", color: "var(--ink-900)" }}>

      {/* Page header */}
      <div style={{ background: "var(--paper)", borderBottom: "1px solid var(--line)", paddingTop: 32, paddingBottom: 18 }}>
        <div style={{ maxWidth: "var(--w-app)", margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 10 }}>För åkerier</p>
              <h1 style={{ fontSize: "var(--text-5xl)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1.2, lineHeight: 1.15, marginBottom: 6 }}>Hitta förare</h1>
              <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", fontWeight: 500 }}>
                {loadingDrivers ? "Hämtar…" : `${sortedDrivers.length} tillgängliga förare`} · Matchade mot era annonser
              </p>
            </div>
            <div style={{ display: "flex", padding: 4, gap: 3, background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 10, boxShadow: "var(--sh-sm)" }}>
              {[["list", "Lista"], ["map", "Karta"]].map(([k, label]) => (
                <button key={k} onClick={() => setView(k)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 7, background: view === k ? "var(--green)" : "transparent", color: view === k ? "#fff" : "var(--ink-700)", fontSize: "var(--text-sm)", fontWeight: 600, transition: "all .12s", cursor: "pointer", border: "none", fontFamily: "inherit" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main style={{ maxWidth: "var(--w-app)", margin: "0 auto", padding: "0 32px 80px" }}>
        {view === "map" ? (
          <div style={{ paddingTop: 24 }}>
            <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", marginBottom: 20, fontWeight: 500, maxWidth: 600 }}>
              Visa förare per region — klicka för att filtrera listan.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
              <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 24, boxShadow: "var(--sh-sm)" }}>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 16 }}>Välj region</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  {regionOptions.map(r => (
                    <button key={r} onClick={() => { setFilterKey("region", r); setView("list"); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderRadius: 10, background: "var(--card-2)", border: `1px solid ${filters.region === r ? "var(--green)" : "var(--line)"}`, color: "var(--ink-900)", cursor: "pointer", fontFamily: "inherit", transition: "all .12s" }}>
                      <span style={{ fontSize: "var(--text-base)", fontWeight: 700 }}>{r}</span>
                      <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", fontWeight: 600 }}>Visa förare →</span>
                    </button>
                  ))}
                </div>
              </div>
              <aside style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 20, boxShadow: "var(--sh-sm)" }}>
                  <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 12 }}>Era öppna annonser</div>
                  {availableJobs.slice(0, 4).map(j => (
                    <div key={j.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-900)", fontWeight: 600 }}>{j.title}</span>
                      <span style={{ padding: "3px 8px", borderRadius: 6, background: "var(--paper-2)", border: "1px solid var(--line)", fontSize: "var(--text-2xs)", color: "var(--ink-500)", fontWeight: 600 }}>Hitta match</span>
                    </div>
                  ))}
                  {availableJobs.length === 0 && <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-400)", padding: "10px 0" }}>Inga aktiva annonser</div>}
                </div>
              </aside>
            </div>
          </div>
        ) : (
          <>
            {/* Filter bar */}
            <div style={{ paddingTop: 22, paddingBottom: 14 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 440 }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)", display: "inline-flex" }}>
                    <Icon name="search" size={16} />
                  </span>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Sök namn, ort, kompetens..."
                    style={{ width: "100%", padding: "11px 16px 11px 42px", background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 10, fontSize: "var(--text-base)", color: "var(--ink-900)", outline: "none", boxShadow: "var(--sh-sm)", fontFamily: "var(--font)", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 8 }} />
                <FilterSelect value={filters.license} onChange={v => setFilterKey("license", v)} options={licenseOptions} placeholder="Körkort" />
                <FilterSelect value={segmentLabelValue} onChange={v => setFilterKey("segment", v)} options={segmentFilterOptions} placeholder="Segment" />
                <FilterSelect value={filters.region} onChange={v => setFilterKey("region", v)} options={regionOptions} placeholder="Region" />
              </div>
              {activeChips.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                  <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--ink-500)", letterSpacing: 1.2, textTransform: "uppercase" }}>Aktiva filter</span>
                  {activeChips.map(c => (
                    <span key={c.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px 4px 12px", borderRadius: 99, background: "var(--green-tint)", border: "1px solid var(--green-tint-2)", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--green-text)" }}>
                      {c.label}
                      <button onClick={() => clearFilterKey(c.key)} style={{ display: "inline-flex", alignItems: "center", background: "none", border: "none", color: "var(--green-text)", cursor: "pointer", padding: 0 }}>
                        <Icon name="x" size={12} />
                      </button>
                    </span>
                  ))}
                  <button onClick={() => setFilters({ ...EMPTY_FILTERS })} style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--green)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Rensa alla</button>
                </div>
              )}
            </div>

            <div className="find-grid">
              <div className="stp-fade-up">
                <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", fontWeight: 600, marginBottom: 14 }}>
                  {loadingDrivers ? "Hämtar…" : `${sortedDrivers.length} förare${filters.region ? ` i ${filters.region}` : " matchar"}`}
                  {matchJob ? " · sorterat på match" : ""}
                </div>
                {driversError ? (
                  <div style={{ padding: 24, background: "var(--danger-tint)", border: "1px solid rgba(185,28,59,0.2)", borderRadius: 12 }}>
                    <p style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--danger)", marginBottom: 4 }}>Kunde inte hämta förare</p>
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)" }}>{driversError}</p>
                  </div>
                ) : loadingDrivers ? (
                  <DriverListSkeleton count={6} />
                ) : sortedDrivers.length === 0 ? (
                  <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "56px 32px", textAlign: "center", boxShadow: "var(--sh-sm)" }}>
                    <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 6 }}>Inga förare matchar filtren</h3>
                    <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", marginBottom: 18 }}>Prova bredare filter eller kolla kartan för var förarna finns.</p>
                    <button onClick={() => { setFilters({ ...EMPTY_FILTERS }); setSearch(""); }} style={{ padding: "9px 18px", borderRadius: 10, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-700)", fontSize: "var(--text-sm)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Rensa filter</button>
                  </div>
                ) : (
                  <div className="driver-grid">
                    {sortedDrivers.map(({ driver, pct }) => (
                      <DriverCard key={driver.id} driver={driver} pct={matchJob ? pct : null} onClick={() => setSelectedDriverId(driver.id)} />
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <aside style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 20, boxShadow: "var(--sh-sm)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span style={{ width: 36, height: 36, borderRadius: 9, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name="search" size={17} />
                    </span>
                    <div>
                      <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 4 }}>Var finns förarna?</div>
                      <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.55, marginBottom: 12 }}>
                        Se förare per region för att förstå var det finns flest talanger.
                      </p>
                      <button onClick={() => setView("map")} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 9, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-700)", fontSize: "var(--text-sm)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", width: "100%", justifyContent: "center" }}>
                        Öppna regionvy
                      </button>
                    </div>
                  </div>
                </div>

                {availableJobs.length > 0 && (
                  <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 20, boxShadow: "var(--sh-sm)" }}>
                    <div style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 14, letterSpacing: -0.3 }}>Era öppna annonser</div>
                    {availableJobs.slice(0, 4).map(j => {
                      const isSelected = matchJobId === j.id;
                      return (
                        <div key={j.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                          <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-900)", fontWeight: 600 }}>{j.title}</span>
                          <button onClick={() => setMatchJobId(isSelected ? "" : j.id)} style={{ padding: "3px 10px", borderRadius: 6, background: isSelected ? "var(--green-tint)" : "var(--paper-2)", border: `1px solid ${isSelected ? "var(--green)" : "var(--line)"}`, color: isSelected ? "var(--green-text)" : "var(--ink-500)", fontSize: "var(--text-2xs)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                            {isSelected ? "✓ Matchar" : "Matcha"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </aside>
            </div>
          </>
        )}
      </main>

      <FilterSheet open={filtersOpen} filters={filters} setFilters={setFilters} onClose={() => setFiltersOpen(false)} isMobile={false} />

      {isMobile && <CompanyBottomNav />}

      {selectedEntry && (
        <DetailModal
          driver={selectedEntry.driver}
          pct={selectedEntry.pct}
          matchJob={fullMatchJob}
          criteria={activeCriteria}
          isContacted={contactedDriverIds.has(selectedEntry.driver.id)}
          onClose={() => setSelectedDriverId(null)}
          onContact={d => setContactingDriver(d)}
          navigate={navigate}
        />
      )}

      {contactingDriver && (
        <ContactModal
          driver={contactingDriver}
          jobs={apiJobs.filter(j => j.status === "ACTIVE" || j.status === "HIDDEN")}
          onClose={() => setContactingDriver(null)}
          onSent={driverId => {
            setContactedDriverIds(prev => new Set([...prev, driverId]));
            setTimeout(() => setContactingDriver(null), 2000);
          }}
        />
      )}
    </div>
  );
}
