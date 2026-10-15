/**
 * Rekrytering — vad kontakterna på STP leder till. Tratt totalt och per åkeri,
 * "dagar från första annonsen till första intervju/anställning", och varje dialog
 * med tidslinje. Här registrerar admin också det som sagts utanför plattformen
 * (t.ex. i telefon: "Sara fick jobbet").
 */
import React, { useEffect, useState } from "react";
import { T, Btn, SectionCard, KpiCard, fmtDate, useIsMobile } from "./adminShared.jsx";
import { getRecruitmentOverview, recordRecruitmentEvent } from "../../api/admin.js";

const EVENT_LABEL = {
  APPLIED: "Sökte", CONTACTED: "Åkeriet kontaktade", COMPANY_REPLIED: "Åkeriet svarade", DRIVER_REPLIED: "Föraren svarade",
  INTERVIEW: "Intervju", REJECTED: "Avslag", HIRED: "Anställd", NOT_HIRED: "Inte anställd", IN_PROCESS: "Pågår",
};
const OUTCOME_LABEL = { HIRED: "Anställd", NOT_HIRED: "Inte anställd", IN_PROCESS: "Pågår" };
const BY_LABEL = { company: "åkeriet", driver: "föraren", admin: "admin" };

function fmtDateTime(v) {
  return v ? new Date(v).toLocaleString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
}
function days(n) {
  return n == null ? "–" : `${String(n).replace(".", ",")} d`;
}

export default function AdminRecruitmentTab({ setError, setSuccess }) {
  const isMobile = useIsMobile();
  const [data, setData] = useState(null);
  const [onlyDialogs, setOnlyDialogs] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = () => getRecruitmentOverview().then(setData).catch((e) => setError?.(e?.message || "Kunde inte hämta rekryteringsdata"));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const record = async (c, type) => {
    const label = type === "INTERVIEW" ? "intervju" : OUTCOME_LABEL[type].toLowerCase();
    const when = window.prompt(`Registrera ${label} för ${c.driver} hos ${c.company}.\nDatum (ÅÅÅÅ-MM-DD), tomt = nu:`, "");
    if (when === null) return;
    setBusy(c.id + type);
    try {
      await recordRecruitmentEvent(c.id, type, when.trim() ? `${when.trim()}T12:00:00` : null);
      setSuccess?.(`Registrerat: ${label}`);
      await load();
    } catch (e) {
      setError?.(e?.message || "Kunde inte spara");
    } finally {
      setBusy(null);
    }
  };

  if (!data) return <SectionCard><p style={{ color: T.muted, margin: 0 }}>Laddar…</p></SectionCard>;
  const t = data.total;
  const convs = data.conversations.filter((c) => !onlyDialogs || c.dialog || c.hireOutcome);
  const th = { textAlign: "left", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", padding: "8px 10px", borderBottom: `1px solid ${T.border}` };
  const td = { fontSize: "var(--text-sm)", color: T.text, padding: "10px", borderBottom: `1px solid ${T.border}`, verticalAlign: "top" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)", gap: 12 }}>
        <KpiCard label="Kontakter" value={t.applications + t.contacted} sub={`${t.applications} ansökningar · ${t.contacted} från åkerier`} />
        <KpiCard label="Dialoger" value={t.dialogs} sub="båda parter har skrivit" />
        <KpiCard label="Intervjuer" value={t.interviews} />
        <KpiCard label="Anställningar" value={t.hired} teal={t.hired > 0} />
        <KpiCard label="Svarstid (median)" value={t.medianFirstResponseHours == null ? "–" : `${t.medianFirstResponseHours} h`} sub="åkeriets första svar på ansökan" />
      </div>

      <SectionCard>
        <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: T.text, margin: "0 0 14px" }}>Per åkeri</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead><tr>
              <th style={th}>Åkeri</th><th style={th}>Första annons</th><th style={th}>Kontakter</th><th style={th}>Dialoger</th>
              <th style={th}>Intervjuer</th><th style={th}>Anställda</th><th style={th}>Till 1:a intervju</th><th style={th}>Till 1:a anställning</th>
            </tr></thead>
            <tbody>
              {data.companies.map((c) => (
                <tr key={c.name}>
                  <td style={{ ...td, fontWeight: 700 }}>{c.name}</td>
                  <td style={td}>{c.firstJobPublishedAt ? fmtDate(c.firstJobPublishedAt) : "–"}</td>
                  <td style={td}>{c.funnel.applications + c.funnel.contacted}</td>
                  <td style={td}>{c.funnel.dialogs}</td>
                  <td style={td}>{c.funnel.interviews}</td>
                  <td style={{ ...td, fontWeight: c.funnel.hired ? 800 : 400, color: c.funnel.hired ? T.green : T.text }}>{c.funnel.hired}</td>
                  <td style={td}>{days(c.daysToFirstInterview)}</td>
                  <td style={td}>{days(c.daysToFirstHire)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: "var(--text-xs)", color: T.muted, margin: "10px 0 0" }}>Dagar räknas från åkeriets första annons på STP. Test- och demokonton är borttagna.</p>
      </SectionCard>

      <SectionCard>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: T.text, margin: 0 }}>Kontakter</h3>
          <label style={{ fontSize: "var(--text-sm)", color: T.sub, display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={onlyDialogs} onChange={(e) => setOnlyDialogs(e.target.checked)} /> Bara dialoger
          </label>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {convs.length === 0 && <p style={{ color: T.muted, margin: 0 }}>Inga kontakter ännu.</p>}
          {convs.map((c) => (
            <div key={c.id} style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 800, color: T.text }}>{c.driver} · {c.company}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: T.muted, marginTop: 2 }}>
                    {c.jobTitle || "Ingen annons"} · {c.startedBy === "driver" ? "föraren sökte" : "åkeriet kontaktade"} · {c.messages} meddelanden
                  </div>
                </div>
                {c.hireOutcome && (
                  <span style={{ alignSelf: "flex-start", padding: "4px 10px", borderRadius: 99, fontSize: "var(--text-xs)", fontWeight: 800, background: c.hireOutcome === "HIRED" ? T.greenBg : T.card, color: c.hireOutcome === "HIRED" ? T.green : T.sub }}>
                    {OUTCOME_LABEL[c.hireOutcome]}{c.hireReportedBy ? ` (enligt ${BY_LABEL[c.hireReportedBy] || c.hireReportedBy})` : ""}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", marginTop: 10 }}>
                {c.events.map((e, i) => (
                  <span key={i} style={{ fontSize: "var(--text-xs)", color: e.type === "HIRED" ? T.green : T.sub }}>
                    <strong style={{ color: e.type === "HIRED" ? T.green : T.text }}>{EVENT_LABEL[e.type] || e.type}</strong> {fmtDateTime(e.at)}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                {["INTERVIEW", "HIRED", "IN_PROCESS", "NOT_HIRED"].map((type) => (
                  <Btn key={type} disabled={busy === c.id + type} onClick={() => record(c, type)}>
                    {type === "INTERVIEW" ? "+ Intervju" : OUTCOME_LABEL[type]}
                  </Btn>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
