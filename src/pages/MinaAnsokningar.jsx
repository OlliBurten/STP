import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { fetchConversations } from "../api/conversations.js";
import { useAuth } from "../context/AuthContext";
import LoadingBlock from "../components/LoadingBlock";
import PageMeta from "../components/PageMeta";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStage(conv) {
  if (conv.rejectedByCompanyAt)  return "rejected";
  if (conv.selectedByCompanyAt)  return "selected";
  if (conv.reviewedByCompanyAt)  return "review";
  if (conv.readByCompanyAt)      return "seen";
  return "applied";
}

function dayDiff(iso) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
}

function formatRel(iso) {
  const d = dayDiff(iso);
  if (d === 0) return "idag";
  if (d === 1) return "igår";
  if (d < 7)  return `för ${d} dagar sen`;
  if (d < 14) return "för 1 vecka sen";
  if (d < 30) return `för ${Math.floor(d / 7)} veckor sen`;
  return `för ${Math.floor(d / 30)} mån sen`;
}

function avatarInitials(name) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function avatarBg(name) {
  const palette = ["#1F5F5C", "#1a3a5c", "#3a2a5c", "#3a2a1a", "#1a2a3a", "#1a3a2a"];
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return palette[h % palette.length];
}

// ─── Funnel ───────────────────────────────────────────────────────────────────
function Funnel({ conv }) {
  const stage = getStage(conv);
  const isSelected = stage === "selected";
  const isRejected = stage === "rejected";

  const decisionColor = isSelected ? "#4ade80" : isRejected ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)";
  const decisionLabel = isSelected ? "Utvald" : isRejected ? "Ej aktuell" : "Beslut";

  const steps = [
    { key: "applied",  label: "Skickad",  reached: true,                  color: "#4ade80", at: conv.createdAt,             isDecision: false, isRejected: false },
    { key: "seen",     label: "Sedd",     reached: !!conv.readByCompanyAt, color: "#4ade80", at: conv.readByCompanyAt,       isDecision: false, isRejected: false },
    { key: "review",   label: "I urval",  reached: !!conv.reviewedByCompanyAt, color: "#F5A623", at: conv.reviewedByCompanyAt, isDecision: false, isRejected: false },
    { key: "decision", label: decisionLabel, reached: !!(conv.selectedByCompanyAt || conv.rejectedByCompanyAt), color: decisionColor, at: conv.selectedByCompanyAt || conv.rejectedByCompanyAt, isDecision: true, isRejected },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
      {steps.map((s, i) => (
        <div key={s.key} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 99,
              background: s.reached ? (s.isRejected ? "rgba(255,255,255,0.08)" : s.color) : "transparent",
              border: s.reached ? "none" : "1.5px dashed rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: s.isRejected ? "rgba(255,255,255,0.5)" : "#000",
              boxShadow: s.reached && !s.isRejected ? `0 0 0 4px ${s.color}22` : "none",
            }}>
              {s.reached && !s.isRejected && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
              {s.reached && s.isRejected && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              )}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: s.reached ? "#f0faf9" : "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>{s.label}</div>
              {s.at && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{formatRel(s.at)}</div>}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: 1, height: 2, margin: "0 8px",
              background: steps[i + 1].reached
                ? `linear-gradient(90deg, ${s.color}, ${steps[i + 1].color})`
                : "rgba(255,255,255,0.08)",
              marginTop: -22,
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── App card ─────────────────────────────────────────────────────────────────
function AppCard({ conv }) {
  const stage = getStage(conv);
  const isSelected = stage === "selected";
  const isRejected = stage === "rejected";
  const isStale = !isSelected && !isRejected && dayDiff(conv.createdAt) > 14;

  // check for unread company messages
  const lastMsg = conv.messages?.[conv.messages.length - 1];
  const hasUnread = !conv.readByDriverAt && lastMsg?.sender !== "driver" && !!lastMsg;

  return (
    <div style={{
      background: isSelected ? "linear-gradient(135deg,rgba(74,222,128,0.05),rgba(74,222,128,0.02))" : "rgba(255,255,255,0.025)",
      border: `1px solid ${isSelected ? "rgba(74,222,128,0.3)" : isRejected ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 18,
      padding: "22px 24px",
      opacity: isRejected ? 0.7 : 1,
      position: "relative",
    }}>
      {isSelected && (
        <div style={{ position: "absolute", top: -1, right: 24, padding: "4px 12px", background: "#4ade80", color: "#000", fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", borderRadius: "0 0 8px 8px" }}>
          Åtgärd krävs
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: avatarBg(conv.companyName), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#fff", flexShrink: 0 }}>
          {avatarInitials(conv.companyName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3, marginBottom: 3, color: isRejected ? "rgba(240,250,249,0.7)" : "#f0faf9" }}>
            {conv.jobTitle || "Okänd tjänst"}
          </h3>
          <div style={{ fontSize: 13, color: "rgba(240,250,249,0.55)" }}>{conv.companyName}</div>
        </div>
        <Link
          to={`/meddelanden/${conv.id}`}
          style={{ padding: "7px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(240,250,249,0.7)", fontSize: 12, fontWeight: 700, textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap" }}
        >
          Öppna →
        </Link>
      </div>

      {/* Funnel */}
      <div style={{ padding: "4px 8px 8px" }}>
        <Funnel conv={conv} />
      </div>

      {/* Footer */}
      {hasUnread && lastMsg && (
        <div style={{ marginTop: 18, padding: "12px 14px", background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 11, display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: "#4ade80", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#4ade80", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 2 }}>Nytt meddelande från {conv.companyName}</div>
            <div style={{ fontSize: 13, color: "#f0faf9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lastMsg.content}</div>
          </div>
          <Link to={`/meddelanden/${conv.id}`} style={{ padding: "7px 14px", borderRadius: 9, background: "#4ade80", color: "#000", fontWeight: 800, fontSize: 12, textDecoration: "none", flexShrink: 0 }}>Svara →</Link>
        </div>
      )}

      {isRejected && (
        <div style={{ marginTop: 14, padding: "10px 13px", background: "rgba(255,255,255,0.02)", borderRadius: 10, fontSize: 12, color: "rgba(240,250,249,0.45)", fontStyle: "italic" }}>
          Konversationen är avslutad.
        </div>
      )}

      {isStale && !hasUnread && !isRejected && (
        <div style={{ marginTop: 14, padding: "10px 13px", background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 10, fontSize: 12, color: "#F5A623", display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Inget svar på {dayDiff(conv.createdAt)} dagar — vill du dra tillbaka ansökan?
        </div>
      )}

      {!isSelected && !isRejected && !isStale && !hasUnread && (
        <div style={{ marginTop: 14, fontSize: 12, color: "rgba(240,250,249,0.45)", display: "flex", alignItems: "center", gap: 8 }}>
          {conv.readByCompanyAt ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Sedd {formatRel(conv.readByCompanyAt)}{conv.reviewedByCompanyAt && ` · plockad till urval ${formatRel(conv.reviewedByCompanyAt)}`}
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Inväntar att åkeriet öppnar din ansökan
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ label, count, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, marginTop: 8 }}>
      <div style={{ width: 6, height: 18, borderRadius: 3, background: color }} />
      <h2 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "rgba(240,250,249,0.85)" }}>{label}</h2>
      <span style={{ fontSize: 12, padding: "2px 9px", borderRadius: 99, background: "rgba(255,255,255,0.06)", color: "rgba(240,250,249,0.55)", fontWeight: 700 }}>{count}</span>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, hint }) {
  return (
    <div style={{ flex: 1, padding: "20px 22px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "rgba(240,250,249,0.45)", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1.5, color, lineHeight: 1 }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: "rgba(240,250,249,0.4)", marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MinaAnsokningar() {
  usePageTitle("Mina ansökningar");
  const { hasApi } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hasApi) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    fetchConversations()
      .then((convs) => setApplications(convs.filter((c) => c.jobId).map((c) => ({ ...c, _stage: getStage(c) }))))
      .catch((e) => setError(e.message || "Kunde inte hämta dina ansökningar"))
      .finally(() => setLoading(false));
  }, [hasApi]);

  const selected = useMemo(() => applications.filter((a) => a._stage === "selected"), [applications]);
  const active   = useMemo(() => applications.filter((a) => !["selected", "rejected"].includes(a._stage)), [applications]);
  const rejected = useMemo(() => applications.filter((a) => a._stage === "rejected"), [applications]);

  const seenCount = applications.filter((a) => a.readByCompanyAt).length;

  return (
    <main style={{ background: "#060f0f", minHeight: "100vh", marginTop: "-64px", paddingTop: 64 }}>
      <PageMeta title="Mina ansökningar – STP" />

      {/* Page header */}
      <div style={{ background: "linear-gradient(to bottom, #0a1818, #060f0f)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "48px 40px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(245,166,35,0.8)", marginBottom: 8 }}>Mitt konto</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 6, color: "#f0faf9" }}>Mina ansökningar</h1>
          <p style={{ fontSize: 14, color: "rgba(240,250,249,0.5)", margin: 0 }}>Följ varje ansökan från skickad till beslut. Vi visar dig exakt var du står.</p>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 40px 100px" }}>

        {loading ? (
          <LoadingBlock message="Hämtar dina ansökningar..." />
        ) : error ? (
          <div style={{ padding: "20px", borderRadius: 14, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: 14 }}>{error}</div>
        ) : applications.length === 0 ? (
          <div style={{ padding: "80px 40px", textAlign: "center", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, marginTop: 32 }}>
            <div style={{ width: 72, height: 72, borderRadius: 99, background: "rgba(245,166,35,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#F5A623" }}><path d="M12 2L13.5 8.5 20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/></svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, marginBottom: 10, color: "#f0faf9" }}>Du har inte sökt något jobb ännu</h2>
            <p style={{ fontSize: 14, color: "rgba(240,250,249,0.5)", lineHeight: 1.6, maxWidth: 420, margin: "0 auto 24px" }}>
              När du ansöker till ett jobb dyker det upp här. Vi följer hela vägen från skickad ansökan till slutligt beslut, så du alltid vet var du står.
            </p>
            <Link to="/jobb" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 24px", borderRadius: 12, background: "#F5A623", color: "#000", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>
              Bläddra bland jobb →
            </Link>
          </div>
        ) : (
          <>
            {/* Selected call-to-action banner */}
            {selected.length > 0 && (
              <div style={{ padding: "22px 26px", background: "linear-gradient(135deg,rgba(74,222,128,0.12),rgba(74,222,128,0.03))", border: "1px solid rgba(74,222,128,0.4)", borderRadius: 18, marginBottom: 28, display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 48, height: 48, borderRadius: 99, background: "rgba(74,222,128,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: "#4ade80", textTransform: "uppercase", marginBottom: 4 }}>Du är utvald · åtgärd krävs</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#f0faf9", marginBottom: 3 }}>
                    {selected.length === 1 ? `${selected[0].companyName} vill träffa dig` : `${selected.length} åkerier vill träffa dig`}
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(240,250,249,0.65)" }}>Svara på meddelandet så snart du kan — tjänsten är ofta tillsatt inom några dagar.</div>
                </div>
                <Link to={`/meddelanden/${selected[0].id}`} style={{ padding: "12px 20px", borderRadius: 11, background: "#4ade80", color: "#000", fontWeight: 800, fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  Öppna meddelanden →
                </Link>
              </div>
            )}

            {/* Stats row */}
            <div style={{ display: "flex", gap: 14, marginBottom: 28 }}>
              <StatCard label="Aktiva ansökningar" value={active.length + selected.length} color="#f0faf9" hint={`${selected.length} med beslut`} />
              <StatCard label="Sedda av åkeriet" value={seenCount} color="#5fbab5" hint={`av ${applications.length} totalt`} />
              <StatCard label="Totalt ansökningar" value={applications.length} color="#F5A623" hint={`${rejected.length} avslutade`} />
            </div>

            {/* Insights */}
            <div style={{ padding: "16px 20px", background: "linear-gradient(135deg,rgba(31,95,92,0.18),rgba(31,95,92,0.05))", border: "1px solid rgba(31,95,92,0.3)", borderRadius: 14, display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(31,95,92,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#5fbab5"><path d="M12 2L13.5 8.5 20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f0faf9", marginBottom: 2 }}>{seenCount} av {applications.length} ansökningar har öppnats av åkeriet</div>
                <div style={{ fontSize: 12, color: "rgba(240,250,249,0.55)" }}>Genomsnittlig svarstid på STP är 7 dagar. Profiler med ID-verifiering får svar 2× snabbare.</div>
              </div>
              <Link to="/installningar" style={{ fontSize: 12, fontWeight: 700, color: "#F5A623", textDecoration: "none", flexShrink: 0 }}>Verifiera profil →</Link>
            </div>

            {/* Selected section */}
            {selected.length > 0 && (
              <>
                <SectionHeader label="Utvalda — åtgärd krävs" count={selected.length} color="#4ade80" />
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                  {selected.map((a) => <AppCard key={a.id} conv={a} />)}
                </div>
              </>
            )}

            {/* Active section */}
            {active.length > 0 && (
              <>
                <SectionHeader label="Aktiva ansökningar" count={active.length} color="#F5A623" />
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                  {active.map((a) => <AppCard key={a.id} conv={a} />)}
                </div>
              </>
            )}

            {/* Rejected section */}
            {rejected.length > 0 && (
              <>
                <SectionHeader label="Ej aktuella" count={rejected.length} color="rgba(255,255,255,0.2)" />
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                  {rejected.map((a) => <AppCard key={a.id} conv={a} />)}
                </div>
              </>
            )}

            {/* Footer CTA */}
            <div style={{ marginTop: 48, padding: "32px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, textAlign: "center" }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.4, marginBottom: 6 }}>Söker du fler möjligheter?</h3>
              <p style={{ fontSize: 13, color: "rgba(240,250,249,0.5)", marginBottom: 18 }}>Vi har hundratals lediga CE-jobb i Sverige just nu — många matchar din profil.</p>
              <Link to="/jobb" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 11, background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.4)", color: "#F5A623", fontWeight: 800, fontSize: 13, textDecoration: "none" }}>
                Bläddra bland jobb →
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
