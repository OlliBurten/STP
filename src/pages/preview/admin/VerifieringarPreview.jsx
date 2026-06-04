/* PROOF — Admin Verifieringar, från "STP Admin Verifieringar Ljust.html". Route: /preview/admin/verifieringar */
import { useState } from "react";
import { Card, Pill, Button, Icon, SectionLabel, Notice } from "../../../components/ui";
import { AdminShell } from "../../../components/ui/AdminShell.jsx";

const QUEUE = [
  { id: 0, company: "FlexiDriv Bemanning", initials: "FD", doc: "Trafiktillstånd", orgNr: "556912-3344", submitted: "2 dgr sen", priority: "high", checks: [{ l: "Dokument läsbart", ok: true }, { l: "Org-nr matchar Bolagsverket", ok: true }, { l: "Giltigt utgångsdatum", ok: false }, { l: "Utfärdat av Transportstyrelsen", ok: true }] },
  { id: 1, company: "Kustfrakt Syd", initials: "KS", doc: "F-skattsedel", orgNr: "556788-1122", submitted: "1 dag sen", priority: "normal", checks: [{ l: "Dokument läsbart", ok: true }, { l: "Org-nr matchar", ok: true }, { l: "F-skatt aktiv", ok: true }, { l: "Aktuellt datum", ok: true }] },
  { id: 2, company: "Express Distribution", initials: "ED", doc: "Kollektivavtal", orgNr: "556345-9988", submitted: "4 tim sen", priority: "normal", checks: [{ l: "Dokument läsbart", ok: true }, { l: "Avtalspart angiven", ok: true }, { l: "Underskrift finns", ok: true }, { l: "Giltigt avtalsår", ok: true }] },
  { id: 3, company: "Norrlands Skogsfrakt", initials: "NS", doc: "Trafiktillstånd", orgNr: "556221-7766", submitted: "2 tim sen", priority: "normal", checks: [{ l: "Dokument läsbart", ok: true }, { l: "Org-nr matchar", ok: true }, { l: "Giltigt utgångsdatum", ok: true }, { l: "Utfärdat av Transportstyrelsen", ok: true }] },
];

export default function VerifieringarPreview() {
  const [nav, setNav] = useState("verify");
  const [queue, setQueue] = useState(QUEUE);
  const [selId, setSelId] = useState(0);
  const sel = queue.find((q) => q.id === selId);
  const resolve = (id) => { const rest = queue.filter((x) => x.id !== id); setQueue(rest); setSelId(rest.length ? rest[0].id : null); };

  return (
    <AdminShell active={nav} onNav={setNav} title="Verifieringar" sub={`${queue.length} dokument väntar på granskning`} maxWidth={1320}>
      {queue.length === 0 ? (
        <Card padding="64px 32px" style={{ textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: "var(--success-tint)", margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={26} color="var(--success)" stroke={3} /></div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink-900)", marginBottom: 6 }}>Kön är tom</h3>
          <p style={{ fontSize: 14, color: "var(--ink-500)" }}>Alla verifieringar är granskade. Bra jobbat!</p>
        </Card>
      ) : (
        <>
          <style>{`.ver-grid{display:grid;grid-template-columns:380px 1fr;gap:20px;align-items:start}@media(max-width:980px){.ver-grid{grid-template-columns:1fr}}`}</style>
          <div className="ver-grid">
            <Card padding="6px">
              {queue.map((q) => (
                <button key={q.id} onClick={() => setSelId(q.id)} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 10, background: selId === q.id ? "var(--green-tint)" : "transparent", marginBottom: 2 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--paper-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "var(--ink-700)", flexShrink: 0 }}>{q.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.company}</div><div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 1 }}>{q.doc} · {q.submitted}</div></div>
                  {q.priority === "high" && <Pill tone="danger" size="sm">Prio</Pill>}
                </button>
              ))}
            </Card>
            {sel && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <Card>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--paper-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "var(--ink-700)" }}>{sel.initials}</div>
                      <div><h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3 }}>{sel.company}</h3><div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2, fontFamily: "var(--mono)" }}>{sel.orgNr}</div></div>
                    </div>
                    <Pill tone="info">{sel.doc}</Pill>
                  </div>
                  <div style={{ background: "var(--card-2)", border: "1.5px dashed var(--line-2)", borderRadius: 12, padding: "40px 20px", textAlign: "center", marginBottom: 18 }}>
                    <div style={{ width: 48, height: 60, borderRadius: 6, background: "#fff", border: "1px solid var(--line-2)", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--sh-sm)" }}><Icon name="info" size={22} color="var(--ink-400)" stroke={1.8} /></div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)", marginBottom: 4 }}>{sel.doc}.pdf</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginBottom: 14 }}>Inskickat {sel.submitted}</div>
                    <Button variant="secondary" size="sm" icon={<Icon name="eye" size={13} stroke={2} />}>Öppna dokument</Button>
                  </div>
                  <SectionLabel>Automatisk kontroll</SectionLabel>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    {sel.checks.map((c) => (
                      <div key={c.l} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <span style={{ width: 18, height: 18, borderRadius: 9, background: c.ok ? "var(--success-tint)" : "var(--danger-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.ok ? <Icon name="check" size={10} color="var(--success)" stroke={3} /> : <Icon name="x" size={9} color="var(--danger)" stroke={3} />}</span>
                        <span style={{ fontSize: 13, color: c.ok ? "var(--ink-700)" : "var(--danger)", fontWeight: c.ok ? 500 : 600 }}>{c.l}</span>
                      </div>
                    ))}
                  </div>
                  {sel.checks.some((c) => !c.ok) && <div style={{ marginTop: 10 }}><Notice tone="amber" title="Kräver manuell bedömning">En automatisk kontroll misslyckades. Granska dokumentet noga innan beslut.</Notice></div>}
                </Card>
                <div style={{ display: "flex", gap: 10 }}>
                  <Button variant="primary" size="lg" onClick={() => resolve(sel.id)} icon={<Icon name="check" size={15} stroke={2.4} />}>Godkänn verifiering</Button>
                  <Button variant="danger" size="lg" onClick={() => resolve(sel.id)} icon={<Icon name="x" size={15} stroke={2.4} />}>Avslå</Button>
                  <Button variant="ghost" size="lg">Begär mer info</Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </AdminShell>
  );
}
