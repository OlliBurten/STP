// STP Mobile — driver onboarding wizard. Ported from STP Mobil Förare Onboarding,
// wired to the real profile. Completing it sets name/phone/licenses/primarySegment/
// region/regionsWilling via updateProfile → clears needsDriverOnboarding and lets
// OnboardingGate through. Renders for mobile drivers at /onboarding/forare.
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import MobileShell from "../MobileShell";
import { Icon, Label, Button } from "../ui";

const CITIES = [
  ["Stockholm", "Stockholm"], ["Göteborg", "Västra Götaland"], ["Malmö", "Skåne"], ["Uppsala", "Uppsala"],
  ["Västerås", "Västmanland"], ["Örebro", "Örebro"], ["Linköping", "Östergötland"], ["Helsingborg", "Skåne"],
  ["Norrköping", "Östergötland"], ["Jönköping", "Jönköping"], ["Lund", "Skåne"], ["Umeå", "Västerbotten"],
  ["Gävle", "Gävleborg"], ["Borås", "Västra Götaland"], ["Södertälje", "Stockholm"], ["Karlstad", "Värmland"],
  ["Växjö", "Kronoberg"], ["Halmstad", "Halland"], ["Sundsvall", "Västernorrland"], ["Luleå", "Norrbotten"],
  ["Trelleborg", "Skåne"], ["Kristianstad", "Skåne"], ["Varberg", "Halland"],
];
const INTENT_TO_SEGMENT = { heltid: "FULLTIME", deltid: "FLEX", praktik: "INTERNSHIP" };

export default function DriverOnboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile?.name || user?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [lic, setLic] = useState(Array.isArray(profile?.licenses) ? profile.licenses : []);
  const [regions, setRegions] = useState(Array.isArray(profile?.regionsWilling) ? profile.regionsWilling : []);
  const [cityQ, setCityQ] = useState("");
  const [intent, setIntent] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggleLic = (l) => setLic((s) => (s.includes(l) ? s.filter((x) => x !== l) : [...s, l]));
  const toggleIntent = (i) => setIntent((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  const addCity = (c) => { const v = (c || "").trim(); if (!v) return; setRegions((s) => (s.some((x) => x.toLowerCase() === v.toLowerCase()) ? s : [...s, v])); setCityQ(""); };
  const removeCity = (c) => setRegions((s) => s.filter((x) => x !== c));

  const STEPS = 3;
  const canNext = step === 0
    ? name.trim().length > 1 && phone.replace(/\D/g, "").length >= 7
    : step === 1 ? lic.length > 0 : (regions.length > 0 && intent.length > 0);
  const nextHint = step === 0
    ? "Fyll i namn och telefonnummer"
    : step === 1 ? "Välj minst ett körkort" : "Välj minst en ort och vad du söker";

  const finish = async () => {
    setBusy(true);
    setError("");
    const primarySegment = INTENT_TO_SEGMENT[intent[0]] || "FULLTIME";
    const region = regions[0] || "";
    // Onboardingen är medvetet lättviktig (3 steg), men backend rensar bara
    // needsDriverOnboarding när minimiprofilen är komplett — den kräver även
    // location, availability och summary. Härled dem (utan att skriva över
    // befintliga värden för en återvändande förare) så att en slutförd
    // onboarding faktiskt markeras klar; annars hamnar man i onboardingen igen
    // vid nästa inloggning.
    const intentLabel = intent.includes("heltid") ? "heltidsjobb" : intent.includes("deltid") ? "deltid eller extrajobb" : "praktikplats";
    const genSummary = `Yrkesförare${lic.length ? ` med ${lic.join(", ")}-behörighet` : ""}. Söker ${intentLabel}${regions.length ? ` i ${regions.join(", ")}` : ""}.`;
    const keepSummary = String(profile?.summary || "").trim().length >= 20;
    try {
      await updateProfile({
        name: name.trim(), phone: phone.trim(), licenses: lic, regionsWilling: regions, region, primarySegment,
        location: String(profile?.location || "").trim() || regions[0] || region,
        availability: String(profile?.availability || "").trim() || "Omgående",
        summary: keepSummary ? profile.summary : genSummary,
      });
    } catch {
      // Sparningen misslyckades (t.ex. offline). Stanna kvar på steget så att
      // föraren kan försöka igen — navigera INTE vidare, annars tror föraren
      // att profilen sparats medan needsDriverOnboarding aldrig rensas och de
      // bounce:as tillbaka in i onboardingen vid nästa start.
      setError("Kunde inte spara. Kontrollera din uppkoppling och försök igen.");
      setBusy(false);
      return;
    }
    setBusy(false);
    // Återför till jobbet föraren ville ansöka på (satt via gate → auth → state),
    // annars hem. Ignorera publika/auth-vägar som return-mål.
    const from = location.state?.from;
    const returnTo = from && from.startsWith("/jobb") ? from : "/hem";
    navigate(returnTo, { replace: true });
  };
  const next = () => { if (step < STEPS - 1) setStep(step + 1); else finish(); };
  const back = () => step > 0 && setStep(step - 1);

  const Chip = ({ active, onClick, children }) => (
    <button onClick={onClick} aria-pressed={active} className="press" style={{ padding: "12px 18px", borderRadius: 13, fontWeight: 700, fontSize: 15, background: active ? "var(--green)" : "#fff", color: active ? "#fff" : "var(--ink-800)", border: `1.5px solid ${active ? "var(--green-deep)" : "var(--line-2)"}` }}>{children}</button>
  );

  const q = cityQ.trim().toLowerCase();
  const sugg = q ? CITIES.filter(([n]) => !regions.some((r) => r.toLowerCase() === n.toLowerCase()) && n.toLowerCase().includes(q)).slice(0, 6) : [];
  const exact = CITIES.some(([n]) => n.toLowerCase() === q) || regions.some((r) => r.toLowerCase() === q);
  const POP = ["Stockholm", "Göteborg", "Malmö", "Uppsala", "Örebro"];

  return (
    <MobileShell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 18px 0", flexShrink: 0 }}>
        <button onClick={back} className="press" style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", opacity: step > 0 ? 1 : 0, pointerEvents: step > 0 ? "auto" : "none" }}><Icon name="arrowLeft" size={22} color="var(--ink-900)" stroke={2.2} /></button>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
          <div style={{ display: "flex", gap: 6 }}>{[0, 1, 2].map((i) => <span key={i} style={{ width: i === step ? 22 : 7, height: 7, borderRadius: 4, background: i === step ? "var(--green)" : i < step ? "var(--green-soft)" : "var(--ink-200)", transition: "all .25s" }} />)}</div>
          <span aria-live="polite" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-400)", letterSpacing: 0.1 }}>{`Steg ${step + 1} av ${STEPS}`}</span>
        </div>
        <div style={{ width: 36, flexShrink: 0 }} />
      </div>
      <div className="app-scroll" key={step} style={{ flex: 1, overflowY: "auto", padding: "24px 24px 12px" }}>
        <div className="tab-enter">
          {step === 0 && (
            <>
              <div style={{ width: 54, height: 54, borderRadius: 15, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.2)" }}><Icon name="truck" size={28} color="#fff" stroke={2} /></div>
              <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.7, color: "var(--ink-900)", lineHeight: 1.15, marginBottom: 8 }}>Välkommen till STP</h1>
              <p style={{ fontSize: 15.5, color: "var(--ink-500)", lineHeight: 1.5, marginBottom: 26 }}>Sveriges plattform för yrkesförare. Vi behöver bara tre saker för att börja visa jobb som passar dig.</p>
              <Label style={{ marginBottom: 9 }}>Fullständigt namn</Label>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="För- och efternamn" style={{ width: "100%", height: 54, padding: "0 16px", borderRadius: 13, border: "1px solid var(--line-2)", background: "#fff", fontSize: 17, color: "var(--ink-900)", outline: "none", marginBottom: 18 }} />
              <Label style={{ marginBottom: 9 }}>Ditt mobilnummer</Label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="070-123 45 67" style={{ width: "100%", height: 54, padding: "0 16px", borderRadius: 13, border: "1px solid var(--line-2)", background: "#fff", fontSize: 17, color: "var(--ink-900)", outline: "none", marginBottom: 14 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 14px", background: "var(--info-tint)", borderRadius: 12 }}>
                <Icon name="info" size={17} color="var(--info)" stroke={2} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: "var(--ink-700)", lineHeight: 1.4 }}>Ditt nummer visas aldrig publikt – det används bara så åkerier kan kontakta dig om ett jobb.</span>
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.7, color: "var(--ink-900)", lineHeight: 1.15, marginBottom: 8 }}>Vilka körkort har du?</h1>
              <p style={{ fontSize: 15.5, color: "var(--ink-500)", lineHeight: 1.5, marginBottom: 24 }}>Det här styr vilka jobb vi matchar dig mot. Välj alla du har.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>{["B", "C1", "C1E", "C", "CE"].map((l) => <Chip key={l} active={lic.includes(l)} onClick={() => toggleLic(l)}>{l}</Chip>)}</div>
              <p style={{ fontSize: 13, color: "var(--ink-400)", marginTop: 18, lineHeight: 1.5 }}>Certifikat som YKB och ADR lägger du till senare i din profil.</p>
            </>
          )}
          {step === 2 && (
            <>
              <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.7, color: "var(--ink-900)", lineHeight: 1.15, marginBottom: 8 }}>Var vill du köra?</h1>
              <p style={{ fontSize: 15.5, color: "var(--ink-500)", lineHeight: 1.5, marginBottom: 18 }}>Lägg till en eller flera orter – vi visar jobb där först.</p>
              {regions.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 13 }}>
                  {regions.map((c) => <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 8px 8px 12px", borderRadius: 11, background: "var(--green-tint)", border: "1px solid var(--green)", color: "var(--green-text)", fontWeight: 700, fontSize: 14.5 }}><Icon name="pin" size={13} color="var(--green-text)" stroke={2.2} />{c}<button onClick={() => removeCity(c)} className="press" style={{ display: "flex", width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", background: "rgba(15,63,60,0.1)" }}><Icon name="x" size={13} color="var(--green-text)" stroke={2.6} /></button></span>)}
                </div>
              )}
              <div style={{ position: "relative", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, height: 54, padding: "0 16px", borderRadius: 13, border: `1px solid ${q ? "var(--green)" : "var(--line-2)"}`, background: "#fff" }}>
                  <Icon name="search" size={19} color="var(--ink-400)" stroke={2} />
                  <input value={cityQ} onChange={(e) => setCityQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { if (sugg.length) addCity(sugg[0][0]); else if (q && !exact) addCity(cityQ.trim()); } }} placeholder={regions.length ? "Lägg till fler orter…" : "Skriv en ort, t.ex. Stockholm"} style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 16, color: "var(--ink-900)" }} />
                  {cityQ && <button onClick={() => setCityQ("")} className="press" style={{ display: "flex" }}><Icon name="x" size={17} color="var(--ink-400)" stroke={2.2} /></button>}
                </div>
                {q && (sugg.length > 0 || !exact) && (
                  <div style={{ position: "absolute", top: 60, left: 0, right: 0, zIndex: 5, background: "#fff", borderRadius: 13, border: "1px solid var(--line-2)", boxShadow: "var(--sh-md)", overflow: "hidden" }}>
                    {sugg.map(([n, r], i) => <button key={n} onClick={() => addCity(n)} className="press" style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "12px 15px", borderBottom: (i < sugg.length - 1 || !exact) ? "1px solid var(--line)" : "none", textAlign: "left", background: "#fff" }}><Icon name="pin" size={17} color="var(--ink-400)" stroke={2} /><span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "var(--ink-900)" }}>{n}</span><span style={{ fontSize: 12.5, color: "var(--ink-400)" }}>{r}</span></button>)}
                    {!exact && q && <button onClick={() => addCity(cityQ.trim())} className="press" style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "12px 15px", textAlign: "left", background: "#fff" }}><Icon name="plus" size={17} color="var(--green)" stroke={2.4} /><span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-900)" }}>Lägg till ”{cityQ.trim()}”</span></button>}
                  </div>
                )}
              </div>
              {!q && (
                <div style={{ marginBottom: 22 }}>
                  <Label style={{ marginBottom: 10 }}>{regions.length ? "Lägg till fler" : "Populära"}</Label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>{POP.filter((c) => !regions.includes(c)).map((c) => <button key={c} onClick={() => addCity(c)} className="press" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 11, background: "#fff", border: "1px solid var(--line-2)", fontWeight: 600, fontSize: 14.5, color: "var(--ink-800)" }}><Icon name="plus" size={14} color="var(--ink-400)" stroke={2.4} />{c}</button>)}</div>
                </div>
              )}
              <Label style={{ marginBottom: 11 }}>Vad söker du?</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>{[["heltid", "Heltid"], ["deltid", "Deltid / extra"], ["praktik", "Praktik"]].map(([id, l]) => <Chip key={id} active={intent.includes(id)} onClick={() => toggleIntent(id)}>{l}</Chip>)}</div>
            </>
          )}
        </div>
      </div>
      <div style={{ padding: "12px 22px calc(22px + var(--stpm-safe-bottom))", flexShrink: 0 }}>
        {error && (
          <div role="alert" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 13px", marginBottom: 11, background: "var(--danger-tint, #fbeceb)", border: "1px solid var(--danger, #d4503e)", borderRadius: 11 }}>
            <Icon name="info" size={16} color="var(--danger, #d4503e)" stroke={2.2} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "var(--ink-700)", lineHeight: 1.4 }}>{error}</span>
          </div>
        )}
        {!canNext && !error && (
          <p style={{ fontSize: 13, color: "var(--ink-400)", textAlign: "center", marginBottom: 10, lineHeight: 1.4 }}>{nextHint}</p>
        )}
        <Button variant="primary" size="lg" full busy={busy} disabled={!canNext} onClick={next} iconRight={!busy && step < STEPS - 1 ? <Icon name="arrow" size={18} stroke={2.2} /> : !busy ? <Icon name="check" size={18} stroke={2.5} /> : undefined}>{step < STEPS - 1 ? "Fortsätt" : "Kom igång"}</Button>
      </div>
    </MobileShell>
  );
}
