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
import { availabilityTypes, getCertificateLabel } from "../data/profileData";
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

/* ── Driver row ── */
function DriverRow({ driver, pct, onClick, isMobile }) {
  const [hover, setHover] = useState(false);
  const mc = pct != null ? matchColor(pct) : null;
  const color = driverColor(driver);
  const exp = driver.yearsExperience ?? calcYearsExperience(driver.experience);
  const segLabel = segmentOptions.find(s => s.value === driver.primarySegment)?.label || driver.primarySegment || "";

  return (
    <div
      onClick={onClick}
      onMouseEnter={isMobile ? undefined : () => setHover(true)}
      onMouseLeave={isMobile ? undefined : () => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: isMobile ? 13 : 18,
        padding: isMobile ? "14px 16px" : "18px 22px", background: hover ? "var(--paper-2)" : "var(--card)",
        border: `1px solid ${hover ? "var(--line-2)" : "var(--line)"}`,
        borderRadius: 14, cursor: "pointer", transition: "all .15s",
        boxShadow: "var(--sh-sm)",
      }}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: 99, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13.5, color: "#fff" }}>
          {initials(driver.name)}
        </div>
        <div style={{ position: "absolute", bottom: -1, right: -1, width: 12, height: 12, borderRadius: 99, background: availColor(driver.availability), border: "2.5px solid var(--card)" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.2, marginBottom: 3, color: "var(--ink-900)" }}>{driver.name}</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>
          {[driver.location, exp > 0 && `${exp} år`, segLabel].filter(Boolean).join(" · ")}
        </div>
      </div>
      {mc !== null && pct != null && (
        <div style={{ textAlign: "right", minWidth: 50, flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: mc, lineHeight: 1 }}>
            {pct}<span style={{ fontSize: 13 }}>%</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Filter sheet (right panel on desktop, bottom sheet on mobile) ── */
function FilterSheet({ open, filters, setFilters, onClose, isMobile }) {
  if (!open) return null;
  const toggle = (key, val) => setFilters(p => ({ ...p, [key]: p[key] === val ? "" : val }));

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 12 }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{children}</div>
    </div>
  );
  const Chip = ({ on, onClick, children }) => (
    <button onClick={onClick} style={{
      padding: "7px 14px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
      background: on ? "var(--green-tint)" : "var(--paper-2)",
      border: `1px solid ${on ? "var(--green-tint-2)" : "var(--line)"}`,
      color: on ? "var(--green-text)" : "var(--ink-700)",
      fontSize: 12.5, fontWeight: 600, transition: "all .15s",
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
        {["B", "C", "CE", "D"].map(l => (
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
            <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.4, color: "var(--ink-900)" }}>Filter</h3>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 99, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-700)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="x" size={16} /></button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
            {filterContent}
          </div>
          <div style={{ padding: "16px 20px 36px", display: "flex", gap: 10, borderTop: "1px solid var(--line)" }}>
            <button
              onClick={() => setFilters({ search: "", region: "", license: "", certificate: "", segment: "", availability: "", experience: "" })}
              style={{ flex: 1, padding: "14px", borderRadius: 99, background: "transparent", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            >Rensa</button>
            <button onClick={onClose} style={{ flex: 1.5, padding: "14px", borderRadius: 99, background: "var(--green)", border: "none", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Visa resultat</button>
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
          <h3 style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3, color: "var(--ink-900)" }}>Filter</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--ink-500)", cursor: "pointer", display: "flex" }}><Icon name="x" size={20} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {filterContent}
        </div>
        <div style={{ padding: "18px 24px", borderTop: "1px solid var(--line)", display: "flex", gap: 10 }}>
          <button
            onClick={() => setFilters({ search: "", region: "", license: "", certificate: "", segment: "", availability: "", experience: "" })}
            style={{ flex: 1, padding: "12px", borderRadius: 11, background: "transparent", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >Rensa</button>
          <button onClick={onClose} style={{ flex: 1.5, padding: "12px", borderRadius: 11, background: "var(--green)", border: "none", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Visa resultat</button>
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
              <div style={{ width: 64, height: 64, borderRadius: 99, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color: "#fff" }}>
                {initials(driver.name)}
              </div>
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 16, height: 16, borderRadius: 99, background: availColor(driver.availability), border: "3px solid var(--card)" }} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4, marginBottom: 4, color: "var(--ink-900)" }}>{driver.name}</h2>
              <div style={{ fontSize: 13, color: "var(--ink-500)" }}>
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
                <div style={{ fontSize: 18, fontWeight: 800, color: mc }}>{pct}<span style={{ fontSize: 11 }}>%</span></div>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: mc, marginBottom: 2 }}>{matchLabel}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-500)" }}>mot {matchJob.title}</div>
              </div>
            </div>
            {criteria && criteria.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {criteria.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
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
            <p style={{ fontSize: 13.5, color: "var(--ink-700)", lineHeight: 1.6 }}>{driver.summary}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: "20px 26px 24px", display: "flex", gap: 10 }}>
          <button
            onClick={() => { onClose(); onContact(driver); }}
            style={{ flex: 1, padding: "12px", borderRadius: 11, background: isContacted ? "var(--green-tint)" : "var(--green)", color: isContacted ? "var(--green-text)" : "#fff", fontSize: 13, fontWeight: 800, border: isContacted ? "1px solid var(--green-tint-2)" : "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: "inherit" }}
          >
            <Icon name="msg" size={14} /> {isContacted ? "Skicka igen" : "Skicka meddelande"}
          </button>
          <button
            onClick={() => navigate(`/foretag/chaufforer/${driver.id}`)}
            style={{ padding: "12px 16px", borderRadius: 11, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-900)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
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
          <p style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "var(--ink-900)" }}>Skickat!</p>
          <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 22, lineHeight: 1.6 }}>{firstName} får en notis och kan svara via chatten.</p>
          <button onClick={onClose} style={{ width: "100%", padding: 12, borderRadius: 11, border: "none", background: "var(--green)", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Stäng</button>
        </div>
      </div>
    );
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, color: "var(--ink-900)" }}>Skicka meddelande</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--ink-500)", cursor: "pointer", display: "flex" }}><Icon name="x" size={18} /></button>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginBottom: 18 }}>{firstName} ser ditt meddelande tillsammans med en länk till annonsen.</div>

        {jobs.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginBottom: 7, fontWeight: 600 }}>Annons</div>
            <div style={{ position: "relative" }}>
              <select
                value={selectedJobId}
                onChange={e => setSelectedJobId(e.target.value)}
                style={{ width: "100%", padding: "12px 40px 12px 14px", borderRadius: 10, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-900)", fontSize: 13, fontWeight: 600, cursor: "pointer", outline: "none", appearance: "none", fontFamily: "inherit" }}
              >
                <option value="">Inget specifikt jobb</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
              <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--ink-400)" }}><Icon name="chevDown" size={14} /></div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginBottom: 7, fontWeight: 600 }}>Meddelande</div>
          <textarea
            value={msg}
            onChange={e => setMsg(e.target.value)}
            rows={5}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-900)", fontSize: 13, lineHeight: 1.5, fontFamily: "inherit", resize: "none", outline: "none" }}
          />
        </div>
        {error && <p style={{ fontSize: 12, color: "var(--danger)", marginBottom: 10 }}>{error}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 11, background: "transparent", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Avbryt</button>
          <button onClick={handleSend} disabled={sending || !msg.trim()} style={{ flex: 1.5, padding: 12, borderRadius: 11, background: "var(--green)", border: "none", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: (sending || !msg.trim()) ? 0.5 : 1 }}>
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

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", color: "var(--ink-900)", fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 32 }}>
      <main style={{ maxWidth: 720, margin: "0 auto", padding: isMobile ? "24px 16px 120px" : "32px 32px 80px" }}>
        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1, marginBottom: 6, color: "var(--ink-900)" }}>Hitta förare</h1>
          <div style={{ fontSize: 14, color: "var(--ink-500)" }}>Sök bland förare som söker jobb just nu</div>
        </div>

        {/* Match against selector */}
        <div style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--ink-500)" }}>Sortera på match mot:</span>
          <div style={{ position: "relative" }}>
            <select
              value={matchJobId || ""}
              onChange={e => setMatchJobId(e.target.value || "")}
              style={{ padding: "5px 26px 5px 12px", borderRadius: 99, background: "var(--amber-tint)", border: "1px solid var(--amber-tint-2)", color: "var(--amber-text)", fontSize: 12, fontWeight: 700, cursor: "pointer", outline: "none", appearance: "none", fontFamily: "inherit" }}
            >
              <option value="">Ingen annons</option>
              {availableJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
            <div style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--amber-text)", fontSize: 9 }}>▼</div>
          </div>
        </div>

        {/* Search + filter bar */}
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)", display: "inline-flex" }}><Icon name="search" size={15} /></span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Sök på namn eller ort"
              style={{ width: "100%", padding: "14px 16px 14px 44px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, fontSize: 14, outline: "none", color: "var(--ink-900)", fontFamily: "inherit" }}
            />
          </div>
          <button
            onClick={() => setFiltersOpen(true)}
            style={{ position: "relative", padding: "0 18px", borderRadius: 12, background: "var(--card)", border: "1px solid var(--line)", color: "var(--ink-700)", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit" }}
          >
            <Icon name="filter" size={14} />
            Filter
            {activeFilterCount > 0 && (
              <span style={{ position: "absolute", bottom: 9, left: 18, right: 18, height: 2, borderRadius: 2, background: "var(--green)" }} />
            )}
          </button>
        </div>

        {/* Count */}
        <div style={{ fontSize: 12, color: "var(--ink-400)", marginBottom: 14, fontWeight: 600 }}>
          {loadingDrivers ? "Hämtar…" : `${sortedDrivers.length} förare`}
          {matchJob ? " · sorterat på match" : ""}
        </div>

        {/* Driver list */}
        {driversError ? (
          <div style={{ padding: 24, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)", borderRadius: 12 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--danger)", marginBottom: 6 }}>Kunde inte hämta förare</p>
            <p style={{ fontSize: 13, color: "var(--ink-500)" }}>{driversError}</p>
          </div>
        ) : loadingDrivers ? (
          <DriverListSkeleton count={5} />
        ) : sortedDrivers.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sortedDrivers.map(({ driver, pct }) => (
              <DriverRow
                key={driver.id}
                driver={driver}
                pct={matchJob ? pct : null}
                onClick={() => setSelectedDriverId(driver.id)}
                isMobile={isMobile}
              />
            ))}
          </div>
        ) : (
          <div style={{ padding: "60px 20px", textAlign: "center", background: "var(--paper-2)", border: "1px dashed var(--line-2)", borderRadius: 14 }}>
            <div style={{ fontSize: 14, color: "var(--ink-500)", marginBottom: 12 }}>Inga förare matchar dina filter</div>
            {(activeFilterCount > 0 || search) && (
              <button onClick={() => { setFilters({ ...EMPTY_FILTERS }); setSearch(""); }} style={{ padding: "9px 18px", borderRadius: 99, background: "var(--amber-tint)", border: "1px solid var(--amber-tint-2)", color: "var(--amber-text)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Rensa filter
              </button>
            )}
          </div>
        )}
      </main>

      <FilterSheet
        open={filtersOpen}
        filters={filters}
        setFilters={setFilters}
        onClose={() => setFiltersOpen(false)}
        isMobile={isMobile}
      />

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
