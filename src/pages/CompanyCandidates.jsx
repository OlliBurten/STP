/**
 * Kandidater — alla förare åkeriet har en tråd med, över alla annonser.
 * Samma data som annonsernas kanban och inkorgen; steget delas med dem.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { useChat } from "../context/ChatContext";
import { useToast } from "../context/ToastContext";
import { fetchCompanyCandidates } from "../api/companies";
import { setConversationStage } from "../api/conversations";
import LoadingBlock from "../components/LoadingBlock";

const STAGES = [
  { id: "new",       label: "Ny",        api: "ny",         bg: "var(--amber-tint)",   fg: "var(--amber-text)" },
  { id: "reviewing", label: "Granskar",  api: "kontaktad",  bg: "var(--info-tint)",    fg: "var(--info)" },
  { id: "interview", label: "Intervju",  api: "intervjuad", bg: "var(--green-tint)",   fg: "var(--green-text)" },
  { id: "hired",     label: "Anställd",  api: "anstalld",   bg: "var(--success-tint)", fg: "var(--success)" },
  { id: "rejected",  label: "Avslagen",  api: "avslag",     bg: "var(--paper-2)",      fg: "var(--ink-500)" },
];
const STAGE_BY_ID = Object.fromEntries(STAGES.map((s) => [s.id, s]));

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0] || "?").slice(0, 2).toUpperCase();
}

function relDay(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "Idag";
  if (days === 1) return "Igår";
  if (days < 7) return `${days} dagar sedan`;
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

function StagePill({ stage }) {
  const s = STAGE_BY_ID[stage] || STAGE_BY_ID.new;
  return <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: s.bg, color: s.fg, whiteSpace: "nowrap" }}>{s.label}</span>;
}

function Tag({ children, strong }) {
  return <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 999, border: strong ? "none" : "1px solid var(--line-2)", background: strong ? "var(--success-tint)" : "transparent", color: strong ? "var(--success)" : "var(--ink-700)" }}>{children}</span>;
}

function Avatar({ name, size = 32 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size, background: "var(--green-tint)", color: "var(--green-text)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.36, flexShrink: 0 }}>
      {initials(name)}
    </div>
  );
}

const btn = (primary) => ({
  display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none",
  background: primary ? "var(--green)" : "var(--card)", color: primary ? "#fff" : "var(--ink-900)", border: primary ? "none" : "1px solid var(--line-2)",
});

function CandidateDrawer({ c, onClose, onStage, saving }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(27,36,33,0.35)", zIndex: 60 }} />
      <aside role="dialog" aria-label={c.driverName} style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(460px, 100vw)", background: "var(--card)", boxShadow: "-12px 0 40px rgba(0,0,0,0.12)", zIndex: 61, overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 16px 0" }}>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 13, fontWeight: 700, color: "var(--ink-500)", cursor: "pointer", padding: 6 }}>Stäng ✕</button>
        </div>
        <div style={{ padding: "4px 26px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
            <Avatar name={c.driverName} size={52} />
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: 21, fontWeight: 800, color: "var(--ink-900)", margin: 0 }}>{c.driverName}</h2>
              <div style={{ fontSize: 13.5, color: "var(--ink-500)" }}>
                {[c.location, c.jobTitle ? `${c.initiatedBy === "company" ? "kontaktad om" : "sökte"} ${c.jobTitle}` : null].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, margin: "14px 0 20px", flexWrap: "wrap" }}>
            {c.matchPercent != null && <Tag strong>{c.matchPercent} % matchning</Tag>}
            {c.licenses.map((l) => <Tag key={l}>{l}</Tag>)}
            {c.certificates.map((x) => <Tag key={x}>{x}</Tag>)}
            {c.yearsExperience > 0 && <Tag>{c.yearsExperience} års erfarenhet</Tag>}
          </div>

          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--ink-500)", marginBottom: 22, maxWidth: 240 }}>
            Steg
            <select
              value={c.stage}
              disabled={saving}
              onChange={(e) => onStage(c, e.target.value)}
              style={{ display: "block", width: "100%", marginTop: 6, padding: "9px 10px", borderRadius: 10, border: "1px solid var(--line-2)", background: "var(--card)", color: "var(--ink-900)", fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}
            >
              {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            <Link to={`/foretag/meddelanden/${c.conversationId}`} style={btn(true)}>Öppna konversationen</Link>
            <Link to={`/foretag/chaufforer/${c.driverId}`} style={btn(false)}>Visa profil</Link>
          </div>

          <div style={{ fontSize: 13, color: "var(--ink-500)", lineHeight: 1.6 }}>
            {c.referenceCount > 0
              ? <>{c.referenceCount} {c.referenceCount === 1 ? "referens" : "referenser"} från åkerier — finns på profilen.</>
              : "Inga referenser från åkerier ännu."}
            <br />
            {c.initiatedBy === "company" ? "Ni kontaktade föraren" : "Sökte"} {relDay(c.appliedAt).toLowerCase()}.
          </div>
        </div>
      </aside>
    </>
  );
}

export default function CompanyCandidates() {
  usePageTitle("Kandidater");
  const toast = useToast();
  const { getConversation, isConversationUnread } = useChat();
  const [cands, setCands] = useState(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [job, setJob] = useState("");
  const [stage, setStage] = useState("");
  const [openId, setOpenId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCompanyCandidates()
      .then((data) => setCands(Array.isArray(data) ? data : []))
      .catch(() => setError(true));
  }, []);

  const jobs = useMemo(() => {
    const m = new Map();
    (cands || []).forEach((c) => { if (c.jobId && !m.has(c.jobId)) m.set(c.jobId, { id: c.jobId, title: c.jobTitle, location: c.jobLocation }); });
    return [...m.values()];
  }, [cands]);

  const inScope = (cands || []).filter((c) =>
    (!q || c.driverName.toLowerCase().includes(q.trim().toLowerCase())) && (!job || c.jobId === job));
  const counts = Object.fromEntries(STAGES.map((s) => [s.id, inScope.filter((c) => c.stage === s.id).length]));
  const list = inScope.filter((c) => !stage || c.stage === stage);
  const open = cands?.find((c) => c.conversationId === openId) || null;

  const changeStage = async (c, next) => {
    const prev = c.stage;
    setSaving(true);
    setCands((all) => all.map((x) => (x.conversationId === c.conversationId ? { ...x, stage: next } : x)));
    try {
      await setConversationStage(c.conversationId, STAGE_BY_ID[next].api);
    } catch (e) {
      setCands((all) => all.map((x) => (x.conversationId === c.conversationId ? { ...x, stage: prev } : x)));
      toast.error(e?.message || "Kunde inte byta steg.");
    } finally {
      setSaving(false);
    }
  };

  const chip = (id, label, n) => {
    const on = stage === id;
    return (
      <button key={id || "all"} onClick={() => setStage(id)} style={{ padding: "7px 12px", borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", border: on ? "1px solid var(--ink-900)" : "1px solid var(--line-2)", background: on ? "var(--ink-900)" : "var(--card)", color: on ? "#fff" : "var(--ink-700)" }}>
        {label} <span style={{ opacity: 0.6, fontWeight: 600 }}>{n}</span>
      </button>
    );
  };

  return (
    <main style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 32px 64px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, margin: "0 0 4px" }}>Kandidater</h1>
      <p style={{ fontSize: 14, color: "var(--ink-500)", margin: "0 0 22px" }}>Alla förare ni har kontakt med, över alla annonser.</p>

      {error ? (
        <p style={{ color: "var(--danger)", fontSize: 14 }}>Kunde inte ladda kandidaterna. Ladda om sidan.</p>
      ) : cands === null ? (
        <LoadingBlock />
      ) : cands.length === 0 ? (
        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "40px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-900)", margin: "0 0 6px" }}>Inga kandidater ännu</p>
          <p style={{ fontSize: 14, color: "var(--ink-500)", margin: "0 0 18px" }}>Sökande och förare ni kontaktar hamnar här.</p>
          <div style={{ display: "inline-flex", gap: 8 }}>
            <Link to="/foretag/annonsera" style={btn(true)}>Publicera annons</Link>
            <Link to="/foretag/chaufforer" style={btn(false)}>Hitta förare</Link>
          </div>
        </div>
      ) : (
        <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 10, padding: "16px 18px", flexWrap: "wrap", alignItems: "center", borderBottom: "1px solid var(--line)" }}>
            <input
              value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sök kandidat" aria-label="Sök kandidat"
              style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid var(--line-2)", background: "var(--card)", color: "var(--ink-900)", fontSize: 14, minWidth: 200, fontFamily: "inherit" }}
            />
            {jobs.length > 1 && (
              <select value={job} onChange={(e) => setJob(e.target.value)} aria-label="Annons"
                style={{ padding: "9px 10px", borderRadius: 10, border: "1px solid var(--line-2)", background: "var(--card)", color: "var(--ink-900)", fontSize: 14, fontFamily: "inherit", maxWidth: 320 }}>
                <option value="">Alla annonser</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}{j.location ? ` · ${j.location}` : ""}</option>)}
              </select>
            )}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginLeft: "auto" }}>
              {chip("", "Alla", inScope.length)}
              {STAGES.map((s) => chip(s.id, s.label, counts[s.id]))}
            </div>
          </div>

          {list.length === 0 ? (
            <p style={{ padding: "28px 18px", fontSize: 14, color: "var(--ink-500)", margin: 0 }}>Inga kandidater matchar filtret.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr>
                    {["Kandidat", "Annons", "Steg", "Matchning", "Senast"].map((h) => (
                      <th key={h} style={{ textAlign: "left", fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--ink-400)", padding: "12px 18px", borderBottom: "1px solid var(--line)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => {
                    const conv = getConversation(c.conversationId);
                    const unread = conv ? isConversationUnread(conv) : c.unread;
                    return (
                      <tr key={c.conversationId} onClick={() => setOpenId(c.conversationId)} style={{ cursor: "pointer", borderBottom: "1px solid var(--line)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--paper)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                        <td style={{ padding: "12px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar name={c.driverName} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, color: "var(--ink-900)", display: "flex", alignItems: "center", gap: 6 }}>
                                {c.driverName}
                                {unread && <span title="Oläst meddelande" style={{ width: 7, height: 7, borderRadius: 7, background: "var(--amber)" }} />}
                              </div>
                              <div style={{ fontSize: 12, color: "var(--ink-500)" }}>
                                {[c.location, c.licenses.join("/"), c.yearsExperience > 0 ? `${c.yearsExperience} år` : null, c.referenceCount > 0 ? "referens" : null].filter(Boolean).join(" · ")}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 18px", color: "var(--ink-700)" }}>
                          {c.jobTitle || "—"}
                          <div style={{ fontSize: 12, color: "var(--ink-500)" }}>
                            {c.initiatedBy === "company" ? "Kontaktad av er" : c.jobLocation}
                          </div>
                        </td>
                        <td style={{ padding: "12px 18px" }}><StagePill stage={c.stage} /></td>
                        <td style={{ padding: "12px 18px", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: c.matchPercent >= 85 ? "var(--success)" : "var(--ink-700)" }}>
                          {c.matchPercent != null ? `${c.matchPercent} %` : "—"}
                        </td>
                        <td style={{ padding: "12px 18px", color: "var(--ink-500)", whiteSpace: "nowrap" }}>{relDay(c.lastActivityAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {open && <CandidateDrawer c={open} onClose={() => setOpenId(null)} onStage={changeStage} saving={saving} />}
    </main>
  );
}
