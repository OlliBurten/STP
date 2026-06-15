/* ════════════════════════════════════════════════════════════
   PROOF-SKÄRM — Åkeri Onboarding (standalone wizard), portad från
   "STP (4)/STP Åkeri Onboarding Ljust.html".
   Egen TopBar (standalone-flöde, ingen app-nav). Route: /preview/akeri/onboarding
════════════════════════════════════════════════════════════ */
import { useState } from "react";
import { Card, Button, Icon, Field } from "../../../components/ui";

const STEPS = [{ id: "welcome", label: "Välkommen" }, { id: "org", label: "Företag" }, { id: "segments", label: "Inriktning" }, { id: "profile", label: "Profil" }];
const SEGMENTS = [
  { id: "fjarr", label: "Fjärrtransport", desc: "Nationellt & Norden", icon: "truck" },
  { id: "distribution", label: "Distribution", desc: "Lokala leveranser", icon: "building" },
  { id: "tank", label: "Tank & ADR", desc: "Farligt gods", icon: "alert" },
  { id: "bygg", label: "Bygg & schakt", desc: "Tippbil, kran", icon: "settings" },
  { id: "skog", label: "Skog & timmer", desc: "Skogstransport", icon: "info" },
  { id: "special", label: "Specialtransport", desc: "Tunga & långa", icon: "star" },
];
const REGIONS = ["Skåne", "Stockholm", "Västra Götaland", "Halland", "Östergötland", "Norrbotten", "Uppsala", "Värmland"];
const SIZES = [{ v: "1-5", l: "1–5 förare" }, { v: "6-20", l: "6–20 förare" }, { v: "21-50", l: "21–50 förare" }, { v: "50+", l: "50+ förare" }];

const TopBar = () => (
  <div style={{ height: 60, borderBottom: "1px solid var(--line)", background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12 }}>S</div>
      <span style={{ fontWeight: 800, fontSize: 15, color: "var(--ink-900)", letterSpacing: 0.5 }}>STP</span>
      <span style={{ fontSize: 11, color: "var(--ink-500)", paddingLeft: 8, marginLeft: 4, borderLeft: "1px solid var(--line-2)", fontWeight: 600, letterSpacing: 0.5 }}>Åkeri</span>
    </div>
    <a href="#" style={{ fontSize: 13, color: "var(--ink-500)", fontWeight: 600 }}>Spara & avsluta</a>
  </div>
);

export default function AkeriOnboardingPreview() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [orgNr, setOrgNr] = useState("");
  const [fetched, setFetched] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [segments, setSegments] = useState([]);
  const [regions, setRegions] = useState([]);
  const [size, setSize] = useState("");
  const toggle = (arr, set, v) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const runFetch = () => { if (orgNr.replace(/\D/g, "").length < 6) return; setFetching(true); setFetched(false); setTimeout(() => { setFetching(false); setFetched(true); }, 1100); };
  const canNext = step === 0 ? true : step === 1 ? fetched : step === 2 ? segments.length > 0 : step === 3 ? (regions.length > 0 && !!size) : true;
  const next = () => { if (step < STEPS.length - 1) setStep(step + 1); else setDone(true); };

  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
        <style>{`@keyframes stp-spin{to{transform:rotate(360deg)}}`}</style>
        <TopBar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
          <Card padding="48px 44px" style={{ maxWidth: 560, textAlign: "center" }}>
            <div style={{ width: 76, height: 76, borderRadius: 38, margin: "0 auto 24px", background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={36} color="var(--success)" stroke={3} /></div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 10 }}>Kontot är skapat!</h1>
            <p style={{ fontSize: 15, color: "var(--ink-500)", lineHeight: 1.6, marginBottom: 28 }}>Nu kan ni publicera er första annons och börja matchas mot förare. Verifiera åkeriet för att synas ännu mer.</p>
            <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {[{ icon: "plus", title: "Publicera er första annons", text: "Det tar några minuter och matchas direkt mot förare." }, { icon: "check", title: "Verifiera åkeriet", text: "Verifierade åkerier får ~40 % fler ansökningar." }, { icon: "search", title: "Sök bland förare", text: "Bläddra bland tillgängliga förare i era regioner." }].map((b) => (
                <div key={b.title} style={{ display: "flex", gap: 13, alignItems: "flex-start", background: "var(--card-2)", borderRadius: 11, padding: "14px 16px" }}>
                  <span style={{ width: 36, height: 36, borderRadius: 9, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={b.icon} size={16} color="var(--green-text)" stroke={2} /></span>
                  <div><div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>{b.title}</div><div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2, lineHeight: 1.5 }}>{b.text}</div></div>
                </div>
              ))}
            </div>
            <Button variant="primary" size="lg" full iconRight={<Icon name="arrow" size={15} stroke={2.2} />}>Publicera första annonsen</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", flexDirection: "column" }}>
      <style>{`@keyframes stp-spin{to{transform:rotate(360deg)}}`}</style>
      <TopBar />
      <div style={{ maxWidth: 620, width: "100%", margin: "0 auto", padding: "32px 24px 40px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>{STEPS.map((s, i) => <div key={s.id} style={{ height: 4, flex: 1, borderRadius: 2, background: i <= step ? "var(--green)" : "var(--line-2)", transition: "background .3s" }} />)}</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-500)", fontWeight: 600, marginBottom: 32 }}>Steg {step + 1} av {STEPS.length} · {STEPS[step].label}</div>

        <div className="stp-fade-up" key={step} style={{ flex: 1 }}>
          {step === 0 && (
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -1, lineHeight: 1.15, marginBottom: 12 }}>Välkomna till STP</h1>
              <p style={{ fontSize: 16, color: "var(--ink-500)", lineHeight: 1.6, marginBottom: 32, textWrap: "pretty" }}>Hitta rätt förare utan mellanhänder. Vi matchar era annonser mot kvalificerade, sökande förare i era regioner.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[{ icon: "search", title: "Sök bland aktiva förare", text: "Se vilka som söker just nu — filtrera på körkort, certifikat och region." }, { icon: "msg", title: "Direktkontakt", text: "Chatta direkt med kandidater. Inga rekryteringsbyråer, inga provisioner." }, { icon: "check", title: "Verifierade profiler", text: "Körkort och certifikat är samlade och tydliga." }].map((b) => (
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
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 10 }}>Ert företag</h1>
              <p style={{ fontSize: 15, color: "var(--ink-500)", marginBottom: 28 }}>Skriv ert organisationsnummer — vi hämtar resten automatiskt från Bolagsverket.</p>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-700)", marginBottom: 8 }}>Organisationsnummer</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                <input value={orgNr} onChange={(e) => { setOrgNr(e.target.value); setFetched(false); }} placeholder="556677-8899" style={{ flex: 1, padding: "13px 16px", borderRadius: 11, background: "var(--card)", border: "1px solid var(--line-2)", fontSize: 15, color: "var(--ink-900)", outline: "none", fontFamily: "var(--mono)", boxShadow: "var(--sh-sm)" }} />
                <Button variant="secondary" size="lg" onClick={runFetch} disabled={fetching}>{fetching ? "Hämtar…" : "Hämta"}</Button>
              </div>
              {fetching && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 18px", color: "var(--ink-500)", fontSize: 14 }}>
                  <span style={{ width: 16, height: 16, border: "2px solid var(--line-2)", borderTopColor: "var(--green)", borderRadius: "50%", display: "inline-block", animation: "stp-spin .7s linear infinite" }} />
                  Slår upp mot Bolagsverket…
                </div>
              )}
              {fetched && (
                <Card padding="20px 22px" style={{ background: "var(--green-tint)", borderColor: "var(--green-tint-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><Icon name="check" size={16} color="var(--success)" stroke={3} /><span style={{ fontSize: 13, fontWeight: 700, color: "var(--success)" }}>Hittat hos Bolagsverket</span></div>
                  <p style={{ fontSize: 13, color: "var(--ink-600)", marginBottom: 12 }}>Stämmer det här? Då är ni snart klara.</p>
                  <Field label="Företagsnamn" value="Nordic Transport AB" />
                  <Field label="Säte" value="Malmö, Skåne" />
                  <Field label="Registrerat" value="1987" mono />
                  <Field label="Status" value="Aktivt · F-skatt registrerad" />
                </Card>
              )}
            </div>
          )}
          {step === 2 && (
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 10 }}>Vad kör ni?</h1>
              <p style={{ fontSize: 15, color: "var(--ink-500)", marginBottom: 24 }}>Välj era inriktningar — det hjälper oss matcha rätt förare.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {SEGMENTS.map((s) => {
                  const sel = segments.includes(s.id);
                  return (
                    <button key={s.id} onClick={() => toggle(segments, setSegments, s.id)} style={{ display: "flex", gap: 12, alignItems: "center", padding: "16px 16px", borderRadius: 12, textAlign: "left", background: sel ? "var(--green-tint)" : "var(--card)", border: `1.5px solid ${sel ? "var(--green)" : "var(--line-2)"}`, boxShadow: sel ? "0 2px 6px rgba(30,107,91,0.12)" : "var(--sh-sm)" }}>
                      <span style={{ width: 40, height: 40, borderRadius: 10, background: sel ? "var(--green)" : "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={s.icon} size={18} color={sel ? "#fff" : "var(--green-text)"} stroke={2} /></span>
                      <div><div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>{s.label}</div><div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 1 }}>{s.desc}</div></div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 10 }}>Var och hur stora?</h1>
              <p style={{ fontSize: 15, color: "var(--ink-500)", marginBottom: 28 }}>Så vi visar er för rätt förare.</p>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-700)", marginBottom: 10 }}>Regioner ni verkar i</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
                {REGIONS.map((r) => {
                  const sel = regions.includes(r);
                  return <button key={r} onClick={() => toggle(regions, setRegions, r)} style={{ padding: "9px 15px", borderRadius: 999, fontSize: 13.5, fontWeight: 600, background: sel ? "var(--green)" : "var(--card)", color: sel ? "#fff" : "var(--ink-700)", border: `1px solid ${sel ? "var(--green-deep)" : "var(--line-2)"}`, boxShadow: sel ? "0 1px 3px rgba(30,107,91,0.2)" : "var(--sh-sm)" }}>{r}</button>;
                })}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-700)", marginBottom: 10 }}>Antal förare</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SIZES.map((s) => <button key={s.v} onClick={() => setSize(s.v)} style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13.5, fontWeight: 600, background: size === s.v ? "var(--green)" : "var(--card)", color: size === s.v ? "#fff" : "var(--ink-700)", border: `1px solid ${size === s.v ? "var(--green-deep)" : "var(--line-2)"}`, boxShadow: "var(--sh-sm)" }}>{s.l}</button>)}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
          {step > 0 ? <Button variant="ghost" size="md" onClick={() => setStep(step - 1)} icon={<Icon name="arrowLeft" size={14} stroke={2} />}>Tillbaka</Button> : <span />}
          <Button variant="primary" size="md" onClick={next} disabled={!canNext} iconRight={<Icon name="arrow" size={14} stroke={2.2} />}>{step === STEPS.length - 1 ? "Skapa konto" : "Fortsätt"}</Button>
        </div>
      </div>
    </div>
  );
}
