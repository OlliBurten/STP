/**
 * DriverProfileView — delad profilvy för förare
 *
 * Props:
 *   profile  - DriverProfile-data från API
 *   owner    - User-objekt (ägaren av profilen)
 *   mode     - "self" | "company" | "public"
 *   job      - (company mode) det jobb att matcha mot — valfritt
 *   onSave   - (self mode) callback när profil sparats
 *   onEdit   - (self mode) callback för att starta redigering
 *   reviews  - array med DriverReview-objekt
 *   // self-mode extras:
 *   editing       - om redigering pågår
 *   displayScore  - profilstyrka 0-100
 *   driverMarket  - marknadsdata från /api/stats/driver-market
 *   profileStats  - profilstatistik (visningar etc)
 *   linkCopied    - om profillänken kopierats
 *   onCopyLink    - callback för kopiera länk
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { getCertificateLabel } from "../data/profileData";
import { calcYearsExperience } from "../utils/profileUtils";
import { matchScore, getMatchCriteria } from "../utils/matchUtils";
import { availabilityTypes } from "../data/profileData";
import ReachOutModal from "./ReachOutModal";
import { track } from "../utils/posthog";
import { submitDriverReview } from "../api/drivers.js";

/* ── cert expiry helper (same logic as Profile.jsx) ── */
function expiryStatus(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)   return { c: "red",   color: "var(--danger)", label: "Utgånget",                               days: diffDays };
  if (diffDays < 90)  return { c: "red",   color: "var(--danger)", label: `${diffDays} dagar kvar`,                 days: diffDays };
  if (diffDays < 180) return { c: "amber", color: "var(--amber)",  label: `${Math.ceil(diffDays/30)} månader kvar`, days: diffDays };
  return { c: "green", color: "var(--success)", label: `Gäller t.o.m. ${dateStr}`, days: diffDays };
}

function driverColor(id) {
  const colors = ["var(--amber)","#1F5F5C","var(--info)","#a78bfa","#f472b6","#34d399"];
  let h = 0;
  for (let i = 0; i < (id||"x").length; i++) h = (h * 31 + (id||"x").charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
}

function matchColor(pct) {
  if (pct >= 85) return "var(--success)";
  if (pct >= 70) return "var(--amber)";
  if (pct >= 55) return "var(--info)";
  return "var(--ink-400)";
}

function matchLabel(pct) {
  if (pct >= 85) return "Stark match";
  if (pct >= 70) return "Bra match";
  if (pct >= 55) return "Delvis match";
  return "Svag match";
}

/* ── icon helpers ── */
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 10, height: 10 }}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const StarFilled = () => (
  <svg viewBox="0 0 24 24" fill="var(--amber)" style={{ width: 14, height: 14 }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
  </svg>
);
const StarEmpty = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="var(--ink-300)" strokeWidth="2" style={{ width: 14, height: 14 }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
  </svg>
);
const MsgIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const ChevDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const SparkIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 13, height: 13 }}>
    <path d="M12 2L13.5 8.5 20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z" />
  </svg>
);

/* ── Review stars ── */
function Stars({ rating }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1,2,3,4,5].map((i) => i <= rating ? <StarFilled key={i} /> : <StarEmpty key={i} />)}
    </span>
  );
}

/* ── Profile strength score ── */
function calcProfileStrength(profile) {
  let score = 0;
  if (profile?.name) score += 10;
  if (profile?.location && profile?.region) score += 10;
  if ((profile?.licenses || []).length > 0) score += 15;
  if ((profile?.certificates || []).length > 0) score += 15;
  if ((profile?.experience || []).length > 0) score += 15;
  if ((profile?.summary || "").length >= 20) score += 20;
  if (profile?.phone) score += 10;
  if (profile?.visibleToCompanies) score += 5;
  return score;
}

/* ── Formattera år range ── */
function formatYearRange(exp) {
  if (exp.current) return `${exp.startYear || "?"} – nu`;
  return `${exp.startYear || "?"} – ${exp.endYear || "?"}`;
}

const EXP_VEHICLE_TYPES = [
  { value: "ce_lastbil", label: "CE Lastbil" }, { value: "c_lastbil", label: "C Lastbil" },
  { value: "tankbil", label: "Tankbil" }, { value: "kylbil", label: "Kylbil" },
  { value: "containerbil", label: "Container" }, { value: "skåpbil", label: "Skåp/budbil" },
  { value: "kranbil", label: "Kranbil" }, { value: "timmerbil", label: "Timmerbil" },
  { value: "betongbil", label: "Betongbil" },
];
const EXP_JOB_TYPES = [
  { value: "farjkorning", label: "Fjärrkörning" }, { value: "distribution", label: "Distribution" },
  { value: "lokalt", label: "Lokalkörning" }, { value: "tim", label: "Timkörning" },
  { value: "natt", label: "Nattransport" },
];

/* ── Reviews section ── */
function ReviewsSection({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div style={{ padding: "18px 20px", border: "1.5px dashed var(--line-2)", borderRadius: 12, textAlign: "center", color: "var(--ink-400)", fontSize: 13, lineHeight: 1.6 }}>
        Inga omdömen ännu — åkerier du jobbat hos kan lämna ett omdöme.
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {reviews.map((r) => (
        <div key={r.id} style={{ background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Stars rating={r.rating} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-900)" }}>{r.authorName}</span>
              {r.isVerified && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, background: "var(--success-tint)", color: "var(--success)", fontSize: 11, fontWeight: 700, border: "1px solid var(--success)" }}>
                  <CheckIcon /> Verifierat åkeri
                </span>
              )}
            </div>
            <span style={{ fontSize: 12, color: "var(--ink-400)" }}>
              {new Date(r.createdAt).toLocaleDateString("sv-SE", { year: "numeric", month: "long" })}
            </span>
          </div>
          {r.comment && <p style={{ fontSize: 14, color: "var(--ink-700)", lineHeight: 1.65, margin: 0 }}>{r.comment}</p>}
        </div>
      ))}
    </div>
  );
}

/* ── Review modal — åkeri recenserar förare ── */
function ReviewModal({ driverId, driverName, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!rating) { setError("Välj ett betyg för att fortsätta."); return; }
    setLoading(true); setError("");
    try {
      const review = await submitDriverReview(driverId, { rating, comment: comment.trim() || null });
      setDone(true);
      onSubmitted?.(review);
    } catch (e) {
      setError(e.message || "Något gick fel. Försök igen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,26,25,0.55)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 440, background: "var(--card)", borderRadius: 18, padding: "32px 32px 28px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", border: "1px solid var(--line)" }}>
        {/* Close */}
        <button onClick={onClose} aria-label="Stäng" style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 9, border: "1px solid var(--line-2)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--ink-500)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {done ? (
          <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-900)", marginBottom: 8 }}>Tack för ditt omdöme!</h3>
            <p style={{ fontSize: 14, color: "var(--ink-500)", lineHeight: 1.6 }}>Ditt omdöme om {driverName} har sparats och visas på hens profil.</p>
            <button onClick={onClose} style={{ marginTop: 20, padding: "10px 24px", borderRadius: 10, background: "var(--green)", color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Stäng</button>
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: 19, fontWeight: 800, color: "var(--ink-900)", marginBottom: 6 }}>Lämna omdöme</h3>
            <p style={{ fontSize: 14, color: "var(--ink-500)", lineHeight: 1.5, marginBottom: 24 }}>
              Betygsätt {driverName} baserat på er samarbetserfarenhet. Omdömet visas på hens profil med verifierings-märke.
            </p>

            {/* Star picker */}
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-700)", marginBottom: 10 }}>Betyg</p>
            <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
              {[1,2,3,4,5].map((n) => (
                <button key={n} type="button"
                  onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                  style={{ width: 44, height: 44, borderRadius: 10, border: `2px solid ${(hover || rating) >= n ? "var(--amber)" : "var(--line-2)"}`, background: (hover || rating) >= n ? "var(--amber-tint)" : "var(--paper-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .12s" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={(hover || rating) >= n ? "var(--amber)" : "none"} stroke={(hover || rating) >= n ? "var(--amber)" : "var(--ink-300)"} strokeWidth="1.8">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/>
                  </svg>
                </button>
              ))}
              {rating > 0 && (
                <span style={{ alignSelf: "center", fontSize: 13, color: "var(--ink-500)", marginLeft: 8 }}>
                  {["","Dålig","Under medel","Okej","Bra","Utmärkt"][rating]}
                </span>
              )}
            </div>

            {/* Comment */}
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-700)", marginBottom: 8 }}>Kommentar <span style={{ fontWeight: 400, color: "var(--ink-400)" }}>(valfri)</span></p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Berätta om er erfarenhet av föraren — punktlighet, hantering av fordon, kommunikation..."
              rows={4}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line-2)", background: "var(--paper-2)", fontSize: 14, color: "var(--ink-900)", outline: "none", fontFamily: "inherit", lineHeight: 1.55, resize: "vertical", boxSizing: "border-box" }}
            />

            {error && <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 8, fontWeight: 600 }}>{error}</p>}

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid var(--line-2)", background: "transparent", color: "var(--ink-700)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Avbryt</button>
              <button onClick={handleSubmit} disabled={loading || !rating} style={{ flex: 2, padding: "11px", borderRadius: 10, background: rating ? "var(--green)" : "var(--ink-200)", color: rating ? "#fff" : "var(--ink-400)", border: "none", fontSize: 14, fontWeight: 800, cursor: rating ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all .15s" }}>
                {loading ? "Skickar…" : "Skicka omdöme"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Market panel (sidebar) ── */
function MarketPanel({ driverMarket, region }) {
  const regionLabel = driverMarket?.region || region || "din region";
  const items = (driverMarket?.jobsInRegion >= 5 && driverMarket)
    ? [...(driverMarket.topLicenses || []), ...(driverMarket.topCerts || []).slice(0, 2)].slice(0, 4)
    : [{ name: "CE-körkort", pct: 78 }, { name: "YKB", pct: 62 }, { name: "ADR", pct: 31 }, { name: "Truck B", pct: 24 }];

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "22px 24px" }}>
      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)", marginBottom: 16 }}>
        Marknad i {regionLabel}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {items.map((m) => (
          <div key={m.name}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontSize: 13.5, color: "var(--ink-700)", fontWeight: 600 }}>{m.name}</span>
              <span style={{ fontSize: 13, color: "var(--ink-900)", fontWeight: 700, fontFamily: "var(--mono)" }}>{m.pct}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: "var(--paper-2)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${m.pct}%`, background: "var(--green)", opacity: 0.4 + (m.pct / 100) * 0.6, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 14, lineHeight: 1.5 }}>Andel aktiva jobb som kräver respektive behörighet.</p>
    </div>
  );
}

/* ── Profile strength sidebar (self mode) ── */
function ProfileStrengthCard({ profile, displayScore, onEdit }) {
  const checks = [
    { label: "Namn",            done: Boolean(profile?.name) },
    { label: "Ort & region",    done: Boolean(profile?.location && profile?.region) },
    { label: "Körkort",         done: (profile?.licenses || []).length > 0 },
    { label: "Certifikat",      done: (profile?.certificates || []).length > 0 },
    { label: "Erfarenhet",      done: (profile?.experience || []).length > 0 },
    { label: "Presentation",    done: (profile?.summary || "").length >= 20 },
    { label: "Telefon",         done: Boolean(profile?.phone) },
    { label: "Synlig för åkerier", done: Boolean(profile?.visibleToCompanies) },
  ];
  const score = displayScore != null ? displayScore : calcProfileStrength(profile);
  const label = score >= 90 ? "Utmärkt profil" : score >= 70 ? "Stark profil" : score >= 50 ? "Bra profil" : score >= 30 ? "Under uppbyggnad" : "Grundläggande profil";
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "22px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>Profilstyrka</h3>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
          <span style={{ fontSize: 30, fontWeight: 800, color: "var(--green)", letterSpacing: -0.5 }}>{score}</span>
          <span style={{ fontSize: 12, color: "var(--ink-500)", fontWeight: 600 }}>/100</span>
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "var(--paper-2)", overflow: "hidden", marginBottom: 14 }}>
        <div style={{ height: "100%", width: `${score}%`, background: "linear-gradient(to right, var(--green) 0%, var(--green-soft) 100%)", borderRadius: 3, transition: "width .5s" }} />
      </div>
      <p style={{ fontSize: 13, color: "var(--ink-500)", marginBottom: 14, fontWeight: 500 }}>{label}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {checks.map((c) => (
          <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 18, height: 18, borderRadius: 9, background: c.done ? "var(--success-tint)" : "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1.5px solid ${c.done ? "var(--success)" : "var(--line-2)"}` }}>
              {c.done && <span style={{ fontSize: 9, color: "var(--success)", fontWeight: 800 }}>✓</span>}
            </span>
            <span style={{ fontSize: 13.5, color: "var(--ink-700)", fontWeight: 500 }}>{c.label}</span>
          </div>
        ))}
      </div>
      {score < 100 && onEdit && (
        <button onClick={onEdit} style={{ marginTop: 14, width: "100%", padding: "8px", borderRadius: 8, border: "none", background: "var(--green-tint)", color: "var(--green-text)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Stärk profilen →</button>
      )}
    </div>
  );
}

/* ── Matchningar tab content (company mode) ── */
function MatchContent({ profile, job, jobs, matchJobId, onChangeJob }) {
  const selectedJob = jobs?.find((j) => j.id === matchJobId) || job || null;
  const matchResult = profile && selectedJob ? matchScore(profile, selectedJob) : null;
  const pct = matchResult?.pct ?? null;
  const criteria = profile && selectedJob && matchResult ? getMatchCriteria(profile, selectedJob, matchResult.details) : [];

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "22px 24px" }}>
      <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 14 }}>Matchning mot annons</p>
      {jobs && jobs.length > 0 && onChangeJob && (
        <div style={{ position: "relative", marginBottom: 18 }}>
          <select value={matchJobId || ""} onChange={(e) => onChangeJob(e.target.value || null)} style={{ appearance: "none", width: "100%", padding: "11px 32px 11px 14px", background: "var(--card-2)", border: "1px solid var(--line-2)", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "var(--ink-900)", cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
            <option value="">Välj annons</option>
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--ink-500)", display: "inline-flex" }}><ChevDown /></span>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: criteria.length > 0 ? 18 : 0 }}>
        <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
          <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="36" cy="36" r="30" fill="none" stroke="var(--paper-2)" strokeWidth="6"/>
            <circle cx="36" cy="36" r="30" fill="none" stroke={pct !== null ? matchColor(pct) : "var(--line-2)"} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 30}
              strokeDashoffset={pct !== null ? 2 * Math.PI * 30 - (pct / 100) * 2 * Math.PI * 30 : 2 * Math.PI * 30}
              style={{ transition: "stroke-dashoffset .6s, stroke .3s" }}/>
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: pct !== null ? matchColor(pct) : "var(--ink-400)", fontFamily: "var(--mono)" }}>
              {pct !== null ? pct : "—"}
            </span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>
            {pct !== null ? matchLabel(pct) : "Välj annons"}
          </div>
          {selectedJob && <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 2, lineHeight: 1.4 }}>mot {selectedJob.title}</div>}
        </div>
      </div>
      {criteria.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {criteria.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 18, height: 18, borderRadius: 9, background: b.met ? "var(--success-tint)" : "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: b.met ? "var(--success)" : "var(--ink-400)" }}>
                {b.met ? <CheckIcon /> : <XIcon />}
              </span>
              <span style={{ fontSize: 13.5, color: b.met ? "var(--ink-700)" : "var(--ink-400)", fontWeight: 500 }}>{b.label}</span>
            </div>
          ))}
        </div>
      )}
      {!selectedJob && (
        <p style={{ fontSize: 13, color: "var(--ink-400)", lineHeight: 1.5 }}>Välj en av dina annonser ovan för att se hur bra föraren matchar.</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function DriverProfileView({
  profile,
  owner,
  mode = "public",
  job = null,
  onEdit,
  onSave,
  reviews = [],
  // self-mode extras:
  editing = false,
  displayScore,
  driverMarket = null,
  profileStats = null,
  linkCopied = false,
  onCopyLink,
  // company-mode extras:
  apiJobs = [],
  driverSummary = null,
  driverSummaryLoading = false,
}) {
  const [tab, setTab] = useState("profil");
  const [showReachOut, setShowReachOut] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [localReviews, setLocalReviews] = useState(null); // override after submission
  const [starred, setStarred] = useState(false);
  const [matchJobId, setMatchJobId] = useState(() => apiJobs[0]?.id || null);
  const [shared, setShared] = useState(false);

  const displayedReviews = localReviews ?? reviews;

  if (!profile) return null;

  const color = driverColor(profile.id || owner?.id || "x");
  const name = owner?.name || profile.name || profile.id || "Förare";
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const yearsExp = profile.yearsExperience ?? calcYearsExperience(profile.experience) ?? 0;
  const availLabel = availabilityTypes.find((a) => a.value === profile.availability)?.label;
  const profileId = owner?.id || profile.id || profile.userId;

  const certExpiry = profile.certExpiry || {};
  const expiredCerts = (profile.certificates || []).filter((cid) => {
    const st = expiryStatus(certExpiry[cid]);
    return st && st.days < 0;
  });

  const handleShare = async () => {
    const url = `https://transportplattformen.se/forare/${profile.slug || profileId}`;
    if (navigator.share) {
      try { await navigator.share({ title: `${name} – Förare på STP`, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <div style={{ fontFamily: "var(--font)", color: "var(--ink-900)" }}>

      {/* ── Hero card ── */}
      <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "var(--sh-sm)", overflow: "hidden", padding: "28px 32px 0", marginBottom: 20 }}>

        {/* Hero row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
          {/* Avatar with openToWork ring */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              padding: profile.openToWork ? 3 : 0,
              borderRadius: "50%",
              background: profile.openToWork ? "conic-gradient(var(--success), var(--green-soft), var(--success))" : "transparent",
            }}>
              <div style={{ padding: profile.openToWork ? 2 : 0, borderRadius: "50%", background: "var(--card)" }}>
                <div style={{
                  width: 84, height: 84, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${color} 0%, var(--green-soft) 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, fontWeight: 700, color: "#fff",
                }}>{initials}</div>
              </div>
            </div>
            {profile.openToWork && (
              <span style={{
                position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)",
                background: "var(--success)", color: "#fff",
                fontSize: 10, fontWeight: 800, letterSpacing: 0.4,
                padding: "2px 10px", borderRadius: 999, whiteSpace: "nowrap",
                border: "2px solid var(--card)",
              }}>SÖKER JOBB</span>
            )}
          </div>

          {/* Name + meta + pills */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.6, marginBottom: 6 }}>
              {name}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-500)", fontSize: 14, marginBottom: 14 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span style={{ fontWeight: 500 }}>
                {[profile.location, profile.region].filter(Boolean).join(", ") || "—"}
              </span>
              {yearsExp > 0 && (
                <><span style={{ color: "var(--ink-300)" }}>·</span><span style={{ fontWeight: 500 }}>{yearsExp} års erfarenhet</span></>
              )}
            </div>

            {/* Cert + license pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
              {(profile.licenses || []).map((l) => (
                <span key={l} style={{
                  display: "inline-flex", alignItems: "center", padding: "4px 11px", borderRadius: 999,
                  fontSize: 12.5, fontWeight: 600,
                  background: "var(--green)", color: "#fff",
                  boxShadow: "0 1px 2px rgba(31,95,92,0.20), inset 0 -1px 0 rgba(0,0,0,0.10)",
                }}>{l}</span>
              ))}
              {(profile.certificates || []).slice(0, 4).map((cid) => {
                const st = expiryStatus(certExpiry[cid]);
                const label = getCertificateLabel(cid);
                if (!st) return (
                  <span key={cid} style={{ padding: "4px 11px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-700)" }}>{label}</span>
                );
                if (st.days < 0) return (
                  <span key={cid} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: "var(--danger-tint)", border: "1px solid rgba(185,28,59,0.18)", color: "var(--danger)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--danger)", display: "inline-block" }} />{label} · Utgånget
                  </span>
                );
                if (st.days < 180) return (
                  <span key={cid} style={{ padding: "4px 11px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: "var(--amber-tint)", border: "1px solid rgba(199,122,14,0.2)", color: "var(--amber-text)" }}>{label} · {st.label}</span>
                );
                return <span key={cid} style={{ padding: "4px 11px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-700)" }}>{label}</span>;
              })}
              {availLabel && (
                <span style={{ padding: "4px 11px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-600)" }}>{availLabel}</span>
              )}
            </div>
          </div>

          {/* Action buttons (top-right) */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0, paddingTop: 4 }}>
            {mode === "self" && !editing && (
              <>
                <button onClick={handleShare} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "1px solid var(--line-2)", background: "var(--card)", color: "var(--ink-700)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  {linkCopied ? "Kopierat!" : "Dela profil"}
                </button>
                <button onClick={onEdit} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 9, border: "1px solid var(--green)", background: "var(--green)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Redigera profil
                </button>
              </>
            )}
            {mode === "company" && (
              <>
                <button onClick={() => setStarred((s) => !s)} style={{ width: 44, height: 44, borderRadius: 10, background: starred ? "var(--amber-tint)" : "var(--paper-2)", border: `1px solid ${starred ? "var(--amber)" : "var(--line-2)"}`, color: starred ? "var(--amber)" : "var(--ink-500)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {starred ? <StarFilled /> : <StarEmpty />}
                </button>
                <button onClick={() => { setShowReachOut(true); track("reach_out_modal_opened", { driverId: profileId }); }} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 10, background: "var(--green)", border: "none", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font)" }}>
                  <MsgIcon /> Kontakta {name.split(" ")[0]}
                </button>
              </>
            )}
            {mode === "public" && (
              <button onClick={handleShare} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9, border: "1px solid var(--line-2)", background: "var(--card)", color: "var(--ink-700)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                {shared ? "Kopierat!" : "Dela profil"}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderTop: "1px solid var(--line)", marginTop: 4 }}>
          {["profil", "matchningar", "statistik"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "14px 22px", border: "none", background: "transparent", cursor: "pointer",
              fontFamily: "var(--font)", fontSize: 13.5, fontWeight: tab === t ? 700 : 500,
              color: tab === t ? "var(--ink-900)" : "var(--ink-500)",
              borderBottom: tab === t ? "2px solid var(--green)" : "2px solid transparent",
              transition: "all .15s",
            }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* ── Content grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

        {/* ─── Left column ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* PROFIL TAB */}
          {tab === "profil" && (
            <>
              {/* AI-sammanfattning (company mode) */}
              {mode === "company" && (driverSummaryLoading || driverSummary) && (
                <div style={{ background: "var(--amber-tint)", border: "1px solid rgba(199,122,14,0.2)", borderRadius: 12, padding: "18px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ color: "var(--amber-text)", display: "inline-flex" }}><SparkIcon /></span>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "var(--amber-text)" }}>AI-sammanfattning</div>
                  </div>
                  {driverSummaryLoading ? (
                    <div style={{ height: 16, background: "var(--amber-tint-2)", borderRadius: 8, width: "75%" }} />
                  ) : (
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-700)", margin: 0 }}>{driverSummary}</p>
                  )}
                </div>
              )}

              {/* Utgångna certifikat-varning */}
              {expiredCerts.length > 0 && (
                <div style={{ padding: "14px 18px", borderRadius: 12, background: "var(--amber-tint)", border: "1px solid rgba(199,122,14,0.2)" }}>
                  {expiredCerts.map((cid) => (
                    <p key={cid} style={{ fontSize: 13, color: "var(--amber-text)", fontWeight: 600, margin: "0 0 4px" }}>
                      ⚠ {getCertificateLabel(cid)} är utgånget — du kan missa matchningar från åkerier som kräver detta certifikat.
                    </p>
                  ))}
                </div>
              )}

              {/* Presentation */}
              {profile.summary && (
                <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "20px 24px", boxShadow: "var(--sh-sm)" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 14 }}>Presentation</div>
                  <p style={{ fontSize: 15, color: "var(--ink-700)", lineHeight: 1.7, margin: 0 }}>{profile.summary}</p>
                </div>
              )}

              {/* Erfarenhet */}
              {(profile.experience || []).length > 0 && (
                <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "20px 24px", boxShadow: "var(--sh-sm)" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 14 }}>Erfarenhet</div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {(profile.experience || []).map((exp, i) => (
                      <div key={exp.id || i} style={{ display: "grid", gridTemplateColumns: "16px 1fr auto", gap: 16, padding: "16px 0", borderBottom: i < profile.experience.length - 1 ? "1px solid var(--line)" : "none", alignItems: "start" }}>
                        <div style={{ position: "relative", height: "100%", paddingTop: 6 }}>
                          <span style={{ display: "block", width: 10, height: 10, borderRadius: 5, background: i === 0 ? "var(--green)" : "var(--ink-200)", boxShadow: i === 0 ? "0 0 0 3px var(--green-tint)" : "none" }} />
                          {i < profile.experience.length - 1 && <span style={{ position: "absolute", left: 4, top: 22, bottom: -16, width: 2, background: "var(--line-2)" }} />}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-900)" }}>{exp.role}</span>
                            {exp.current && <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "var(--success-tint)", color: "var(--success)", border: "1px solid var(--success)" }}>Pågående</span>}
                          </div>
                          <div style={{ fontSize: 13.5, color: "var(--ink-500)", marginTop: 2, fontWeight: 500 }}>{exp.company}</div>
                          {(exp.vehicleTypes?.length > 0 || exp.jobType) && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                              {(exp.vehicleTypes || []).map((v) => <span key={v} style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11.5, background: "var(--paper-2)", color: "var(--ink-500)", border: "1px solid var(--line)" }}>{EXP_VEHICLE_TYPES.find((x) => x.value === v)?.label || v}</span>)}
                              {exp.jobType && <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11.5, background: "var(--green-tint)", color: "var(--green-text)", border: "1px solid rgba(31,95,92,0.2)" }}>{EXP_JOB_TYPES.find((x) => x.value === exp.jobType)?.label || exp.jobType}</span>}
                            </div>
                          )}
                          {exp.description && <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 6 }}>{exp.description}</div>}
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--ink-500)", fontWeight: 600, fontFamily: "var(--mono)", whiteSpace: "nowrap", paddingTop: 4 }}>{formatYearRange(exp)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Kan jobba i */}
              {(profile.regionsWilling || []).length > 0 && (
                <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "20px 24px", boxShadow: "var(--sh-sm)" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 14 }}>Kan jobba i</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {profile.regionsWilling.map((r) => (
                      <span key={r} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 99, background: "var(--green-tint)", color: "var(--green-text)", fontSize: 13, fontWeight: 600 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Omdömen */}
              <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "20px 24px", boxShadow: "var(--sh-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)" }}>Omdömen</div>
                  {mode === "company" && (
                    <button onClick={() => setShowReviewModal(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--line-2)", background: "var(--paper-2)", color: "var(--ink-700)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>
                      Lämna omdöme
                    </button>
                  )}
                </div>
                <ReviewsSection reviews={displayedReviews} />
              </div>
            </>
          )}

          {/* MATCHNINGAR TAB */}
          {tab === "matchningar" && (
            <MatchContent
              profile={profile}
              job={job}
              jobs={apiJobs}
              matchJobId={matchJobId}
              onChangeJob={mode === "company" ? setMatchJobId : null}
            />
          )}

          {/* STATISTIK TAB */}
          {tab === "statistik" && (
            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "22px 24px", boxShadow: "var(--sh-sm)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 18 }}>Profilstatistik</div>
              {mode === "self" && profileStats ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { val: profileStats.views7 ?? 0, label: "Senaste 7 dagar" },
                      { val: profileStats.views30 ?? 0, label: "Senaste 30 dagar" },
                    ].map(({ val, label }) => (
                      <div key={label} style={{ background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
                        <div style={{ fontSize: 26, fontWeight: 900, color: val > 0 ? "var(--amber)" : "var(--ink-400)", lineHeight: 1, marginBottom: 4 }}>{val}</div>
                        <div style={{ fontSize: 10, color: "var(--ink-400)", lineHeight: 1.3 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  {profileStats.conversationCount > 0 && (
                    <p style={{ fontSize: 12, color: "var(--success)", fontWeight: 600, margin: 0 }}>
                      {profileStats.conversationCount} {profileStats.conversationCount === 1 ? "åkeri" : "åkerier"} har kontaktat dig
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "var(--ink-400)" }}>
                  {mode === "self" ? "Laddar statistik…" : "Statistik är bara synlig för föraren själv."}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ─── Right sidebar ─── */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 80 }}>

          {/* Self mode: profile strength */}
          {mode === "self" && (
            <ProfileStrengthCard profile={profile} displayScore={displayScore} onEdit={onEdit} />
          )}

          {/* Company mode: match card */}
          {mode === "company" && apiJobs.length > 0 && (
            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "22px 24px", boxShadow: "var(--sh-sm)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 14 }}>Matchning mot annons</div>
              <MatchContent
                profile={profile}
                job={job}
                jobs={apiJobs}
                matchJobId={matchJobId}
                onChangeJob={setMatchJobId}
              />
            </div>
          )}

          {/* Company mode: actions */}
          {mode === "company" && (
            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "20px 24px", boxShadow: "var(--sh-sm)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => { setShowReachOut(true); track("reach_out_modal_opened", { driverId: profileId }); }} style={{ width: "100%", padding: "12px 18px", borderRadius: 10, background: "var(--green)", border: "none", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}>
                  <MsgIcon /> Kontakta {name.split(" ")[0]}
                </button>
                <button onClick={() => setStarred((s) => !s)} style={{ width: "100%", padding: "11px 18px", borderRadius: 10, background: starred ? "var(--amber-tint)" : "var(--paper-2)", border: `1px solid ${starred ? "var(--amber)" : "var(--line-2)"}`, color: starred ? "var(--amber-text)" : "var(--ink-700)", fontSize: 13.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}>
                  {starred ? <StarFilled /> : <StarEmpty />} {starred ? "Sparad i kandidatlista" : "Spara kandidat"}
                </button>
              </div>
            </div>
          )}

          {/* Market panel */}
          <MarketPanel driverMarket={driverMarket} region={profile.region} />

          {/* Self mode: profile link */}
          {mode === "self" && (
            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: "22px 24px" }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)", marginBottom: 12 }}>Din profillänk</p>
              <p style={{ fontSize: 13.5, color: "var(--ink-700)", marginBottom: 14, lineHeight: 1.5 }}>
                Dela med åkerier — de ser din profil utan inloggning.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 0, background: "var(--card-2)", border: "1px solid var(--line-2)", borderRadius: 9, paddingLeft: 12, overflow: "hidden" }}>
                <span style={{ flex: 1, fontSize: 12.5, fontFamily: "var(--mono)", color: "var(--ink-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                  transportplattformen.se/forare/{profile.slug || profileId}
                </span>
                <button onClick={onCopyLink} style={{ background: linkCopied ? "var(--success)" : "var(--ink-900)", color: "#fff", padding: "10px 14px", fontSize: 12.5, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6, border: "none", cursor: "pointer", transition: "background .2s", fontFamily: "inherit" }}>
                  {linkCopied ? "Kopierad ✓" : "Kopiera"}
                </button>
              </div>
            </div>
          )}

        </aside>
      </div>

      {/* ReachOutModal for company mode */}
      {showReachOut && (
        <ReachOutModal
          driver={{ ...profile, name, id: profileId }}
          jobs={apiJobs}
          onClose={() => setShowReachOut(false)}
          onSuccess={() => setShowReachOut(false)}
        />
      )}

      {/* ReviewModal — company lämnar omdöme om förare */}
      {showReviewModal && (
        <ReviewModal
          driverId={owner?.id || profileId}
          driverName={name.split(" ")[0]}
          onClose={() => setShowReviewModal(false)}
          onSubmitted={(newReview) => {
            setLocalReviews([newReview, ...(displayedReviews || [])]);
            setShowReviewModal(false);
          }}
        />
      )}
    </div>
  );
}
