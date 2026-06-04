/* ════════════════════════════════════════════════════════════
   PROOF-SKÄRM — Ansökan (förare), portad från
   "STP (4)/STP Ansökan Ljust.html", på layout-standarden (READ-bredd).
   Route: /preview/ansokan
════════════════════════════════════════════════════════════ */
import { useState } from "react";
import { Card, Pill, Button, Icon, SectionLabel, Field, Avatar } from "../../components/ui";
import { AppPage, Breadcrumb, CardStack } from "../../components/ui/layout.jsx";

const JOB = { title: "CE-chaufför fjärrkörning", company: "Nordic Transport AB", logo: "NT", salary: "36 000 – 42 000 kr/mån", employment: "Fast anställning", start: "1 juni 2026", verified: true, responseRate: 87, avgResponseDays: 1.8, match: 94 };
const ME = { name: "Oliver Harburt", initials: "OH", location: "Malmö", experience: 11, license: ["CE", "C", "B"], certificates: ["YKB", "ADR klass 3", "Digitalt förarkort"] };
const NAV_ITEMS = [
  { id: "jobb", label: "Jobb" }, { id: "ansokningar", label: "Mina ansökningar" },
  { id: "meddelanden", label: "Meddelanden", badge: 1 }, { id: "favoriter", label: "Favoriter" },
];

const Toggle = ({ on, setOn, label, sub }) => (
  <button onClick={() => setOn(!on)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, textAlign: "left", background: on ? "var(--green-tint)" : "var(--card-2)", border: `1px solid ${on ? "var(--green-tint-2)" : "var(--line-2)"}` }}>
    <div style={{ width: 38, height: 22, borderRadius: 11, flexShrink: 0, position: "relative", background: on ? "var(--green)" : "var(--ink-200)", border: "1px solid", borderColor: on ? "var(--green-deep)" : "var(--line-2)" }}>
      <div style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: 8, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left .2s" }} />
    </div>
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-900)" }}>{label}</div>
      {sub && <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 2 }}>{sub}</div>}
    </div>
  </button>
);

const JobContext = () => (
  <aside style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 80 }}>
    <Card padding="22px 24px">
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 11, flexShrink: 0, background: "var(--paper-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "var(--ink-700)" }}>{JOB.logo}</div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, lineHeight: 1.3 }}>{JOB.title}</h3>
          <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>{JOB.company}{JOB.verified && <Icon name="check" size={11} color="var(--success)" stroke={3} />}</div>
        </div>
      </div>
      <Field label="Lön" value={JOB.salary} mono />
      <Field label="Anställning" value={JOB.employment} />
      <Field label="Tillträde" value={JOB.start} />
    </Card>
    <Card padding="20px 24px" style={{ background: "var(--card-2)" }}>
      <SectionLabel>Åkeriet svarar ofta</SectionLabel>
      <div style={{ display: "flex", gap: 20 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: "var(--green)", fontFamily: "var(--mono)", lineHeight: 1 }}>{JOB.responseRate}%</div><div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 4 }}>svarsfrekvens</div></div>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink-900)", fontFamily: "var(--mono)", lineHeight: 1 }}>~{JOB.avgResponseDays}d</div><div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 4 }}>svarstid</div></div>
      </div>
    </Card>
  </aside>
);

const Success = ({ onReset }) => (
  <div style={{ maxWidth: 620, margin: "0 auto", paddingTop: 16 }}>
    <Card padding="44px 40px" style={{ textAlign: "center" }}>
      <div style={{ width: 72, height: 72, borderRadius: 36, margin: "0 auto 24px", background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={34} color="var(--success)" stroke={3} /></div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.6, marginBottom: 10 }}>Ansökan skickad!</h1>
      <p style={{ fontSize: 15, color: "var(--ink-500)", lineHeight: 1.6, marginBottom: 28, textWrap: "pretty" }}>Din profil och ditt meddelande har skickats till <strong style={{ color: "var(--ink-900)" }}>{JOB.company}</strong>. Du får en notis så fort de svarar.</p>
      <div style={{ textAlign: "left", background: "var(--card-2)", borderRadius: 12, padding: "20px 22px", marginBottom: 28 }}>
        <SectionLabel>Vad händer nu?</SectionLabel>
        {[{ n: 1, t: "Åkeriet ser din ansökan", s: "De får din fullständiga profil med körkort och certifikat." }, { n: 2, t: "De hör av sig", s: `${JOB.company} svarar oftast inom ~${JOB.avgResponseDays} dagar.` }, { n: 3, t: "Ni pratar direkt", s: "All kontakt sker via plattformen — inga mellanhänder." }].map((s) => (
          <div key={s.n} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "10px 0", borderBottom: s.n < 3 ? "1px solid var(--line)" : "none" }}>
            <span style={{ width: 26, height: 26, borderRadius: 13, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0, fontFamily: "var(--mono)" }}>{s.n}</span>
            <div><div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>{s.t}</div><div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2, lineHeight: 1.5 }}>{s.s}</div></div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <Button variant="secondary" size="md" onClick={onReset}>Visa mina ansökningar</Button>
        <Button variant="primary" size="md" iconRight={<Icon name="arrow" size={14} stroke={2.2} />}>Sök fler jobb</Button>
      </div>
    </Card>
  </div>
);

export default function AnsokanPreview() {
  const [nav, setNav] = useState("jobb");
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [showPhone, setShowPhone] = useState(true);
  const [availableFrom, setAvailableFrom] = useState("");

  const navProps = { items: NAV_ITEMS, active: nav, onActive: setNav, currentUser: { initials: ME.initials, label: ME.name } };

  if (done) {
    return <AppPage width="read" nav={navProps}><Success onReset={() => setDone(false)} /></AppPage>;
  }

  return (
    <AppPage width="read" nav={navProps} breadcrumb={<Breadcrumb label="Tillbaka till jobbet" width="read" />}>
      <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -1, marginBottom: 6 }}>Ansök till tjänsten</h1>
      <p style={{ fontSize: 14.5, color: "var(--ink-500)", marginBottom: 28 }}>Din profil bifogas automatiskt — du behöver inte fylla i något CV.</p>

      <style>{`.apply-grid{display:grid;grid-template-columns:1fr 340px;gap:28px;align-items:start}@media(max-width:1000px){.apply-grid{grid-template-columns:1fr}}`}</style>
      <div className="apply-grid">
        <CardStack className="stp-fade-up">
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <SectionLabel style={{ marginBottom: 0 }}>Din profil bifogas</SectionLabel>
              <a href="#" style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>Redigera profil →</a>
            </div>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
              <Avatar initials={ME.initials} size={52} />
              <div><div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink-900)" }}>{ME.name}</div><div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2 }}>{ME.location} · {ME.experience} års erfarenhet</div></div>
              <div style={{ marginLeft: "auto" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 999, background: "var(--success-tint)", fontSize: 13, fontWeight: 800, fontFamily: "var(--mono)", color: "var(--success)" }}>{JOB.match}% match</span></div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ME.license.map((l) => <Pill key={l} tone="primary" size="sm">{l}</Pill>)}
              {ME.certificates.map((c) => <Pill key={c} tone="neutral" size="sm">{c}</Pill>)}
            </div>
          </Card>

          <Card>
            <SectionLabel>Personligt meddelande <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0, color: "var(--ink-400)" }}>(valfritt)</span></SectionLabel>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Berätta kort varför du är intresserad av tjänsten. Ett par rader räcker — det gör skillnad." rows={4} style={{ width: "100%", padding: "14px 16px", background: "var(--card-2)", border: "1px solid var(--line-2)", borderRadius: 11, fontSize: 14.5, color: "var(--ink-900)", fontFamily: "var(--font)", lineHeight: 1.6, resize: "vertical", outline: "none" }} />
            <div style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 8 }}>Tips: åkerier svarar oftare på ansökningar med ett personligt meddelande.</div>
          </Card>

          <Card>
            <SectionLabel>När kan du börja?</SectionLabel>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Omgående", "Inom 1 månad", "Inom 3 månader", "Annat"].map((opt) => (
                <button key={opt} onClick={() => setAvailableFrom(opt)} style={{ padding: "10px 16px", borderRadius: 10, background: availableFrom === opt ? "var(--green)" : "var(--card)", color: availableFrom === opt ? "#fff" : "var(--ink-700)", border: `1px solid ${availableFrom === opt ? "var(--green-deep)" : "var(--line-2)"}`, fontSize: 13.5, fontWeight: 600, boxShadow: "var(--sh-sm)" }}>{opt}</button>
              ))}
            </div>
          </Card>

          <Card>
            <SectionLabel>Vad åkeriet ser</SectionLabel>
            <Toggle on={showPhone} setOn={setShowPhone} label="Visa mitt telefonnummer" sub="Åkeriet kan ringa dig direkt istället för bara via plattformen." />
          </Card>

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <Button variant="primary" size="lg" onClick={() => setDone(true)} iconRight={<Icon name="arrow" size={15} stroke={2.2} />}>Skicka ansökan</Button>
            <Button variant="ghost" size="lg">Avbryt</Button>
            <span style={{ fontSize: 12.5, color: "var(--ink-400)", marginLeft: "auto" }}>Du kan dra tillbaka ansökan när som helst.</span>
          </div>
        </CardStack>

        <JobContext />
      </div>
    </AppPage>
  );
}
