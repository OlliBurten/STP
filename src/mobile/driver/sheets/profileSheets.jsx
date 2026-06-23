// Driver — profile & account sheets. Ported from STP Mobil Förare.
// Wired to the real profile where a backend exists; prototype-only flows
// (password change, photo upload, PDF/share link, AI letter) are kept as UI
// and flagged for the review pass.
import React, { useState } from "react";
import { Icon, Label, Field, Button, Switch, Pill, SheetBack } from "../../ui";
import { PRO_LIC } from "../licenseUtils";
import { changePassword, deleteMyAccount } from "../../../api/auth";
import { generateCoverLetter } from "../../../api/ai";
import { exportMyData } from "../../../api/profile";
import { apiBlob } from "../../../api/client";

const POPULAR_CITIES = ["Stockholm", "Göteborg", "Malmö", "Uppsala", "Helsingborg", "Lund", "Örebro", "Linköping"];

/* ---- Edit profile (name, place, licenses, experience) ---- */
export function EditProfileSheet({ ctx, close }) {
  const p = ctx.profile;
  const [name, setName] = useState(p.name || "");
  const [loc, setLoc] = useState(p.location || "");
  const [region, setRegion] = useState(p.region || "");
  const [lic, setLic] = useState(Array.isArray(p.licenses) ? p.licenses : []);
  const [exp, setExp] = useState(Array.isArray(p.experience) ? p.experience : []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const nowY = new Date().getFullYear();
  const YEARS = []; for (let y = nowY; y >= 1985; y--) YEARS.push(y);

  const toggleLic = (l) => setLic((s) => (s.includes(l) ? s.filter((x) => x !== l) : [...s, l]));
  const addExp = () => setExp([...exp, { id: `exp-${Date.now()}`, role: "", company: "", startYear: nowY, endYear: nowY, current: true }]);
  const upExp = (i, k, v) => setExp(exp.map((e, idx) => (idx === i ? { ...e, [k]: v } : e)));
  const rmExp = (i) => setExp(exp.filter((_, idx) => idx !== i));
  const save = async () => {
    // EN enda uppdatering — tidigare två samtidiga updateProfile-anrop (ett utan
    // erfarenheten) tävlade, och fel anrop kunde vinna → tillagd erfarenhet
    // försvann. Skicka allt i samma payload.
    setBusy(true); setErr("");
    try {
      await ctx.updateProfile({ name, location: loc, region, licenses: lic, experience: exp.filter((e) => e.role || e.company) });
      close();
    } catch {
      setErr("Kunde inte spara. Försök igen.");
      setBusy(false);
    }
  };
  const selStyle = { flex: 1, minWidth: 0, height: 42, padding: "0 10px", border: "1px solid var(--line-2)", borderRadius: 9, background: "#fff", outline: "none", fontSize: 14, color: "var(--ink-800)", WebkitAppearance: "none", appearance: "none" };

  return (
    <div style={{ padding: "4px 22px 26px" }}>
      <Field label="Namn" value={name} onChange={setName} />
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><Field label="Ort" value={loc} onChange={setLoc} /></div>
        <div style={{ flex: 1 }}><Field label="Län" value={region} onChange={setRegion} /></div>
      </div>
      <Label style={{ margin: "4px 0 8px" }}>Körkort</Label>
      <div style={{ display: "flex", gap: 7, marginBottom: 22 }}>
        {PRO_LIC.map((l) => { const on = lic.includes(l); return <button key={l} onClick={() => toggleLic(l)} className="press" style={{ flex: 1, height: 46, borderRadius: 11, background: on ? "var(--green)" : "#fff", border: on ? "1px solid var(--green-deep)" : "1px solid var(--line-2)", color: on ? "#fff" : "var(--ink-400)", fontWeight: 800, fontSize: 14 }}>{l}</button>; })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 11 }}>
        <Label>Erfarenhet</Label>
        <button onClick={addExp} className="press" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 700, color: "var(--green)" }}><Icon name="plus" size={15} stroke={2.4} />Lägg till</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {exp.length === 0 && <p style={{ fontSize: 13.5, color: "var(--ink-400)", textAlign: "center", padding: "6px 0" }}>Inga rader än – lägg till din erfarenhet.</p>}
        {exp.map((e, i) => (
          <div key={e.id || i} style={{ padding: "14px", background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 13, position: "relative" }}>
            <button onClick={() => rmExp(i)} className="press" aria-label="Ta bort erfarenhet" style={{ position: "absolute", top: -10, right: -10, width: 30, height: 30, borderRadius: 15, background: "#fff", border: "1px solid var(--line-2)", boxShadow: "var(--sh-sm)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 }}><Icon name="x" size={15} color="var(--danger)" stroke={2.6} /></button>
            <input value={e.role || e.title || ""} onChange={(ev) => upExp(i, "role", ev.target.value)} placeholder="Roll, t.ex. Fjärrförare" style={{ width: "100%", height: 42, padding: "0 12px", border: "1px solid var(--line-2)", borderRadius: 9, background: "#fff", outline: "none", fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)", marginBottom: 8, paddingRight: 38 }} />
            <input value={e.company || ""} onChange={(ev) => upExp(i, "company", ev.target.value)} placeholder="Företag" style={{ width: "100%", height: 42, padding: "0 12px", border: "1px solid var(--line-2)", borderRadius: 9, background: "#fff", outline: "none", fontSize: 13.5, color: "var(--ink-700)", marginBottom: 12 }} />
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
              <select value={e.startYear || nowY} onChange={(ev) => upExp(i, "startYear", +ev.target.value)} style={selStyle}>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}</select>
              <span style={{ color: "var(--ink-400)", fontSize: 13 }}>–</span>
              {e.current ? <div style={{ ...selStyle, display: "flex", alignItems: "center", color: "var(--ink-400)" }}>Nu</div> : <select value={e.endYear || nowY} onChange={(ev) => upExp(i, "endYear", +ev.target.value)} style={selStyle}>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}</select>}
            </div>
            <div onClick={() => upExp(i, "current", !e.current)} className="press" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "2px 0", cursor: "pointer" }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-800)" }}>Jobbar här nu</span>
              <Switch on={!!e.current} onToggle={() => upExp(i, "current", !e.current)} />
            </div>
          </div>
        ))}
      </div>
      {err && <p style={{ fontSize: 12.5, color: "var(--danger)", marginBottom: 12 }}>{err}</p>}
      <Button variant="primary" size="lg" full busy={busy} disabled={busy} onClick={save}>Spara profil</Button>
    </div>
  );
}

/* ---- Settings ---- */
export function SettingsSheet({ ctx, close }) {
  const Row = ({ label, sub, right, danger, onClick, last }) => {
    const inner = (<>
      <div><div style={{ fontSize: 14.5, fontWeight: 600, color: danger ? "var(--danger)" : "var(--ink-900)" }}>{label}</div>{sub && <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 1 }}>{sub}</div>}</div>
      {right || (!danger && onClick && <Icon name="chevRight" size={18} color="var(--ink-300)" stroke={2.2} />)}
    </>);
    const style = { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: last ? "none" : "1px solid var(--line)", textAlign: "left" };
    return onClick
      ? <button onClick={onClick} className="press" style={style}>{inner}</button>
      : <div style={style}>{inner}</div>;
  };
  return (
    <div style={{ padding: "0 22px 26px" }}>
      <Label style={{ margin: "0 0 2px" }}>Tillgänglighet</Label>
      <Row label="Söker aktivt jobb" sub="Av när du har jobb – då syns du inte" right={<Switch on={ctx.seeking} onToggle={() => ctx.setSeeking((v) => !v)} />} last />
      <Label style={{ margin: "20px 0 2px" }}>Notiser</Label>
      <Row label="Matchande jobb" right={<Switch on={ctx.notif.match} onToggle={() => ctx.setNotif((n) => ({ ...n, match: !n.match }))} />} />
      <Row label="Meddelanden" right={<Switch on={ctx.notif.msg} onToggle={() => ctx.setNotif((n) => ({ ...n, msg: !n.msg }))} />} />
      <Row label="Veckosammanfattning" right={<Switch on={ctx.notif.weekly} onToggle={() => ctx.setNotif((n) => ({ ...n, weekly: !n.weekly }))} />} last />
      <Label style={{ margin: "20px 0 2px" }}>Konto</Label>
      <Row label="Personuppgifter" onClick={() => ctx.setSheet({ type: "personal" })} />
      <Row label="Byt lösenord" onClick={() => ctx.setSheet({ type: "password" })} />
      <Row label="Integritet & data" onClick={() => ctx.setSheet({ type: "privacy" })} />
      <Row label="Visa introduktion igen" onClick={() => { close(); ctx.navigate?.("/onboarding/forare"); }} last />
      <div style={{ marginTop: 20 }}><Row label="Logga ut" danger last onClick={() => ctx.setSheet({ type: "logout" })} /></div>
      {ctx.user?.email && <p style={{ textAlign: "center", fontSize: 11.5, color: "var(--ink-400)", marginTop: 18 }}>Inloggad som {ctx.user.email}</p>}
    </div>
  );
}

/* ---- Personal details ---- */
export function PersonalSheet({ ctx, close }) {
  const p = ctx.profile;
  const [name, setName] = useState(p.name || "");
  const [phone, setPhone] = useState(p.phone || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const save = async () => {
    setBusy(true); setErr("");
    try {
      await ctx.updateProfile({ name, phone });
      close();
    } catch {
      setErr("Kunde inte spara. Försök igen.");
      setBusy(false);
    }
  };
  return (
    <div style={{ padding: "4px 22px 26px" }}>
      <SheetBack label="Inställningar" onBack={() => ctx.setSheet({ type: "settings" })} />
      <Field label="Fullständigt namn" value={name} onChange={setName} />
      <div style={{ marginBottom: 16 }}>
        <Label style={{ marginBottom: 8 }}>E-post</Label>
        <div style={{ width: "100%", minHeight: 50, padding: "0 15px", display: "flex", alignItems: "center", borderRadius: 12, border: "1px solid var(--line)", background: "var(--card-2)", fontSize: 15.5, color: "var(--ink-400)" }}>{ctx.user?.email || "—"}</div>
        <div style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 6, lineHeight: 1.4 }}>Kontakta support för att byta e-post.</div>
      </div>
      <Field label="Telefon" type="tel" inputMode="tel" value={phone} onChange={setPhone} />
      {err && <p style={{ fontSize: 12.5, color: "var(--danger)", marginBottom: 12 }}>{err}</p>}
      <Button variant="primary" size="lg" full busy={busy} disabled={busy} onClick={save}>Spara ändringar</Button>
    </div>
  );
}

/* ---- Password change → POST /api/auth/change-password ---- */
export function PasswordSheet({ ctx, close }) {
  const [cur, setCur] = useState("");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const ok = cur.length > 0 && a.length >= 8 && a === b;
  const submit = async () => {
    setBusy(true); setErr("");
    try { await changePassword(cur, a); setDone(true); }
    catch (e) { setErr(e?.message || "Kunde inte byta lösenord."); }
    finally { setBusy(false); }
  };
  if (done) {
    return (
      <div style={{ padding: "36px 30px 52px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ width: 74, height: 74, borderRadius: 24, background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center", animation: "stpm-pop .5s" }}><Icon name="check" size={36} color="var(--success)" stroke={2.5} /></div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink-900)" }}>Lösenordet uppdaterat</h2>
        <p style={{ fontSize: 14, color: "var(--ink-500)", lineHeight: 1.5, maxWidth: 250 }}>Använd ditt nya lösenord nästa gång du loggar in.</p>
        <Button variant="secondary" size="lg" full onClick={close} style={{ marginTop: 8 }}>Klar</Button>
      </div>
    );
  }
  return (
    <div style={{ padding: "4px 22px 26px" }}>
      <SheetBack label="Inställningar" onBack={() => ctx.setSheet({ type: "settings" })} />
      <Field label="Nuvarande lösenord" type="password" value={cur} onChange={setCur} />
      <Field label="Nytt lösenord" type="password" value={a} onChange={setA} sub="Minst 8 tecken" />
      <Field label="Upprepa nytt lösenord" type="password" value={b} onChange={setB} />
      {b && a !== b && <p style={{ fontSize: 12.5, color: "var(--danger)", marginTop: -8, marginBottom: 14 }}>Lösenorden matchar inte.</p>}
      {err && <p style={{ fontSize: 12.5, color: "var(--danger)", marginBottom: 12 }}>{err}</p>}
      <Button variant="primary" size="lg" full disabled={!ok} busy={busy} onClick={submit}>Uppdatera lösenord</Button>
    </div>
  );
}

/* ---- Privacy → visibleToCompanies + data export + account deletion ---- */
export function PrivacySheet({ ctx, close }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, setBusy] = useState(false);
  const Row = ({ label, sub, right, danger, last, onClick }) => {
    const inner = (<>
      <div><div style={{ fontSize: 14.5, fontWeight: 600, color: danger ? "var(--danger)" : "var(--ink-900)" }}>{label}</div>{sub && <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 1 }}>{sub}</div>}</div>
      {right || (!danger && onClick && <Icon name="chevRight" size={18} color="var(--ink-300)" stroke={2.2} />)}
    </>);
    const style = { width: "100%", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: last ? "none" : "1px solid var(--line)" };
    return onClick
      ? <button onClick={onClick} className="press" style={{ ...style, cursor: "pointer" }}>{inner}</button>
      : <div style={style}>{inner}</div>;
  };
  const exportData = async () => {
    let data;
    try { data = ctx.hasApi ? await exportMyData() : { profile: ctx.profile, exportedAt: new Date().toISOString() }; }
    catch { data = { profile: ctx.profile, exportedAt: new Date().toISOString() }; }
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "stp-mina-data.json"; a.click();
    URL.revokeObjectURL(url);
  };
  const removeAccount = async () => {
    setBusy(true);
    try { await deleteMyAccount(); ctx.logout?.(); ctx.navigate?.("/"); }
    catch { setBusy(false); }
  };
  return (
    <div style={{ padding: "0 22px 26px" }}>
      <SheetBack label="Inställningar" onBack={() => ctx.setSheet({ type: "settings" })} />
      <Label style={{ margin: "0 0 2px" }}>Synlighet</Label>
      <Row label="Sökbar för åkerier" sub="Åkerier kan hitta din profil" right={<Switch on={ctx.searchable} onToggle={() => ctx.setSearchable((v) => !v)} />} last />
      <Label style={{ margin: "20px 0 2px" }}>Dina data</Label>
      <Row label="Ladda ner mina data" sub="Få en kopia (JSON)" onClick={exportData} />
      {confirmDel ? (
        <div style={{ padding: "14px 0" }}>
          <p style={{ fontSize: 13.5, color: "var(--ink-700)", lineHeight: 1.5, marginBottom: 12 }}>Detta raderar ditt konto och all din data permanent. Det går inte att ångra.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" size="md" onClick={() => setConfirmDel(false)} style={{ flex: 1 }}>Avbryt</Button>
            <Button variant="danger" size="md" busy={busy} onClick={removeAccount} style={{ flex: 1 }}>Radera permanent</Button>
          </div>
        </div>
      ) : (
        <Row label="Radera konto" danger last onClick={() => setConfirmDel(true)} />
      )}
      <p style={{ textAlign: "center", fontSize: 11.5, color: "var(--ink-400)", marginTop: 18, lineHeight: 1.5 }}>Vi följer GDPR. Du äger din data och kan exportera eller radera den när som helst.</p>
    </div>
  );
}

/* ---- Photo upload → profile.photoUrl (resized data-URL) ---- */
function fileToResizedDataUrl(file, max = 512) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PhotoSheet({ ctx, close }) {
  const p = ctx.profile;
  const [busy, setBusy] = useState(false);
  const inputRef = React.useRef(null);
  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      await ctx.updateProfile({ photoUrl: dataUrl });
      close();
    } catch { setBusy(false); }
  };
  return (
    <div style={{ padding: "4px 22px 30px" }}>
      <input ref={inputRef} type="file" accept="image/*" onChange={onPick} style={{ display: "none" }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "6px 0 22px" }}>
        <div style={{ width: 104, height: 104, borderRadius: "50%", overflow: "hidden", background: p.photoUrl ? "transparent" : "var(--paper-2)", border: p.photoUrl ? "none" : "1px dashed var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {p.photoUrl ? <img src={p.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Icon name="user" size={44} color="var(--ink-300)" stroke={1.5} />}
        </div>
        <p style={{ fontSize: 13, color: "var(--ink-500)", textAlign: "center", maxWidth: 240, lineHeight: 1.45 }}>En tydlig bild på dig ökar svaren från åkerier.</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Button variant="primary" size="lg" full busy={busy} icon={!busy ? <Icon name="plus" size={18} stroke={2.2} /> : undefined} onClick={() => inputRef.current?.click()}>Välj bild</Button>
        {p.photoUrl && <Button variant="secondary" size="lg" full onClick={() => { ctx.updateProfile({ photoUrl: null }); close(); }}>Ta bort bild</Button>}
      </div>
    </div>
  );
}

/* ---- Driving preferences → regionsWilling ---- */
export function PrefsSheet({ ctx, close }) {
  const [cities, setCities] = useState(Array.isArray(ctx.profile.regionsWilling) ? ctx.profile.regionsWilling : []);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const add = (n) => { const v = (n || "").trim(); if (v && !cities.some((c) => c.toLowerCase() === v.toLowerCase())) setCities([...cities, v]); setQ(""); };
  const rm = (n) => setCities(cities.filter((c) => c !== n));
  const savePrefs = async () => {
    setBusy(true); setErr("");
    try {
      await ctx.savePrefs(cities);
      close();
    } catch {
      setErr("Kunde inte spara. Försök igen.");
      setBusy(false);
    }
  };
  return (
    <div style={{ padding: "4px 22px 26px" }}>
      <p style={{ fontSize: 14, color: "var(--ink-500)", lineHeight: 1.5, marginBottom: 16 }}>Lägg till en eller flera orter – vi visar jobb där först.</p>
      {cities.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 13 }}>
          {cities.map((c) => <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 8px 8px 12px", borderRadius: 11, background: "var(--green-tint)", border: "1px solid var(--green)", color: "var(--green-text)", fontWeight: 700, fontSize: 14 }}><Icon name="pin" size={13} color="var(--green-text)" stroke={2.2} />{c}<button onClick={() => rm(c)} className="press" style={{ display: "flex", width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", background: "rgba(15,63,60,0.1)" }}><Icon name="x" size={13} color="var(--green-text)" stroke={2.6} /></button></span>)}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, height: 52, padding: "0 15px", borderRadius: 13, border: `1px solid ${q ? "var(--green)" : "var(--line-2)"}`, background: "#fff", marginBottom: 16 }}>
        <Icon name="search" size={19} color="var(--ink-400)" stroke={2} />
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add(q)} placeholder={cities.length ? "Lägg till fler orter…" : "Skriv en ort, t.ex. Stockholm"} style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 16, color: "var(--ink-900)" }} />
        {q && <button onClick={() => add(q)} className="press" style={{ fontSize: 13, fontWeight: 800, color: "var(--green)" }}>Lägg till</button>}
      </div>
      {!q && (
        <div style={{ marginBottom: 20 }}>
          <Label style={{ marginBottom: 10 }}>{cities.length ? "Lägg till fler" : "Populära"}</Label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>{POPULAR_CITIES.filter((c) => !cities.includes(c)).map((c) => <button key={c} onClick={() => add(c)} className="press" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 11, background: "#fff", border: "1px solid var(--line-2)", fontWeight: 600, fontSize: 14.5, color: "var(--ink-800)" }}><Icon name="plus" size={14} color="var(--ink-400)" stroke={2.4} />{c}</button>)}</div>
        </div>
      )}
      {err && <p style={{ fontSize: 12.5, color: "var(--danger)", marginBottom: 12 }}>{err}</p>}
      <Button variant="primary" size="lg" full disabled={!cities.length || busy} busy={busy} onClick={savePrefs}>Spara {cities.length || ""} {cities.length === 1 ? "ort" : "orter"}</Button>
    </div>
  );
}

/* ---- Add certificate ---- */
const DOC_TYPES = [["YKB", "Yrkeskompetensbevis"], ["ADR", "Tank / styckegods"], ["Truckkort", "Truckförarbevis"], ["Kran", "Kranförarbevis"], ["Hjullastare", "Hjullastarutbildning"], ["APV_Steg1", "Arbete på väg"]];
export function AddDocSheet({ ctx, close }) {
  const [type, setType] = useState(null);
  const [expiry, setExpiry] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const add = async () => {
    setBusy(true); setErr("");
    try {
      await ctx.addDocument(type[0], expiry || undefined);
      close();
    } catch {
      setErr("Kunde inte spara. Försök igen.");
      setBusy(false);
    }
  };
  return (
    <div style={{ padding: "4px 22px 26px" }}>
      <Label style={{ marginBottom: 11 }}>Välj behörighet</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
        {DOC_TYPES.map((t) => { const on = type && type[0] === t[0]; return (
          <button key={t[0]} onClick={() => setType(t)} className="press" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px", background: on ? "var(--green-tint)" : "var(--card-2)", border: `1px solid ${on ? "var(--green)" : "var(--line)"}`, borderRadius: 13, textAlign: "left" }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: "#fff", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="file" size={18} color="var(--ink-500)" stroke={1.8} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>{t[0]}</div><div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{t[1]}</div></div>
            {on && <Icon name="check" size={18} color="var(--green)" stroke={2.6} />}
          </button>
        ); })}
      </div>
      <Label style={{ marginBottom: 8 }}>Giltigt t.o.m. <span style={{ textTransform: "none", fontWeight: 500, color: "var(--ink-400)" }}>(valfritt)</span></Label>
      <input type="date" min={today} value={expiry} onChange={(e) => setExpiry(e.target.value)} style={{ width: "100%", height: 50, padding: "0 15px", borderRadius: 12, border: "1px solid var(--line-2)", background: "#fff", fontSize: 15.5, color: "var(--ink-900)", outline: "none", marginBottom: 8 }} />
      <p style={{ fontSize: 12.5, color: "var(--ink-400)", lineHeight: 1.45, marginBottom: 18 }}>Ange giltighetsdatum så ser åkerier att din behörighet är aktuell. Utan datum visas den som angiven men inte verifierad.</p>
      {err && <p style={{ fontSize: 12.5, color: "var(--danger)", marginBottom: 12 }}>{err}</p>}
      <Button variant="primary" size="lg" full disabled={!type || busy} busy={busy} icon={!busy ? <Icon name="plus" size={18} stroke={2.2} /> : undefined} onClick={add}>Lägg till behörighet</Button>
    </div>
  );
}

/* ---- Certificate detail + remove ---- */
export function DocDetailSheet({ doc, ctx, close }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, setBusy] = useState(false);
  const toneFor = { verified: "success", expiring: "amber", expired: "danger", listed: "neutral" }[doc.status] || "neutral";
  const labelFor = { verified: "Giltigt", expiring: "Går snart ut", expired: "Utgånget", listed: "Tillagd" }[doc.status] || "Tillagd";
  const removeDoc = async () => {
    setBusy(true);
    try { await ctx.removeDocument(doc.id); close(); }
    catch { setBusy(false); }
  };
  return (
    <div style={{ padding: "4px 22px 26px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 18 }}>
        <div style={{ width: 54, height: 54, borderRadius: 14, background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="file" size={24} color="var(--ink-500)" stroke={1.7} /></div>
        <div style={{ flex: 1 }}><h2 style={{ fontSize: 19, fontWeight: 800, color: "var(--ink-900)" }}>{doc.name}</h2><div style={{ fontSize: 13.5, color: "var(--ink-500)" }}>{doc.detail}</div></div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 14px", background: "var(--card-2)", borderRadius: 12, border: "1px solid var(--line)" }}>
          <span style={{ fontSize: 13.5, color: "var(--ink-500)" }}>Status</span>
          <Pill tone={toneFor} size="sm">{labelFor}</Pill>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 14px", background: "var(--card-2)", borderRadius: 12, border: "1px solid var(--line)" }}>
          <span style={{ fontSize: 13.5, color: "var(--ink-500)" }}>Giltighet</span>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-900)" }}>{doc.expiry}</span>
        </div>
      </div>
      {confirmDel ? (
        <div>
          <p style={{ fontSize: 13.5, color: "var(--ink-700)", lineHeight: 1.5, marginBottom: 12 }}>Ta bort {doc.name}? Behörigheten försvinner från din profil.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" size="lg" style={{ flex: 1 }} onClick={() => setConfirmDel(false)}>Avbryt</Button>
            <Button variant="danger" size="lg" busy={busy} style={{ flex: 1 }} onClick={removeDoc}>Ta bort</Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" size="lg" icon={<Icon name="refresh" size={17} stroke={2} />} style={{ flex: 1 }} onClick={() => ctx.setSheet({ type: "renew", doc })}>Förnya</Button>
          <Button variant="danger" size="lg" icon={<Icon name="x" size={17} stroke={2.2} />} style={{ flex: 1 }} onClick={() => setConfirmDel(true)}>Ta bort</Button>
        </div>
      )}
    </div>
  );
}

/* ---- Renew a certificate (update its expiry) ---- */
export function RenewSheet({ doc, ctx, close }) {
  const [expiry, setExpiry] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div style={{ padding: "4px 22px 26px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "14px", background: doc.status === "expired" ? "var(--danger-tint)" : "var(--amber-tint)", borderRadius: 13, marginBottom: 16 }}>
        <Icon name="alert" size={20} color={doc.status === "expired" ? "var(--danger)" : "var(--amber-deep)"} stroke={2} />
        <div><div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink-900)" }}>{doc.name}</div><div style={{ fontSize: 12.5, color: "var(--ink-700)" }}>{doc.expiry}</div></div>
      </div>
      <p style={{ fontSize: 14, color: "var(--ink-700)", lineHeight: 1.55, marginBottom: 16 }}>Ange det nya giltighetsdatumet för ditt {doc.name}.</p>
      <Label style={{ marginBottom: 8 }}>Nytt giltighetsdatum</Label>
      <input type="date" min={today} value={expiry} onChange={(e) => setExpiry(e.target.value)} style={{ width: "100%", height: 50, padding: "0 15px", borderRadius: 12, border: "1px solid var(--line-2)", background: "#fff", fontSize: 15.5, color: "var(--ink-900)", outline: "none", marginBottom: 18 }} />
      <Button variant="primary" size="lg" full disabled={!expiry} icon={<Icon name="check" size={18} stroke={2.5} />} onClick={() => { ctx.renewDocument(doc.id, expiry); close(); }}>Markera som förnyat</Button>
    </div>
  );
}

/* ---- Share CV (link/PDF stubs — flagged) ---- */
export function ShareSheet({ ctx, close }) {
  const [copied, setCopied] = useState(false);
  // Real public profile URL: prefer the persisted slug, else the user id.
  const origin = typeof window !== "undefined" ? window.location.origin : "https://transportplattformen.se";
  const handle = ctx.profile.slug || ctx.user?.id;
  const link = `${origin}/forare/${handle}`;
  const [pdfBusy, setPdfBusy] = useState(false);
  const share = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: "Min STP-profil", url: link }); return; }
      await navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };
  const downloadPdf = async () => {
    if (!ctx.hasApi) { window.open(link, "_blank"); return; }
    setPdfBusy(true);
    try {
      const blob = await apiBlob("/api/profile/cv.pdf");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "stp-cv.pdf"; a.click();
      URL.revokeObjectURL(url);
    } catch { window.open(link, "_blank"); } finally { setPdfBusy(false); }
  };
  return (
    <div style={{ padding: "0 22px 26px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 0 18px" }}>
        <div style={{ width: 108, height: 108, borderRadius: 18, background: "var(--card-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}><Icon name="award" size={46} color="var(--green)" stroke={1.4} /></div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink-900)" }}>{ctx.profile.name || "Din profil"}</div>
        <div style={{ fontSize: 13, color: "var(--ink-500)" }}>Förare{Array.isArray(ctx.profile.licenses) && ctx.profile.licenses.length ? ` · ${ctx.profile.licenses.join(" ")}` : ""}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--card-2)", border: "1px solid var(--line-2)", borderRadius: 12, marginBottom: 14 }}>
        <Icon name="link" size={17} color="var(--ink-400)" stroke={2} />
        <span style={{ flex: 1, fontSize: 13.5, color: "var(--ink-700)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link}</span>
        <button onClick={() => { try { navigator.clipboard?.writeText(link); } catch { /* */ } setCopied(true); setTimeout(() => setCopied(false), 1500); }} style={{ fontSize: 13, fontWeight: 800, color: "var(--green)" }}>{copied ? "Kopierad!" : "Kopiera"}</button>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Button variant="secondary" size="lg" busy={pdfBusy} icon={!pdfBusy ? <Icon name="download" size={17} stroke={2} /> : undefined} style={{ flex: 1 }} onClick={downloadPdf}>PDF</Button>
        <Button variant="primary" size="lg" icon={<Icon name="share" size={17} stroke={2} />} style={{ flex: 2 }} onClick={share}>Dela länk</Button>
      </div>
      <p style={{ textAlign: "center", fontSize: 12, color: "var(--ink-400)", marginTop: 14, lineHeight: 1.5 }}>Åkerier kan se din profil utan konto. Du styr vad som visas.</p>
    </div>
  );
}

/* ---- AI cover letter → POST /api/ai/cover-letter (local fallback) ---- */
export function AiSheet({ ctx, close }) {
  const [letter, setLetter] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const p = ctx.profile;
  const localDraft = () => `Hej,\n\nJag är förare${Array.isArray(p.licenses) && p.licenses.length ? ` med ${p.licenses.join(" ")}-behörighet` : ""}${ctx.expYears ? ` och ${ctx.expYears} års erfarenhet` : ""}. Jag är van vid att ta ansvar för både fordon och leverans och söker nya körningar${p.region ? ` i ${p.region}` : ""}.\n\nMed vänlig hälsning,\n${p.name || ""}`;
  const generate = async () => {
    setBusy(true);
    try {
      const res = ctx.hasApi ? await generateCoverLetter({}) : null;
      setLetter(res?.letter || localDraft());
    } catch {
      setLetter(localDraft());
    } finally {
      setBusy(false);
    }
  };
  return (
    <div style={{ padding: "0 22px 26px" }}>
      {!letter ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--amber-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="spark" size={22} color="var(--amber-deep)" stroke={0} style={{ fill: "var(--amber-deep)" }} /></div>
            <div><div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink-900)" }}>Personligt brev</div><div style={{ fontSize: 13, color: "var(--ink-500)" }}>Skapas från din profil med AI</div></div>
          </div>
          <Button variant="primary" size="lg" full busy={busy} onClick={generate} icon={!busy ? <Icon name="spark" size={17} stroke={0} style={{ fill: "#fff" }} /> : undefined}>Skapa brev</Button>
        </>
      ) : (
        <>
          <div style={{ padding: "16px", background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 13, fontSize: 14, color: "var(--ink-700)", lineHeight: 1.6, marginBottom: 16, whiteSpace: "pre-wrap" }}>{letter}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" size="lg" onClick={generate} busy={busy} style={{ flex: 1 }}>Gör om</Button>
            <Button variant="primary" size="lg" onClick={() => { try { navigator.clipboard?.writeText(letter); } catch { /* */ } setCopied(true); setTimeout(close, 700); }} icon={<Icon name="check" size={17} stroke={2.5} />} style={{ flex: 1 }}>{copied ? "Kopierad!" : "Kopiera"}</Button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---- Logout ---- */
export function LogoutSheet({ ctx, close }) {
  return (
    <div style={{ padding: "4px 22px 26px" }}>
      <p style={{ fontSize: 15, color: "var(--ink-700)", lineHeight: 1.55, marginBottom: 20 }}>Vill du logga ut från STP? Du kan logga in igen när som helst.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Button variant="danger" size="lg" full icon={<Icon name="logout" size={18} stroke={2.1} />} onClick={() => { close(); ctx.logout?.(); ctx.navigate?.("/"); }}>Logga ut</Button>
        <Button variant="secondary" size="lg" full onClick={close}>Avbryt</Button>
      </div>
    </div>
  );
}
