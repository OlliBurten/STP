/* PROOF — Onboarding (förare, standalone wizard), från "STP Onboarding Förare Ljust.html".
   Route: /preview/onboarding-forare */
import { useState } from "react";
import { Card, Button, Icon, SectionLabel } from "../../components/ui";

const STEPS = [
  { id: "welcome", label: "Välkommen" }, { id: "segment", label: "Vad söker du?" },
  { id: "licenses", label: "Körkort" }, { id: "region", label: "Region" }, { id: "summary", label: "Presentation" },
];
const REGIONS = ["Skåne", "Stockholm", "Västra Götaland", "Halland", "Uppsala", "Östergötland", "Jönköping", "Västernorrland", "Norrbotten", "Västerbotten"];
const LICENSES = [{ c: "B", d: "Personbil" }, { c: "C1", d: "Medeltung lastbil" }, { c: "C1E", d: "C1 med släp" }, { c: "C", d: "Tung lastbil" }, { c: "CE", d: "Tung lastbil + släp" }, { c: "D", d: "Buss" }];
const CERTS = ["YKB", "ADR", "ADR Tank", "Truckkort", "Kran", "Digitalt förarkort"];

const TopBar = () => (
  <div style={{ height: 60, borderBottom: "1px solid var(--line)", background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12 }}>S</div><span style={{ fontWeight: 800, fontSize: 15, color: "var(--ink-900)", letterSpacing: 0.5 }}>STP</span></div>
    <a href="#" style={{ fontSize: 13, color: "var(--ink-500)", fontWeight: 600 }}>Hoppa över</a>
  </div>
);
const ChoiceCard = ({ icon, label, desc, selected, onClick }) => (
  <button onClick={onClick} style={{ width: "100%", display: "flex", gap: 16, alignItems: "center", padding: "20px 22px", borderRadius: 14, textAlign: "left", background: selected ? "var(--green-tint)" : "var(--card)", border: `1.5px solid ${selected ? "var(--green)" : "var(--line-2)"}`, boxShadow: selected ? "0 2px 8px rgba(30,107,91,0.12)" : "var(--sh-sm)" }}>
    <span style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: selected ? "var(--green)" : "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={icon} size={22} color={selected ? "#fff" : "var(--green-text)"} stroke={2} /></span>
    <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-900)" }}>{label}</div><div style={{ fontSize: 13.5, color: "var(--ink-500)", marginTop: 3, lineHeight: 1.5 }}>{desc}</div></div>
    <span style={{ width: 24, height: 24, borderRadius: 12, flexShrink: 0, border: `2px solid ${selected ? "var(--green)" : "var(--line-2)"}`, background: selected ? "var(--green)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{selected && <Icon name="check" size={12} color="#fff" stroke={3} />}</span>
  </button>
);

export default function OnboardingForarePreview() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [segment, setSegment] = useState("");
  const [licenses, setLicenses] = useState([]);
  const [certs, setCerts] = useState([]);
  const [region, setRegion] = useState("");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const toggle = (arr, set, val) => set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  const canNext = step === 0 ? true : step === 1 ? !!segment : step === 2 ? licenses.length > 0 : step === 3 ? (!!region && name.trim().length > 0) : step === 4 ? summary.trim().length >= 20 : true;
  const next = () => { if (step < STEPS.length - 1) setStep(step + 1); else setDone(true); };

  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", flexDirection: "column" }}>
        <TopBar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
          <Card padding="48px 44px" style={{ maxWidth: 560, textAlign: "center" }}>
            <div style={{ width: 76, height: 76, borderRadius: 38, margin: "0 auto 24px", background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={36} color="var(--success)" stroke={3} /></div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 10 }}>Din profil är klar, {name.split(" ")[0] || "förare"}!</h1>
            <p style={{ fontSize: 15, color: "var(--ink-500)", lineHeight: 1.6, marginBottom: 28, textWrap: "pretty" }}>Du är nu synlig för åkerier som rekryterar i {region}. Här är vad som händer nu:</p>
            <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
              {[{ icon: "msg", title: "Åkerier kontaktar dig", text: "Via chatt direkt på plattformen — du slipper lägga ut ditt nummer publikt." }, { icon: "bell", title: "Jobbrekommendationer", text: `När ett nytt jobb i ${region} matchar dina körkort får du en notis.` }, { icon: "user", title: "Stärk profilen vidare", text: "Lägg till erfarenhet och certifikatdatum för att synas ännu mer." }].map((b) => (
                <div key={b.title} style={{ display: "flex", gap: 13, alignItems: "flex-start", background: "var(--card-2)", borderRadius: 11, padding: "14px 16px" }}>
                  <span style={{ width: 36, height: 36, borderRadius: 9, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={b.icon} size={16} color="var(--green-text)" stroke={2} /></span>
                  <div><div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>{b.title}</div><div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2, lineHeight: 1.5 }}>{b.text}</div></div>
                </div>
              ))}
            </div>
            <Button variant="primary" size="lg" full iconRight={<Icon name="arrow" size={15} stroke={2.2} />}>Till lediga jobb</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", flexDirection: "column" }}>
      <TopBar />
      <div style={{ maxWidth: 620, width: "100%", margin: "0 auto", padding: "32px 24px 40px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>{STEPS.map((s, i) => <div key={s.id} style={{ height: 4, flex: 1, borderRadius: 2, background: i <= step ? "var(--green)" : "var(--line-2)", transition: "background .3s" }} />)}</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-500)", fontWeight: 600, marginBottom: 32 }}>Steg {step + 1} av {STEPS.length} · {STEPS[step].label}</div>

        <div className="stp-fade-up" key={step} style={{ flex: 1 }}>
          {step === 0 && (
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -1, lineHeight: 1.15, marginBottom: 12 }}>Välkommen till STP</h1>
              <p style={{ fontSize: 16, color: "var(--ink-500)", lineHeight: 1.6, marginBottom: 32, textWrap: "pretty" }}>Sveriges transportplattform kopplar ihop dig med seriösa åkerier — utan mellanhänder och utan CV. Det tar två minuter att komma igång.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[{ icon: "search", title: "Automatisk matchning", text: "Vi matchar dig mot jobb baserat på körkort, region och vad du söker." }, { icon: "eye", title: "Synlig för åkerier", text: "Åkerier hittar din profil när de rekryterar i din region." }, { icon: "msg", title: "Bli kontaktad direkt", text: "Inget CV-skickande. Åkerier chattar med dig när de vill veta mer." }].map((b) => (
                  <div key={b.title} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 18px", boxShadow: "var(--sh-sm)" }}>
                    <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={b.icon} size={18} color="var(--green-text)" stroke={2} /></span>
                    <div><div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-900)" }}>{b.title}</div><div style={{ fontSize: 13.5, color: "var(--ink-500)", marginTop: 2, lineHeight: 1.5 }}>{b.text}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === 1 && (
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 10 }}>Vad söker du?</h1>
              <p style={{ fontSize: 15, color: "var(--ink-500)", marginBottom: 28 }}>Så matchar vi dig mot rätt sorts tjänster.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <ChoiceCard icon="building" label="Fast heltid" desc="Fast anställning på ett åkeri — trygghet, kollektivavtal." selected={segment === "fulltime"} onClick={() => setSegment("fulltime")} />
                <ChoiceCard icon="cal" label="Vikarie / Extra" desc="Vikariat, extrapass, deltid eller pensionär som vill köra lite." selected={segment === "flex"} onClick={() => setSegment("flex")} />
                <ChoiceCard icon="star" label="Praktikplats" desc="Gymnasieskola, Komvux eller Arbetsförmedlingens utbildning." selected={segment === "internship"} onClick={() => setSegment("internship")} />
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 10 }}>Vilka körkort har du?</h1>
              <p style={{ fontSize: 15, color: "var(--ink-500)", marginBottom: 24 }}>Välj alla som gäller — de är det viktigaste för matchningen.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
                {LICENSES.map((l) => {
                  const sel = licenses.includes(l.c);
                  return <button key={l.c} onClick={() => toggle(licenses, setLicenses, l.c)} style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px 16px", borderRadius: 12, textAlign: "left", background: sel ? "var(--green)" : "var(--card)", border: `1.5px solid ${sel ? "var(--green-deep)" : "var(--line-2)"}`, boxShadow: sel ? "0 2px 6px rgba(30,107,91,0.2)" : "var(--sh-sm)" }}><span style={{ fontSize: 17, fontWeight: 800, color: sel ? "#fff" : "var(--ink-900)", minWidth: 34 }}>{l.c}</span><span style={{ fontSize: 12.5, color: sel ? "rgba(255,255,255,0.85)" : "var(--ink-500)" }}>{l.d}</span></button>;
                })}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-700)", marginBottom: 10 }}>Certifikat (valfritt)</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{CERTS.map((ct) => { const sel = certs.includes(ct); return <button key={ct} onClick={() => toggle(certs, setCerts, ct)} style={{ padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, background: sel ? "var(--green-tint)" : "var(--card)", color: sel ? "var(--green-text)" : "var(--ink-700)", border: `1px solid ${sel ? "var(--green)" : "var(--line-2)"}` }}>{ct}</button>; })}</div>
            </div>
          )}
          {step === 3 && (
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 10 }}>Vem är du och var?</h1>
              <p style={{ fontSize: 15, color: "var(--ink-500)", marginBottom: 28 }}>Så åkerier vet vem de pratar med och var du finns.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-700)" }}>Ditt namn</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="För- och efternamn" style={{ padding: "13px 16px", borderRadius: 11, background: "var(--card)", border: "1px solid var(--line-2)", fontSize: 15, color: "var(--ink-900)", outline: "none", fontFamily: "var(--font)", boxShadow: "var(--sh-sm)" }} />
                </label>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-700)", marginBottom: 10 }}>Din region</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{REGIONS.map((r) => { const sel = region === r; return <button key={r} onClick={() => setRegion(r)} style={{ padding: "9px 15px", borderRadius: 999, fontSize: 13.5, fontWeight: 600, background: sel ? "var(--green)" : "var(--card)", color: sel ? "#fff" : "var(--ink-700)", border: `1px solid ${sel ? "var(--green-deep)" : "var(--line-2)"}`, boxShadow: sel ? "0 1px 3px rgba(30,107,91,0.2)" : "var(--sh-sm)" }}>{r}</button>; })}</div>
                </div>
              </div>
            </div>
          )}
          {step === 4 && (
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 10 }}>Presentera dig kort</h1>
              <p style={{ fontSize: 15, color: "var(--ink-500)", marginBottom: 24 }}>Ett par rader om din erfarenhet — det här är det första åkerier läser.</p>
              <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={5} placeholder="T.ex: Erfaren CE-chaufför med 11 års vana av fjärrkörning, främst tank. Punktlig, dokumenterar noggrant, söker fast tjänst med bra schemaplanering." style={{ width: "100%", padding: "16px", borderRadius: 12, background: "var(--card)", border: "1px solid var(--line-2)", fontSize: 15, color: "var(--ink-900)", outline: "none", fontFamily: "var(--font)", lineHeight: 1.6, resize: "vertical", boxShadow: "var(--sh-sm)" }} />
              <div style={{ fontSize: 12.5, color: summary.trim().length >= 20 ? "var(--success)" : "var(--ink-400)", marginTop: 8, fontWeight: 600 }}>{summary.trim().length >= 20 ? "✓ Bra! Det räcker." : `Skriv minst ${20 - summary.trim().length} tecken till.`}</div>
              <div style={{ marginTop: 28, background: "var(--card-2)", borderRadius: 12, padding: "18px 20px" }}>
                <SectionLabel>Din profil hittills</SectionLabel>
                {[{ label: "Namn", done: name.trim().length > 0 }, { label: "Körkort valt", done: licenses.length > 0 }, { label: "Region vald", done: !!region }, { label: "Söker-typ vald", done: !!segment }, { label: "Presentation", done: summary.trim().length >= 20 }].map((c) => (
                  <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
                    <span style={{ width: 18, height: 18, borderRadius: 9, background: c.done ? "var(--success-tint)" : "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>{c.done && <Icon name="check" size={10} color="var(--success)" stroke={3} />}</span>
                    <span style={{ fontSize: 13.5, color: c.done ? "var(--ink-700)" : "var(--ink-400)", fontWeight: 500 }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
          {step > 0 ? <Button variant="ghost" size="md" onClick={() => setStep(Math.max(0, step - 1))} icon={<Icon name="arrowLeft" size={14} stroke={2} />}>Tillbaka</Button> : <span />}
          <Button variant="primary" size="md" onClick={next} disabled={!canNext} iconRight={<Icon name="arrow" size={14} stroke={2.2} />}>{step === STEPS.length - 1 ? "Skapa profil" : "Fortsätt"}</Button>
        </div>
      </div>
    </div>
  );
}
