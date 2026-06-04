/* PROOF — Admin Rapporter, från "STP Admin Rapporter Ljust.html". Route: /preview/admin/rapporter */
import { useState } from "react";
import { Card, Pill, Button, Icon } from "../../../components/ui";
import { AdminShell } from "../../../components/ui/AdminShell.jsx";

const REPORTS = [
  { id: 0, target: "TONY KARLSSON", targetType: "Förare", initials: "TK", reporter: "Nordic Transport AB", reason: "Misstänkt falskt konto", detail: "Profilen har påhittade certifikat och svarar aldrig. Verkar vara en bot eller skräpkonto.", severity: "high", time: "1 tim sen", category: "spam" },
  { id: 1, target: "FlexiDriv Bemanning", targetType: "Åkeri", initials: "FD", reporter: "Erik Johansson", reason: "Vilseledande annons", detail: "Annonsen lovade 38 000 kr/mån men vid kontakt erbjöds bara 28 000. Kände mig lurad.", severity: "high", time: "3 tim sen", category: "misleading" },
  { id: 2, target: "Test User", targetType: "Förare", initials: "TU", reporter: "System", reason: "Automatiskt flaggad", detail: "Konto skapat med engångs-mejl, 3 varningar, aldrig inloggad efter registrering.", severity: "medium", time: "Igår", category: "spam" },
  { id: 3, target: "Kustfrakt Syd", targetType: "Åkeri", initials: "KS", reporter: "Anna Lindberg", reason: "Oprofessionellt bemötande", detail: "Fick ett otrevligt meddelande efter att ha tackat nej till en tjänst.", severity: "low", time: "2 dgr sen", category: "conduct" },
];
const sevMeta = { high: { label: "Allvarlig", tone: "danger" }, medium: { label: "Medel", tone: "amber" }, low: { label: "Låg", tone: "neutral" } };
const catLabel = { spam: "Skräp / falskt", misleading: "Vilseledande", conduct: "Uppförande" };

export default function RapporterPreview() {
  const [nav, setNav] = useState("reports");
  const [filter, setFilter] = useState("all");
  const [reports, setReports] = useState(REPORTS);
  const list = reports.filter((r) => (filter === "all" ? true : r.severity === filter));
  const resolve = (id) => setReports((rs) => rs.filter((r) => r.id !== id));
  const filters = [{ k: "all", l: "Alla" }, { k: "high", l: "Allvarliga" }, { k: "medium", l: "Medel" }, { k: "low", l: "Låg" }];

  return (
    <AdminShell active={nav} onNav={setNav} title="Rapporter" sub={`${reports.length} öppna anmälningar att hantera`} maxWidth={1040}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
        {filters.map((f) => <button key={f.k} onClick={() => setFilter(f.k)} style={{ padding: "7px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: filter === f.k ? "var(--ink-900)" : "var(--card)", color: filter === f.k ? "#fff" : "var(--ink-700)", border: `1px solid ${filter === f.k ? "var(--ink-900)" : "var(--line-2)"}`, boxShadow: "var(--sh-sm)" }}>{f.l}</button>)}
      </div>
      <div className="stp-fade-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {list.length === 0 ? (
          <Card padding="56px 32px" style={{ textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 26, background: "var(--success-tint)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={24} color="var(--success)" stroke={3} /></div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-900)", marginBottom: 6 }}>Inga öppna anmälningar</h3>
            <p style={{ fontSize: 14, color: "var(--ink-500)" }}>Allt är hanterat.</p>
          </Card>
        ) : list.map((r) => {
          const sev = sevMeta[r.severity];
          return (
            <Card key={r.id} padding="20px 24px" style={{ borderColor: r.severity === "high" ? "rgba(185,28,59,0.2)" : "var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                <div style={{ display: "flex", gap: 13, alignItems: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: "var(--paper-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "var(--ink-700)", flexShrink: 0 }}>{r.initials}</div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><span style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink-900)" }}>{r.target}</span><Pill tone="neutral" size="sm">{r.targetType}</Pill><Pill tone={sev.tone} size="sm">{sev.label}</Pill></div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 3 }}>{catLabel[r.category]} · anmäld av <strong style={{ color: "var(--ink-700)", fontWeight: 600 }}>{r.reporter}</strong> · {r.time}</div>
                  </div>
                </div>
              </div>
              <div style={{ background: "var(--card-2)", borderRadius: 10, padding: "13px 16px", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-900)", marginBottom: 4 }}>{r.reason}</div>
                <p style={{ fontSize: 13.5, color: "var(--ink-600)", lineHeight: 1.55, textWrap: "pretty" }}>{r.detail}</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button variant="secondary" size="sm" icon={<Icon name="eye" size={13} stroke={2} />}>Visa profil</Button>
                <Button variant="danger" size="sm" onClick={() => resolve(r.id)}>Stäng av konto</Button>
                <Button variant="secondary" size="sm" onClick={() => resolve(r.id)}>Skicka varning</Button>
                <div style={{ flex: 1 }} />
                <Button variant="ghost" size="sm" onClick={() => resolve(r.id)}>Avfärda anmälan</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </AdminShell>
  );
}
