import { useEffect, useState, useCallback } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { changePassword, deleteMyAccount } from "../api/auth.js";
import { updateNotificationSettings, fetchProfile, updateProfile } from "../api/profile.js";
import { updateCompanyNotificationSettings, fetchMyCompanyProfile, listInvites, createInvite, revokeInvite } from "../api/companies.js";
import PageMeta from "../components/PageMeta";

// ─── Icons ────────────────────────────────────────────────────────────────────
const IC = {
  user:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  bell:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  lock:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  shield:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  search:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  check:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  upload:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  building: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>,
  eye:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeoff:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  mail:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  trash:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
};
const Icon = ({ n, s = 16, c = "currentColor" }) => <span style={{ display: "inline-flex", width: s, height: s, color: c, flexShrink: 0 }}>{IC[n]}</span>;

// ─── Primitives ───────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
  return (
    <div onClick={disabled ? undefined : onChange} style={{ width: 44, height: 24, borderRadius: 12, background: checked ? "#F5A623" : "rgba(255,255,255,0.1)", cursor: disabled ? "default" : "pointer", position: "relative", transition: "background .2s", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 2, left: checked ? 22 : 2, width: 18, height: 18, borderRadius: 9, background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
    </div>
  );
}

const inputStyle = { width: "100%", padding: "11px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0faf9", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };

function Field({ label, sub, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "rgba(240,250,249,0.85)", marginBottom: sub ? 2 : 7 }}>{label}</label>
      {sub && <div style={{ fontSize: 12, color: "rgba(240,250,249,0.45)", marginBottom: 7 }}>{sub}</div>}
      {children}
    </div>
  );
}

function Card({ title, sub, children, danger }) {
  return (
    <div style={{ background: danger ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.03)", border: `1px solid ${danger ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)"}`, borderRadius: 16, padding: "24px 28px", marginBottom: 16 }}>
      {title && (
        <div style={{ marginBottom: sub ? 4 : 18 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: danger ? "#ef4444" : "#f0faf9", letterSpacing: -0.3, margin: 0 }}>{title}</h3>
          {sub && <p style={{ fontSize: 13, color: "rgba(240,250,249,0.5)", marginTop: 5, lineHeight: 1.5 }}>{sub}</p>}
        </div>
      )}
      {sub && <div style={{ marginTop: 14 }} />}
      {children}
    </div>
  );
}

function ToggleRow({ label, sub, on, onChange, first }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "13px 0", borderTop: first ? "none" : "1px solid rgba(255,255,255,0.04)", gap: 24 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#f0faf9" }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "rgba(240,250,249,0.5)", marginTop: 2 }}>{sub}</div>}
      </div>
      <Toggle checked={on} onChange={onChange} />
    </div>
  );
}

// ─── Delete Account Dialog ────────────────────────────────────────────────────
function DeleteAccountDialog({ isCompany, onClose, onConfirm, loading }) {
  const [input, setInput] = useState("");
  const confirmed = input === "RADERA";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#0d1f1f", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 16, padding: "32px 28px", maxWidth: 440, width: "100%" }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "#ef4444", margin: "0 0 10px", letterSpacing: -0.5 }}>
          {isCompany ? "Ta bort företagskonto" : "Ta bort mitt konto"}
        </h2>
        <p style={{ fontSize: 14, color: "rgba(240,250,249,0.65)", lineHeight: 1.6, margin: "0 0 22px" }}>
          Detta är <strong style={{ color: "#f0faf9" }}>permanent och kan inte ångras</strong>. All data — {isCompany ? "annonser, konversationer och teammedlemmar" : "ansökningar, meddelanden och din profil"} — raderas omedelbart.
        </p>
        <Field label='Skriv "RADERA" för att bekräfta'>
          <input
            style={{ ...inputStyle, border: confirmed ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)" }}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="RADERA"
            autoFocus
          />
        </Field>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{ flex: 1, padding: "11px 16px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(240,250,249,0.8)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!confirmed || loading}
            style={{ flex: 1, padding: "11px 16px", borderRadius: 10, background: confirmed ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.06)", border: `1px solid ${confirmed ? "rgba(239,68,68,0.5)" : "rgba(239,68,68,0.15)"}`, color: confirmed ? "#ef4444" : "rgba(239,68,68,0.4)", fontWeight: 700, fontSize: 13, cursor: confirmed && !loading ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all .15s" }}
          >
            {loading ? "Raderar…" : "Radera permanent"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Password card ────────────────────────────────────────────────────────────
function PasswordCard() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (form.next.length < 8) { setError("Lösenordet måste vara minst 8 tecken."); return; }
    if (form.next !== form.confirm) { setError("Lösenorden matchar inte."); return; }
    setLoading(true);
    try {
      await changePassword(form.current, form.next);
      setSuccess("Lösenordet har uppdaterats.");
      setForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      setError(err.message || "Kunde inte uppdatera lösenordet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Lösenord">
      <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
        {error && <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontSize: 13, color: "#f87171", marginBottom: 14 }}>{error}</div>}
        {success && <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", fontSize: 13, color: "#4ade80", marginBottom: 14 }}>{success}</div>}
        <Field label="Nuvarande lösenord">
          <div style={{ position: "relative" }}>
            <input type={showCurrent ? "text" : "password"} value={form.current} onChange={e => setForm(p => ({ ...p, current: e.target.value }))} style={{ ...inputStyle, paddingRight: 44 }} />
            <button type="button" onClick={() => setShowCurrent(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(240,250,249,0.4)", display: "flex" }}><Icon n={showCurrent ? "eyeoff" : "eye"} s={16} /></button>
          </div>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Nytt lösenord">
            <div style={{ position: "relative" }}>
              <input type={showNext ? "text" : "password"} value={form.next} onChange={e => setForm(p => ({ ...p, next: e.target.value }))} placeholder="Minst 8 tecken" style={{ ...inputStyle, paddingRight: 44 }} />
              <button type="button" onClick={() => setShowNext(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(240,250,249,0.4)", display: "flex" }}><Icon n={showNext ? "eyeoff" : "eye"} s={16} /></button>
            </div>
          </Field>
          <Field label="Bekräfta nytt">
            <input type={showNext ? "text" : "password"} value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} style={inputStyle} />
          </Field>
        </div>
        <button type="submit" disabled={loading} style={{ padding: "10px 18px", borderRadius: 10, background: "#1F5F5C", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, fontFamily: "inherit", marginTop: 4 }}>
          {loading ? "Sparar…" : "Uppdatera lösenord"}
        </button>
      </form>
    </Card>
  );
}

// ─── Driver Konto ─────────────────────────────────────────────────────────────
function DriverKontoSection({ user, profile }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const nameParts = (user?.name || "").split(" ");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteMyAccount();
      logout();
      navigate("/", { replace: true });
    } catch (err) {
      setDeleteLoading(false);
      alert(err.message || "Kunde inte radera kontot. Försök igen eller kontakta support.");
    }
  };

  return (
    <>
      {showDeleteDialog && (
        <DeleteAccountDialog
          isCompany={false}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}

      <Card title="Personuppgifter" sub="Grundläggande kontoinformation. Kontakta /profil för att redigera telefon, ort och mer.">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Förnamn">
            <input style={{ ...inputStyle, color: "rgba(240,250,249,0.6)" }} value={nameParts[0] || ""} disabled title="Ändra via Support" />
          </Field>
          <Field label="Efternamn">
            <input style={{ ...inputStyle, color: "rgba(240,250,249,0.6)" }} value={nameParts.slice(1).join(" ") || ""} disabled title="Ändra via Support" />
          </Field>
        </div>
        <Field label="E-post" sub="Kontakta support om du behöver byta e-post.">
          <input style={{ ...inputStyle, color: "rgba(240,250,249,0.5)" }} value={user?.email || ""} disabled />
        </Field>
        <div style={{ marginTop: 4 }}>
          <Link to="/profil" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 13, fontWeight: 600, color: "rgba(240,250,249,0.75)", textDecoration: "none" }}>
            Redigera profil (telefon, ort, erfarenhet m.m.) →
          </Link>
        </div>
      </Card>

      <PasswordCard />

      <DriverAnstallningsSection profile={profile} />

      <Card title="Ta bort konto" sub="Detta är permanent. Alla dina ansökningar och meddelanden raderas." danger>
        <button
          type="button"
          onClick={() => setShowDeleteDialog(true)}
          style={{ padding: "10px 18px", borderRadius: 10, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
        >
          Ta bort mitt konto
        </button>
      </Card>
    </>
  );
}

// ─── Driver Anställningsform-preferens ────────────────────────────────────────
const EMPLOY_OPTS = [
  ["fast",         "Fast anställning"],
  ["vikariat",     "Vikariat"],
  ["timjobb",      "Timjobb"],
  ["egenanstald",  "Egenanställd"],
];

function DriverAnstallningsSection({ profile }) {
  const [employment, setEmployment] = useState(profile?.preferredEmployment || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const toggle = (arr, v) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      await updateProfile({ preferredEmployment: employment });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || "Kunde inte spara.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Vad letar du efter?" sub="Vilken typ av anställning är du intresserad av?">
      {error && <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontSize: 13, color: "#f87171", marginBottom: 14 }}>{error}</div>}
      <Field label="Anställningsform">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {EMPLOY_OPTS.map(([v, l]) => {
            const on = employment.includes(v);
            return (
              <button
                key={v}
                type="button"
                onClick={() => setEmployment(toggle(employment, v))}
                style={{ padding: "8px 16px", borderRadius: 99, background: on ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${on ? "rgba(245,166,35,0.4)" : "rgba(255,255,255,0.08)"}`, fontSize: 13, fontWeight: 600, color: on ? "#F5A623" : "rgba(240,250,249,0.7)", cursor: "pointer", fontFamily: "inherit" }}
              >
                {on ? "✓ " : ""}{l}
              </button>
            );
          })}
        </div>
      </Field>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{ padding: "10px 18px", borderRadius: 10, background: "#1F5F5C", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}
      >
        {saved ? <><Icon n="check" s={14} /> Sparat!</> : saving ? "Sparar…" : "Spara preferens"}
      </button>
    </Card>
  );
}

// ─── Driver Verifiering ───────────────────────────────────────────────────────
function DriverVerifieringSection({ profile }) {
  const hasYKB = (profile?.certificates || []).includes("YKB");
  const hasADR = (profile?.certificates || []).includes("ADR");
  const hasLicense = (profile?.licenses || []).length > 0;
  const verifiedCount = [hasLicense, hasYKB, hasADR].filter(Boolean).length;

  const docs = [
    { k: "license", l: "Körkort",        sub: "CE, C eller annan yrkeskörkortsklass.",    verified: hasLicense },
    { k: "ykb",     l: "YKB-certifikat", sub: "Yrkeskompetensbevis. Krävs för C/CE/D/DE.", verified: hasYKB },
    { k: "adr",     l: "ADR-intyg",      sub: "För farligt gods.",                         verified: hasADR },
  ];

  return (
    <>
      <Card title="Verifiering" sub="Verifierade förare får svar 2× snabbare och syns högre i sökresultat.">
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: verifiedCount > 0 ? "rgba(74,222,128,0.06)" : "rgba(245,166,35,0.06)", border: `1px solid ${verifiedCount > 0 ? "rgba(74,222,128,0.2)" : "rgba(245,166,35,0.2)"}`, borderRadius: 11 }}>
          <div style={{ width: 36, height: 36, borderRadius: 99, background: verifiedCount > 0 ? "rgba(74,222,128,0.2)" : "rgba(245,166,35,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon n={verifiedCount > 0 ? "check" : "shield"} s={17} c={verifiedCount > 0 ? "#4ade80" : "#F5A623"} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: verifiedCount > 0 ? "#4ade80" : "#F5A623" }}>
              {verifiedCount > 0 ? "Du har dokument registrerade" : "Inga dokument uppladdade"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(240,250,249,0.6)" }}>
              {verifiedCount} av 3 verifieringssteg slutförda
            </div>
          </div>
        </div>
      </Card>

      <Card title="Mina dokument">
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
          {docs.map(it => (
            <div key={it.k} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 11, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: it.verified ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon n={it.verified ? "check" : "shield"} s={16} c={it.verified ? "#4ade80" : "rgba(240,250,249,0.4)"} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{it.l}</span>
                  {it.verified && <span style={{ padding: "2px 8px", borderRadius: 99, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", fontSize: 10, fontWeight: 800, color: "#4ade80", letterSpacing: 0.5 }}>REGISTRERAT</span>}
                </div>
                <div style={{ fontSize: 12, color: "rgba(240,250,249,0.5)" }}>{it.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "16px 18px", borderRadius: 12, background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", display: "flex", alignItems: "flex-start", gap: 14 }}>
          <Icon n="mail" s={18} c="#F5A623" />
          <div style={{ fontSize: 13, color: "rgba(240,250,249,0.75)", lineHeight: 1.6 }}>
            <strong style={{ color: "#F5A623" }}>Verifiering sker via support.</strong>{" "}
            Skicka dina dokument till{" "}
            <a href="mailto:support@transportplattformen.se" style={{ color: "#F5A623", textDecoration: "underline" }}>
              support@transportplattformen.se
            </a>{" "}
            så hjälper vi dig.
          </div>
        </div>
      </Card>
    </>
  );
}

// ─── Driver Notiser ───────────────────────────────────────────────────────────
const DRIVER_NOTIF = [
  { key: "jobMatch",        label: "Nya jobb som matchar din profil",    sub: "Vi mejlar max 1 gång per dag, även om det dyker upp fler matchningar." },
  { key: "messageReminder", label: "Meddelanden från åkerier",           sub: "Direkt när någon skriver till dig." },
  { key: "statusChanges",   label: "Statusändringar på dina ansökningar", sub: "När åkeri ser, väljer ut, eller går vidare." },
  { key: "newsletter",      label: "Nyhetsbrev",                         sub: "Branschnyheter, lönerapporter, max 1 gång/månad." },
];
const COMPANY_NOTIF = [
  { key: "applicationAlert", label: "Nya ansökningar",         sub: "Direkt när någon söker en av era annonser." },
  { key: "messageReminder",  label: "Meddelanden från förare", sub: "Påminnelse när en konversation väntar." },
  { key: "weekly",           label: "Veckorapport",            sub: "Sammanfattning av visningar och ansökningar — varje måndag." },
  { key: "tips",             label: "Tips för bättre annonser", sub: "När en annons presterar dåligt skickar vi förbättringsförslag." },
];

function NotifSection({ isDriver, initialSettings, onToggle }) {
  const keys = isDriver ? DRIVER_NOTIF : COMPANY_NOTIF;
  return (
    <Card title="Vad vill du få notiser om?" sub="Du har full kontroll. Stäng av allt om du vill — vi spammar aldrig.">
      {keys.map(({ key, label, sub }, i) => {
        const enabled = initialSettings?.[key] !== false;
        return <ToggleRow key={key} label={label} sub={sub} on={enabled} onChange={() => onToggle(key, !enabled)} first={i === 0} />;
      })}
    </Card>
  );
}

// ─── Driver Sekretess ─────────────────────────────────────────────────────────
const VISIBILITY_OPTS = [
  { v: "open",    l: "Synlig för alla verifierade åkerier", d: "Åkerier kan hitta dig via STP:s förardatabas och kontakta dig direkt. Snabbaste vägen till jobb." },
  { v: "limited", l: "Endast åkerier jag ansökt till",      d: "Bara åkerier där du själv tagit första steget kan se din profil." },
  { v: "hidden",  l: "Helt dold",                           d: "Din profil är inte synlig för någon. Du kan fortfarande söka jobb, men åkerier kan inte söka upp dig." },
];

function SekretessSection({ profile: initialProfile }) {
  const [visibility, setVisibility] = useState(initialProfile?.visible === false ? "hidden" : "open");

  const save = async (val) => {
    setVisibility(val);
    try {
      await updateProfile({ visibleToCompanies: val !== "hidden" });
    } catch {
      // silent
    }
  };

  return (
    <Card title="Vem får se din profil?" sub="Du bestämmer själv hur synlig du är.">
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
        {VISIBILITY_OPTS.map((o) => {
          const on = visibility === o.v;
          return (
            <button key={o.v} type="button" onClick={() => save(o.v)} style={{ textAlign: "left", padding: "16px 18px", borderRadius: 13, background: on ? "rgba(245,166,35,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${on ? "rgba(245,166,35,0.3)" : "rgba(255,255,255,0.07)"}`, display: "flex", gap: 14, alignItems: "flex-start", cursor: "pointer", fontFamily: "inherit", color: "inherit" }}>
              <div style={{ width: 18, height: 18, borderRadius: 99, border: `2px solid ${on ? "#F5A623" : "rgba(255,255,255,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                {on && <div style={{ width: 8, height: 8, borderRadius: 99, background: "#F5A623" }} />}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f0faf9", marginBottom: 3 }}>{o.l}</div>
                <div style={{ fontSize: 12, color: "rgba(240,250,249,0.55)", lineHeight: 1.5 }}>{o.d}</div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Company Konto ────────────────────────────────────────────────────────────
function InviteSection() {
  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await listInvites();
      setInvites(Array.isArray(data) ? data : []);
    } catch {
      // silent — non-owners won't have access
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSend = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) { setError("Ange en giltig e-postadress."); return; }
    setSending(true);
    try {
      await createInvite(trimmed);
      setSuccess(`Inbjudan skickad till ${trimmed}.`);
      setEmail("");
      await load();
    } catch (err) {
      setError(err.message || "Kunde inte skicka inbjudan.");
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (id) => {
    try {
      await revokeInvite(id);
      setInvites(prev => prev.filter(inv => inv.id !== id));
    } catch (err) {
      setError(err.message || "Kunde inte återkalla inbjudan.");
    }
  };

  return (
    <Card title="Bjud in kollega" sub="Skicka en inbjudan till en kollega så kan de logga in på ert STP-konto.">
      {error && <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontSize: 13, color: "#f87171", marginBottom: 14 }}>{error}</div>}
      {success && <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", fontSize: 13, color: "#4ade80", marginBottom: 14 }}>{success}</div>}
      <form onSubmit={handleSend} style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <input
          style={{ ...inputStyle, flex: 1 }}
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="kollega@foretag.se"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending}
          style={{ padding: "11px 18px", borderRadius: 10, background: "#1F5F5C", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: sending ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap", opacity: sending ? 0.6 : 1 }}
        >
          {sending ? "Skickar…" : "Skicka inbjudan"}
        </button>
      </form>

      {loading ? (
        <p style={{ fontSize: 13, color: "rgba(240,250,249,0.4)", margin: 0 }}>Laddar inbjudningar…</p>
      ) : invites.length === 0 ? (
        <p style={{ fontSize: 13, color: "rgba(240,250,249,0.4)", margin: 0 }}>Inga väntande inbjudningar.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(240,250,249,0.4)", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 4px" }}>Väntande inbjudningar</p>
          {invites.map(inv => (
            <div key={inv.id} style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
              <Icon n="mail" s={15} c="rgba(240,250,249,0.4)" />
              <span style={{ flex: 1, fontSize: 13, color: "rgba(240,250,249,0.8)" }}>{inv.email}</span>
              <span style={{ fontSize: 11, color: "rgba(240,250,249,0.35)", marginRight: 8 }}>Väntar</span>
              <button
                type="button"
                onClick={() => handleRevoke(inv.id)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                <Icon n="trash" s={12} /> Återkalla
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function CompanyKontoSection({ user }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteMyAccount();
      logout();
      navigate("/", { replace: true });
    } catch (err) {
      setDeleteLoading(false);
      alert(err.message || "Kunde inte radera kontot. Försök igen eller kontakta support.");
    }
  };

  return (
    <>
      {showDeleteDialog && (
        <DeleteAccountDialog
          isCompany={true}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}

      <Card title="Företagsuppgifter" sub="Din inloggningsinformation på STP.">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
          {[
            ["Företagsnamn", user?.companyName || user?.name || "—"],
            ["E-post", user?.email || "—"],
            ["Roll", "Admin"],
            ["Status", user?.emailVerifiedAt ? "E-post verifierad" : "E-post ej verifierad"],
          ].map(([label, val]) => (
            <div key={label} style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(240,250,249,0.35)", textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 4px" }}>{label}</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: label === "Status" ? (user?.emailVerifiedAt ? "#4ade80" : "#F5A623") : "#f0faf9", margin: 0, wordBreak: "break-all" }}>{val}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          <Link to="/foretag/profil" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(31,95,92,0.4)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#f0faf9", margin: "0 0 2px" }}>Redigera företagsprofil</p>
              <p style={{ fontSize: 12, color: "rgba(240,250,249,0.4)", margin: 0 }}>Beskrivning, kontaktuppgifter, bransch</p>
            </div>
            <span style={{ color: "#F5A623", fontSize: 16 }}>→</span>
          </Link>
        </div>
      </Card>

      <PasswordCard />

      <Card title="Team" sub="Kollegor med tillgång till ert STP-konto.">
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {[
            { n: user?.name || "Admin", e: user?.email || "", r: "Admin" },
          ].map(m => (
            <div key={m.e} style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 99, background: "#1F5F5C", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>
                {(m.n || "?").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{m.n}</div>
                <div style={{ fontSize: 12, color: "rgba(240,250,249,0.5)" }}>{m.e}</div>
              </div>
              <span style={{ padding: "3px 9px", borderRadius: 99, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", fontSize: 11, fontWeight: 700, color: "#F5A623" }}>{m.r}</span>
            </div>
          ))}
        </div>
      </Card>

      <InviteSection />

      <Card title="Ta bort konto" sub="Detta är permanent. Alla era annonser och konversationer raderas." danger>
        <button
          type="button"
          onClick={() => setShowDeleteDialog(true)}
          style={{ padding: "10px 18px", borderRadius: 10, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
        >
          Ta bort företagskonto
        </button>
      </Card>
    </>
  );
}

// ─── Company Verifiering ──────────────────────────────────────────────────────
function CompanyVerifieringSection({ user }) {
  const isVerified = user?.status === "VERIFIED";

  return (
    <Card title="Företagsverifiering" sub="Verifierade åkerier får 3× fler ansökningar i snitt.">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: isVerified ? "rgba(74,222,128,0.06)" : "rgba(245,166,35,0.06)", border: `1px solid ${isVerified ? "rgba(74,222,128,0.2)" : "rgba(245,166,35,0.2)"}`, borderRadius: 11, marginBottom: 18 }}>
        <div style={{ width: 36, height: 36, borderRadius: 99, background: isVerified ? "rgba(74,222,128,0.2)" : "rgba(245,166,35,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon n={isVerified ? "check" : "shield"} s={17} c={isVerified ? "#4ade80" : "#F5A623"} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: isVerified ? "#4ade80" : "#F5A623" }}>
            {isVerified ? "Verifierat företag" : "Verifiering pågår"}
          </div>
          <div style={{ fontSize: 12, color: "rgba(240,250,249,0.6)" }}>
            {isVerified
              ? "Ert företag är granskat och godkänt av STP."
              : "Vår granskare kontrollerar era uppgifter. Detta tar vanligtvis 1–2 arbetsdagar."}
          </div>
        </div>
      </div>

      {!isVerified && (
        <div style={{ padding: "14px 16px", borderRadius: 11, background: "rgba(245,166,35,0.04)", border: "1px solid rgba(245,166,35,0.12)", fontSize: 13, color: "rgba(240,250,249,0.65)", lineHeight: 1.6 }}>
          Har du frågor om verifieringen?{" "}
          <a href="mailto:support@transportplattformen.se" style={{ color: "#F5A623", textDecoration: "underline" }}>
            Kontakta support
          </a>
          .
        </div>
      )}
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Settings() {
  usePageTitle("Inställningar");
  const { user, hasApi } = useAuth();
  const { profile } = useProfile();
  const isDriver = user?.role === "DRIVER";
  const isCompany = user?.role === "COMPANY";

  const [section, setSection] = useState("konto");
  const [notifSettings, setNotifSettings] = useState({});
  const [notifSaving, setNotifSaving] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    if (!hasApi || !user) { setSettingsLoading(false); return; }
    setSettingsLoading(true);
    const load = isDriver
      ? fetchProfile().then(d => d?.emailNotificationSettings)
      : fetchMyCompanyProfile().then(d => d?.emailNotificationSettings);
    load
      .then(s => setNotifSettings(s || {}))
      .catch(() => setNotifSettings({}))
      .finally(() => setSettingsLoading(false));
  }, [hasApi, user, isDriver]);

  const handleToggle = async (key, newVal) => {
    const next = { ...notifSettings, [key]: newVal };
    setNotifSettings(next);
    setNotifSaving(true);
    try {
      if (isDriver) await updateNotificationSettings(next);
      else await updateCompanyNotificationSettings(next);
    } catch {
      setNotifSettings(prev => ({ ...prev, [key]: !newVal }));
    } finally {
      setNotifSaving(false);
    }
  };

  if (!user) return <Navigate to="/login" state={{ from: "/installningar" }} replace />;

  const driverSections = [
    { k: "konto",       l: "Konto",       i: "user"   },
    { k: "verifiering", l: "Verifiering", i: "shield" },
    { k: "notiser",     l: "Notiser",     i: "bell"   },
    { k: "sekretess",   l: "Sekretess",   i: "lock"   },
  ];
  const companySections = [
    { k: "konto",       l: "Konto & team",  i: "building" },
    { k: "verifiering", l: "Verifiering",   i: "shield"   },
    { k: "notiser",     l: "Notiser",       i: "bell"     },
  ];
  const sections = isCompany ? companySections : driverSections;

  const renderContent = () => {
    if (section === "konto") {
      if (isDriver) return <DriverKontoSection user={user} profile={profile} />;
      return <CompanyKontoSection user={user} />;
    }
    if (section === "verifiering") {
      if (isDriver) return <DriverVerifieringSection profile={profile} />;
      return <CompanyVerifieringSection user={user} />;
    }
    if (section === "notiser") {
      return settingsLoading ? (
        <Card><p style={{ fontSize: 13, color: "rgba(240,250,249,0.4)", margin: 0 }}>Laddar inställningar…</p></Card>
      ) : (
        <NotifSection isDriver={isDriver} initialSettings={notifSettings} onToggle={handleToggle} />
      );
    }
    if (section === "sekretess" && isDriver) return <SekretessSection profile={profile} />;
    return null;
  };

  return (
    <main style={{ background: "#060f0f", minHeight: "100vh", marginTop: "-64px", paddingTop: 80 }}>
      <PageMeta title="Inställningar – STP" />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 32px 100px" }}>

        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(245,166,35,0.85)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
            {isCompany ? "Företagskonto" : "Förarkonto"}
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1.2, margin: 0, color: "#f0faf9" }}>Inställningar</h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 32, alignItems: "flex-start" }}>
          {/* Sidebar */}
          <aside style={{ position: "sticky", top: 88, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 8 }}>
            {sections.map((s) => {
              const active = section === s.k;
              return (
                <button key={s.k} type="button" onClick={() => setSection(s.k)} style={{ width: "100%", padding: "11px 14px", borderRadius: 9, display: "flex", alignItems: "center", gap: 11, background: active ? "rgba(245,166,35,0.1)" : "transparent", color: active ? "#F5A623" : "rgba(240,250,249,0.7)", fontSize: 14, fontWeight: active ? 700 : 600, textAlign: "left", marginBottom: 2, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  <Icon n={s.i} s={16} c="currentColor" />
                  {s.l}
                </button>
              );
            })}
            <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 0" }} />
            <Link to={isCompany ? "/foretag" : "/profil"} style={{ display: "block", padding: "11px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600, color: "rgba(240,250,249,0.55)", textDecoration: "none" }}>
              ← Tillbaka till {isCompany ? "dashboard" : "profil"}
            </Link>
          </aside>

          {/* Content */}
          <div style={{ minWidth: 0 }}>
            {renderContent()}

            {/* Save bar */}
            <div style={{ position: "sticky", bottom: 20, marginTop: 24, background: "rgba(10,24,24,0.95)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              <span style={{ fontSize: 13, color: "rgba(240,250,249,0.6)" }}>Ändringar sparas automatiskt</span>
              <span style={{ fontSize: 12, color: notifSaving ? "#F5A623" : "#4ade80", display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                <Icon n="check" s={13} c="currentColor" />
                {notifSaving ? "Sparar…" : "Sparat just nu"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
