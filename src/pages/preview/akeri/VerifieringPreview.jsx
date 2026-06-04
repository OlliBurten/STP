/* ════════════════════════════════════════════════════════════
   PROOF-SKÄRM — Åkeri Verifiering, portad från
   "STP (4)/STP Åkeri Verifiering Ljust.html", layout-standarden (READ).
   Route: /preview/akeri/verifiering
════════════════════════════════════════════════════════════ */
import { useState } from "react";
import { Card, Pill, Button, Icon, SectionLabel, Notice } from "../../../components/ui";
import { AppPage, PageHeader } from "../../../components/ui/layout.jsx";
import { AKERI_NAV, COMPANY } from "./data.js";

const INITIAL_STEPS = [
  { id: "email", icon: "mail", title: "E-post bekräftad", time: "Klart", required: true, status: "done", desc: "hr@nordictransport.se" },
  { id: "company", icon: "building", title: "Företagsuppgifter", time: "Klart", required: true, status: "done", desc: "Nordic Transport AB · 556677-8899" },
  { id: "fskatt", icon: "info", title: "F-skattsedel", time: "~ 2 min", required: true, status: "next", desc: "Bekräftar att ni är registrerade hos Skatteverket och får ta emot uppdrag." },
  { id: "trafik", icon: "truck", title: "Trafiktillstånd", time: "~ 2 min", required: true, status: "locked", desc: "Yrkesmässigt trafiktillstånd från Transportstyrelsen." },
  { id: "agreement", icon: "user", title: "Kollektivavtal", time: "~ 1 min", required: false, status: "locked", desc: "Visar förare att ni har avtal. Höjer ansökningstakten med ~40 %." },
  { id: "billing", icon: "settings", title: "Fakturering", time: "~ 3 min", required: false, status: "locked", desc: "Behövs först när ni vill publicera fler än 1 jobb samtidigt." },
];
const statusMeta = { done: { label: "Klart", tone: "success" }, review: { label: "Granskas", tone: "amber" }, next: { label: "Nästa steg", tone: "info" }, locked: { label: "", tone: "neutral" } };

export default function VerifieringPreview() {
  const [nav, setNav] = useState("profil");
  const [steps, setSteps] = useState(INITIAL_STEPS);
  const [expanded, setExpanded] = useState("fskatt");

  const complete = (id) => {
    setSteps((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, status: "review", time: "Granskas" } : s));
      const idx = next.findIndex((s) => s.id === id);
      if (idx >= 0 && idx + 1 < next.length && next[idx + 1].status === "locked") { next[idx + 1] = { ...next[idx + 1], status: "next" }; setExpanded(next[idx + 1].id); }
      return next;
    });
  };
  const requiredDone = steps.filter((s) => s.required && (s.status === "done" || s.status === "review")).length;
  const requiredTotal = steps.filter((s) => s.required).length;
  const pct = Math.round((requiredDone / requiredTotal) * 100);
  const verified = requiredDone === requiredTotal;

  return (
    <AppPage
      width="read"
      nav={{ items: AKERI_NAV, active: nav, onActive: setNav, brand: "STP", brandSub: "Åkeri", currentUser: { initials: COMPANY.initials, label: COMPANY.name } }}
      header={<PageHeader width="read" eyebrow="För åkerier" title="Verifiering" sub="Verifierade åkerier får fler ansökningar. Det tar några minuter." />}
    >
      <style>{`.ver-grid{display:grid;grid-template-columns:1fr 320px;gap:28px;align-items:start}@media(max-width:980px){.ver-grid{grid-template-columns:1fr}}`}</style>
      <div className="ver-grid">
        <div className="stp-fade-up">
          <Card padding="22px 26px" style={{ marginBottom: 18, background: verified ? "var(--success-tint)" : "var(--card)", borderColor: verified ? "rgba(31,122,58,0.2)" : "var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {verified && <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={17} color="#fff" stroke={3} /></span>}
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink-900)" }}>{verified ? "Verifierat åkeri!" : "Verifiering pågår"}</div>
                  <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 1 }}>{requiredDone} av {requiredTotal} obligatoriska steg klara</div>
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: verified ? "var(--success)" : "var(--green)", fontFamily: "var(--mono)" }}>{pct}%</div>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "var(--paper-2)", overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: verified ? "var(--success)" : "linear-gradient(to right, var(--green), var(--green-soft))", borderRadius: 3, transition: "width .5s" }} /></div>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {steps.map((s) => {
              const meta = statusMeta[s.status];
              const isLocked = s.status === "locked";
              const isOpen = expanded === s.id && !isLocked;
              const isActionable = s.status === "next";
              return (
                <Card key={s.id} padding="0" style={{ opacity: isLocked ? 0.6 : 1, overflow: "hidden" }}>
                  <button onClick={() => !isLocked && setExpanded(isOpen ? "" : s.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "18px 22px", textAlign: "left", cursor: isLocked ? "default" : "pointer" }}>
                    <span style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0, background: s.status === "done" ? "var(--success-tint)" : s.status === "review" ? "var(--amber-tint)" : isActionable ? "var(--green-tint)" : "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {s.status === "done" ? <Icon name="check" size={18} color="var(--success)" stroke={3} /> : <Icon name={s.icon} size={18} color={s.status === "review" ? "var(--amber-deep)" : isActionable ? "var(--green-text)" : "var(--ink-400)"} stroke={2} />}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 15.5, fontWeight: 700, color: "var(--ink-900)" }}>{s.title}</span>
                        {!s.required && <Pill tone="neutral" size="sm">Valfritt</Pill>}
                        {meta.label && <Pill tone={meta.tone} size="sm">{meta.label}</Pill>}
                      </div>
                      {!isOpen && <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.desc}</div>}
                    </div>
                    <span style={{ fontSize: 12.5, color: "var(--ink-400)", fontFamily: "var(--mono)", flexShrink: 0 }}>{s.time}</span>
                    {!isLocked && <Icon name={isOpen ? "chevDown" : "chevRight"} size={16} color="var(--ink-300)" stroke={2} />}
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 22px 22px 78px" }}>
                      <p style={{ fontSize: 14, color: "var(--ink-600)", lineHeight: 1.6, marginBottom: 16, textWrap: "pretty" }}>{s.desc}</p>
                      {isActionable && (
                        <>
                          <div style={{ border: "1.5px dashed var(--line-strong)", borderRadius: 12, padding: "26px 20px", textAlign: "center", background: "var(--card-2)", marginBottom: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 11, background: "var(--green-tint)", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="plus" size={20} color="var(--green-text)" stroke={2.4} /></div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)", marginBottom: 4 }}>Ladda upp dokument</div>
                            <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>PDF, JPG eller PNG · max 10 MB</div>
                          </div>
                          <div style={{ display: "flex", gap: 10 }}>
                            <Button variant="primary" size="md" onClick={() => complete(s.id)} iconRight={<Icon name="arrow" size={14} stroke={2.2} />}>Skicka för granskning</Button>
                            {!s.required && <Button variant="ghost" size="md">Hoppa över</Button>}
                          </div>
                        </>
                      )}
                      {s.status === "review" && <Notice tone="amber" title="Granskas av STP">Vi återkommer inom 1–2 arbetsdagar. Du får en notis när det är klart.</Notice>}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 80 }}>
          <Card padding="22px 24px">
            <SectionLabel>Varför verifiera?</SectionLabel>
            {[{ icon: "eye", title: "Mer synlig", text: "Verifierade åkerier rankas högre och får en blå bock." }, { icon: "user", title: "Fler ansökningar", text: "Förare söker hellre hos verifierade arbetsgivare." }, { icon: "check", title: "Bygg förtroende", text: "Visar att ni är en seriös och registrerad aktör." }].map((b, i) => (
              <div key={b.title} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: i < 2 ? "1px solid var(--line)" : "none" }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={b.icon} size={16} color="var(--green-text)" stroke={2} /></span>
                <div><div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>{b.title}</div><div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 2, lineHeight: 1.5 }}>{b.text}</div></div>
              </div>
            ))}
          </Card>
          <Card padding="18px 22px" style={{ background: "var(--card-2)" }}>
            <div style={{ fontSize: 13, color: "var(--ink-500)", lineHeight: 1.6 }}>Behöver du hjälp? <a href="#" style={{ color: "var(--green)", fontWeight: 600 }}>Kontakta support</a> så guidar vi dig genom verifieringen.</div>
          </Card>
        </aside>
      </div>
    </AppPage>
  );
}
