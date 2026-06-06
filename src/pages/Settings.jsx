import { useEffect, useState, useCallback } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { useIsMobile } from "../hooks/useIsMobile";
import { changePassword, deleteMyAccount } from "../api/auth.js";
import { updateNotificationSettings, fetchProfile, updateProfile } from "../api/profile.js";
import { updateCompanyNotificationSettings, fetchMyCompanyProfile, updateMyCompanyProfile, listInvites, createInvite, revokeInvite } from "../api/companies.js";
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
    <div onClick={disabled ? undefined : onChange} style={{ width: 44, height: 24, borderRadius: 12, background: checked ? "var(--green)" : "var(--paper-2)", cursor: disabled ? "default" : "pointer", position: "relative", transition: "background .2s", border: "1px solid var(--line)", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 2, left: checked ? 22 : 2, width: 18, height: 18, borderRadius: 9, background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
    </div>
  );
}

const inputStyle = { width: "100%", padding: "11px 14px", borderRadius: 10, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-900)", fontSize: "var(--text-base)", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };

function Field({ label, sub, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-700)", marginBottom: sub ? 2 : 7 }}>{label}</label>
      {sub && <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", marginBottom: 7 }}>{sub}</div>}
      {children}
    </div>
  );
}

function Card({ title, sub, children, danger }) {
  return (
    <div style={{ background: danger ? "var(--danger-tint)" : "var(--card)", border: `1px solid ${danger ? "rgba(239,68,68,0.25)" : "var(--line)"}`, borderRadius: 16, padding: "24px 28px", marginBottom: 16, boxShadow: "var(--sh-sm)" }}>
      {title && (
        <div style={{ marginBottom: sub ? 4 : 18 }}>
          <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: danger ? "var(--danger)" : "var(--ink-900)", letterSpacing: -0.3, margin: 0 }}>{title}</h3>
          {sub && <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginTop: 5, lineHeight: 1.5 }}>{sub}</p>}
        </div>
      )}
      {sub && <div style={{ marginTop: 14 }} />}
      {children}
    </div>
  );
}

function ToggleRow({ label, sub, on, onChange, first }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "13px 0", borderTop: first ? "none" : "1px solid var(--line)", gap: 24 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--ink-900)" }}>{label}</div>
        {sub && <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 2 }}>{sub}</div>}
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
      <div style={{ background: "var(--card)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 16, padding: "32px 28px", maxWidth: 440, width: "100%", boxShadow: "var(--sh)" }}>
        <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 900, color: "var(--danger)", margin: "0 0 10px", letterSpacing: -0.5 }}>
          {isCompany ? "Ta bort företagskonto" : "Ta bort mitt konto"}
        </h2>
        <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.6, margin: "0 0 22px" }}>
          Detta är <strong style={{ color: "var(--ink-900)" }}>permanent och kan inte ångras</strong>. All data — {isCompany ? "annonser, konversationer och teammedlemmar" : "ansökningar, meddelanden och din profil"} — raderas omedelbart.
        </p>
        <Field label='Skriv "RADERA" för att bekräfta'>
          <input
            style={{ ...inputStyle, border: confirmed ? "1px solid rgba(239,68,68,0.5)" : "1px solid var(--line)" }}
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
            style={{ flex: 1, padding: "11px 16px", borderRadius: 10, background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-700)", fontWeight: 700, fontSize: "var(--text-sm)", cursor: "pointer", fontFamily: "inherit" }}
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!confirmed || loading}
            style={{ flex: 1, padding: "11px 16px", borderRadius: 10, background: confirmed ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.05)", border: `1px solid ${confirmed ? "rgba(239,68,68,0.5)" : "rgba(239,68,68,0.15)"}`, color: confirmed ? "var(--danger)" : "rgba(239,68,68,0.4)", fontWeight: 700, fontSize: "var(--text-sm)", cursor: confirmed && !loading ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all .15s" }}
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
        {error && <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--danger-tint)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "var(--text-sm)", color: "var(--danger)", marginBottom: 14 }}>{error}</div>}
        {success && <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--success-tint)", border: "1px solid rgba(31,122,58,0.2)", fontSize: "var(--text-sm)", color: "var(--success)", marginBottom: 14 }}>{success}</div>}
        <Field label="Nuvarande lösenord">
          <div style={{ position: "relative" }}>
            <input type={showCurrent ? "text" : "password"} value={form.current} onChange={e => setForm(p => ({ ...p, current: e.target.value }))} style={{ ...inputStyle, paddingRight: 44 }} />
            <button type="button" onClick={() => setShowCurrent(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--ink-400)", display: "flex" }}><Icon n={showCurrent ? "eyeoff" : "eye"} s={16} /></button>
          </div>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Nytt lösenord">
            <div style={{ position: "relative" }}>
              <input type={showNext ? "text" : "password"} value={form.next} onChange={e => setForm(p => ({ ...p, next: e.target.value }))} placeholder="Minst 8 tecken" style={{ ...inputStyle, paddingRight: 44 }} />
              <button type="button" onClick={() => setShowNext(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--ink-400)", display: "flex" }}><Icon n={showNext ? "eyeoff" : "eye"} s={16} /></button>
            </div>
          </Field>
          <Field label="Bekräfta nytt">
            <input type={showNext ? "text" : "password"} value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} style={inputStyle} />
          </Field>
        </div>
        <button type="submit" disabled={loading} style={{ padding: "10px 18px", borderRadius: 10, background: "var(--green)", color: "#fff", fontWeight: 700, fontSize: "var(--text-sm)", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, fontFamily: "inherit", marginTop: 4 }}>
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
            <input style={{ ...inputStyle, color: "var(--ink-400)" }} value={nameParts[0] || ""} disabled title="Ändra via Support" />
          </Field>
          <Field label="Efternamn">
            <input style={{ ...inputStyle, color: "var(--ink-400)" }} value={nameParts.slice(1).join(" ") || ""} disabled title="Ändra via Support" />
          </Field>
        </div>
        <Field label="E-post" sub="Kontakta support om du behöver byta e-post.">
          <input style={{ ...inputStyle, color: "var(--ink-400)" }} value={user?.email || ""} disabled />
        </Field>
        <div style={{ marginTop: 4 }}>
          <Link to="/profil" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, background: "var(--green-tint)", border: "1px solid rgba(31,95,92,0.2)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--green-text)", textDecoration: "none" }}>
            Redigera profil (telefon, ort, erfarenhet m.m.) →
          </Link>
        </div>
      </Card>

      <PasswordCard />

      <DriverAnstallningsSection profile={profile} />

      <Card title="Plattformsguide" sub="Gå igenom introduktionsguiden igen för att se tips och funktioner.">
        <button
          type="button"
          onClick={() => { localStorage.removeItem("stp_driver_tour_done"); window.location.href = "/jobb"; }}
          style={{ padding: "10px 18px", borderRadius: 10, background: "var(--green-tint)", border: "1px solid rgba(31,95,92,0.2)", color: "var(--green-text)", fontWeight: 700, fontSize: "var(--text-sm)", cursor: "pointer", fontFamily: "inherit" }}
        >
          Starta om guiden
        </button>
      </Card>

      <Card title="Ta bort konto" sub="Detta är permanent. Alla dina ansökningar och meddelanden raderas." danger>
        <button
          type="button"
          onClick={() => setShowDeleteDialog(true)}
          style={{ padding: "10px 18px", borderRadius: 10, background: "var(--danger-tint)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)", fontWeight: 700, fontSize: "var(--text-sm)", cursor: "pointer", fontFamily: "inherit" }}
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
      {error && <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--danger-tint)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "var(--text-sm)", color: "var(--danger)", marginBottom: 14 }}>{error}</div>}
      <Field label="Anställningsform">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {EMPLOY_OPTS.map(([v, l]) => {
            const on = employment.includes(v);
            return (
              <button
                key={v}
                type="button"
                onClick={() => setEmployment(toggle(employment, v))}
                style={{ padding: "8px 16px", borderRadius: 99, background: on ? "var(--green-tint)" : "var(--paper-2)", border: `1px solid ${on ? "rgba(31,95,92,0.3)" : "var(--line)"}`, fontSize: "var(--text-sm)", fontWeight: 600, color: on ? "var(--green-text)" : "var(--ink-500)", cursor: "pointer", fontFamily: "inherit" }}
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
        style={{ padding: "10px 18px", borderRadius: 10, background: "var(--green)", color: "#fff", fontWeight: 700, fontSize: "var(--text-sm)", border: "none", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}
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
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: verifiedCount > 0 ? "var(--success-tint)" : "var(--amber-tint)", border: `1px solid ${verifiedCount > 0 ? "rgba(31,122,58,0.2)" : "rgba(199,122,14,0.2)"}`, borderRadius: 11 }}>
          <div style={{ width: 36, height: 36, borderRadius: 99, background: verifiedCount > 0 ? "rgba(31,122,58,0.15)" : "rgba(199,122,14,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon n={verifiedCount > 0 ? "check" : "shield"} s={17} c={verifiedCount > 0 ? "var(--success)" : "var(--amber)"} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "var(--text-base)", fontWeight: 800, color: verifiedCount > 0 ? "var(--success)" : "var(--amber)" }}>
              {verifiedCount > 0 ? "Du har dokument registrerade" : "Inga dokument uppladdade"}
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>
              {verifiedCount} av 3 verifieringssteg slutförda
            </div>
          </div>
        </div>
      </Card>

      <Card title="Mina dokument">
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
          {docs.map(it => (
            <div key={it.k} style={{ padding: "14px 16px", background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 11, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: it.verified ? "var(--success-tint)" : "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon n={it.verified ? "check" : "shield"} s={16} c={it.verified ? "var(--success)" : "var(--ink-400)"} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)" }}>{it.l}</span>
                  {it.verified && <span style={{ padding: "2px 8px", borderRadius: 99, background: "var(--success-tint)", border: "1px solid rgba(31,122,58,0.2)", fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--success)", letterSpacing: 0.5 }}>REGISTRERAT</span>}
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>{it.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "16px 18px", borderRadius: 12, background: "var(--amber-tint)", border: "1px solid rgba(199,122,14,0.2)", display: "flex", alignItems: "flex-start", gap: 14 }}>
          <Icon n="mail" s={18} c="var(--amber)" />
          <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-700)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--amber)" }}>Verifiering sker via support.</strong>{" "}
            Skicka dina dokument till{" "}
            <a href="mailto:support@transportplattformen.se" style={{ color: "var(--amber)", textDecoration: "underline" }}>
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
function SekretessSection({ profile: initialProfile }) {
  const [visibleToCompanies, setVisibleToCompanies] = useState(
    initialProfile?.visibleToCompanies !== false
  );
  const [openToWork, setOpenToWork] = useState(
    initialProfile?.openToWork === true
  );
  const [showPhone, setShowPhone] = useState(
    initialProfile?.showPhoneToCompanies === true
  );
  const [showEmail, setShowEmail] = useState(
    initialProfile?.showEmailToCompanies === true
  );
  const [saving, setSaving] = useState(false);

  const save = async (patch) => {
    setSaving(true);
    try {
      await updateProfile(patch);
    } catch {
      // revert on error
    } finally {
      setSaving(false);
    }
  };

  const toggleVisible = () => {
    const next = !visibleToCompanies;
    setVisibleToCompanies(next);
    save({ visibleToCompanies: next });
  };

  const toggleOpenToWork = () => {
    const next = !openToWork;
    setOpenToWork(next);
    save({ openToWork: next });
  };

  const togglePhone = () => {
    const next = !showPhone;
    setShowPhone(next);
    save({ showPhoneToCompanies: next });
  };

  const toggleEmail = () => {
    const next = !showEmail;
    setShowEmail(next);
    save({ showEmailToCompanies: next });
  };

  return (
    <>
      {/* Synlighet */}
      <Card
        title="Synlighet i förardatabasen"
        sub="Styr om åkerier kan hitta och kontakta dig via talangkartan."
      >
        <ToggleRow
          first
          label="Synlig för åkerier"
          sub={visibleToCompanies
            ? "Din profil visas för verifierade åkerier i Hitta förare."
            : "Din profil är dold — åkerier kan inte söka upp dig. Du kan fortfarande ansöka till jobb."}
          on={visibleToCompanies}
          onChange={toggleVisible}
        />

        {visibleToCompanies && (
          <div style={{ marginTop: 16, padding: "16px 18px", borderRadius: 12, background: openToWork ? "var(--success-tint)" : "var(--paper-2)", border: `1px solid ${openToWork ? "rgba(31,120,80,0.25)" : "var(--line)"}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: openToWork ? "var(--success)" : "var(--ink-300)", flexShrink: 0 }} />
                <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)" }}>Söker aktivt jobb</span>
                {openToWork && (
                  <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", padding: "2px 8px", borderRadius: 99, background: "var(--success)", color: "#fff" }}>
                    SÖKER JOBB
                  </span>
                )}
              </div>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", lineHeight: 1.55, margin: 0 }}>
                {openToWork
                  ? "En grön ring visas runt din profilbild — åkerier ser att du aktivt söker."
                  : "Slå på för att visa en grön ring runt din profilbild och signalera att du är öppen för erbjudanden."}
              </p>
            </div>
            <Toggle checked={openToWork} onChange={toggleOpenToWork} disabled={saving} />
          </div>
        )}
      </Card>

      {/* Kontaktuppgifter */}
      <Card
        title="Kontaktuppgifter"
        sub="Välj vad åkerier får se när de tittar på din profil."
      >
        <ToggleRow
          first
          label="Visa telefonnummer"
          sub="Åkerier du inte kontaktat kan se ditt telefonnummer direkt på profilen."
          on={showPhone}
          onChange={togglePhone}
        />
        <ToggleRow
          label="Visa e-postadress"
          sub="Åkerier kan kontakta dig via e-post utan att skicka meddelande via STP."
          on={showEmail}
          onChange={toggleEmail}
        />
      </Card>

      {saving && (
        <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", textAlign: "right", marginTop: -8 }}>Sparar…</p>
      )}
    </>
  );
}

// ─── Driver Sökpreferenser ────────────────────────────────────────────────────
function SokprefSection({ profile: initialProfile }) {
  const [localProfile, setLocalProfile] = useState(initialProfile || {});
  const [saving, setSaving] = useState(false);

  const toggle = (field, val) => {
    setLocalProfile((p) => {
      const arr = Array.isArray(p[field]) ? p[field] : [];
      const next = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
      const updated = { ...p, [field]: next };
      setSaving(true);
      updateProfile({ [field]: next }).catch(() => {}).finally(() => setSaving(false));
      return updated;
    });
  };

  const licenses = Array.isArray(localProfile.licenses) ? localProfile.licenses : [];
  const segments = Array.isArray(localProfile.secondarySegments) ? localProfile.secondarySegments : [];
  const avail = localProfile.availability || "";

  const EMPLOYMENTS = [
    ["fast", "Fast anställning"],
    ["vikariat", "Vikariat"],
    ["tim", "Timjobb"],
  ];
  const SEGMENTS = ["Fjärr", "Distribution", "Tank", "Bygg", "Skog", "Container", "Internationell", "Bemanning"];

  return (
    <Card title="Vad letar du efter?" sub="Används för att beräkna din matchning mot lediga jobb. Ju mer specifik, desto bättre matchning.">
      <Field label="Körkort jag har">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["C", "CE"].map((l) => {
            const on = licenses.includes(l);
            return (
              <button key={l} type="button" onClick={() => toggle("licenses", l)}
                style={{ padding: "8px 16px", borderRadius: 99, background: on ? "var(--success-tint)" : "var(--paper-2)", border: `1px solid ${on ? "var(--success)" : "var(--line)"}`, fontSize: "var(--text-sm)", fontWeight: 700, color: on ? "var(--success)" : "var(--ink-500)", cursor: "pointer", fontFamily: "inherit" }}>
                {on && "✓ "}{l}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Anställningsform">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {EMPLOYMENTS.map(([v, l]) => {
            const on = avail === v;
            return (
              <button key={v} type="button" onClick={() => {
                const next = on ? "" : v;
                setLocalProfile((p) => ({ ...p, availability: next }));
                updateProfile({ availability: next }).catch(() => {});
              }}
                style={{ padding: "8px 16px", borderRadius: 99, background: on ? "var(--amber-tint)" : "var(--paper-2)", border: `1px solid ${on ? "var(--amber)" : "var(--line)"}`, fontSize: "var(--text-sm)", fontWeight: 600, color: on ? "var(--amber-text)" : "var(--ink-500)", cursor: "pointer", fontFamily: "inherit" }}>
                {l}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Segment du är intresserad av">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SEGMENTS.map((s) => {
            const on = segments.includes(s);
            return (
              <button key={s} type="button" onClick={() => toggle("secondarySegments", s)}
                style={{ padding: "7px 14px", borderRadius: 99, background: on ? "var(--green-tint)" : "var(--paper-2)", border: `1px solid ${on ? "var(--green)" : "var(--line)"}`, fontSize: "var(--text-sm)", fontWeight: 600, color: on ? "var(--green-text)" : "var(--ink-500)", cursor: "pointer", fontFamily: "inherit" }}>
                {s}
              </button>
            );
          })}
        </div>
      </Field>
      {saving && <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", marginTop: 8 }}>Sparar…</div>}
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
      {error && <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--danger-tint)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "var(--text-sm)", color: "var(--danger)", marginBottom: 14 }}>{error}</div>}
      {success && <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--success-tint)", border: "1px solid rgba(31,122,58,0.2)", fontSize: "var(--text-sm)", color: "var(--success)", marginBottom: 14 }}>{success}</div>}
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
          style={{ padding: "11px 18px", borderRadius: 10, background: "var(--green)", border: "none", color: "#fff", fontWeight: 700, fontSize: "var(--text-sm)", cursor: sending ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap", opacity: sending ? 0.6 : 1 }}
        >
          {sending ? "Skickar…" : "Skicka inbjudan"}
        </button>
      </form>

      {loading ? (
        <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-400)", margin: 0 }}>Laddar inbjudningar…</p>
      ) : invites.length === 0 ? (
        <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-400)", margin: 0 }}>Inga väntande inbjudningar.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 4px" }}>Väntande inbjudningar</p>
          {invites.map(inv => (
            <div key={inv.id} style={{ padding: "12px 14px", background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
              <Icon n="mail" s={15} c="var(--ink-400)" />
              <span style={{ flex: 1, fontSize: "var(--text-sm)", color: "var(--ink-700)" }}>{inv.email}</span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", marginRight: 8 }}>Väntar</span>
              <button
                type="button"
                onClick={() => handleRevoke(inv.id)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 8, background: "var(--danger-tint)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)", fontSize: "var(--text-xs)", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
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
            <div key={label} style={{ padding: "14px 16px", borderRadius: 12, background: "var(--paper-2)", border: "1px solid var(--line)" }}>
              <p style={{ fontSize: "var(--text-2xs)", fontWeight: 600, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 4px" }}>{label}</p>
              <p style={{ fontSize: "var(--text-base)", fontWeight: 600, color: label === "Status" ? (user?.emailVerifiedAt ? "var(--success)" : "var(--amber)") : "var(--ink-900)", margin: 0, wordBreak: "break-all" }}>{val}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          <Link to="/foretag/profil" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, background: "var(--green-tint)", border: "1px solid rgba(31,95,92,0.2)", textDecoration: "none" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(31,95,92,0.4)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(31,95,92,0.2)"}>
            <div>
              <p style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--ink-900)", margin: "0 0 2px" }}>Redigera företagsprofil</p>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", margin: 0 }}>Beskrivning, kontaktuppgifter, bransch</p>
            </div>
            <span style={{ color: "var(--green-text)", fontSize: "var(--text-lg)" }}>→</span>
          </Link>
        </div>
      </Card>

      <PasswordCard />

      <Card title="Team" sub="Kollegor med tillgång till ert STP-konto.">
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {[
            { n: user?.name || "Admin", e: user?.email || "", r: "Admin" },
          ].map(m => (
            <div key={m.e} style={{ padding: "12px 14px", background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 99, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-sm)", color: "#fff" }}>
                {(m.n || "?").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)" }}>{m.n}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>{m.e}</div>
              </div>
              <span style={{ padding: "3px 9px", borderRadius: 99, background: "var(--amber-tint)", border: "1px solid rgba(199,122,14,0.2)", fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--amber)" }}>{m.r}</span>
            </div>
          ))}
        </div>
      </Card>

      <InviteSection />

      <Card title="Plattformsguide" sub="Gå igenom introduktionsguiden igen för att se tips och funktioner.">
        <button
          type="button"
          onClick={() => { localStorage.removeItem("stp_company_tour_done"); window.location.href = "/foretag"; }}
          style={{ padding: "10px 18px", borderRadius: 10, background: "var(--green-tint)", border: "1px solid rgba(31,95,92,0.2)", color: "var(--green-text)", fontWeight: 700, fontSize: "var(--text-sm)", cursor: "pointer", fontFamily: "inherit" }}
        >
          Starta om guiden
        </button>
      </Card>

      <Card title="Ta bort konto" sub="Detta är permanent. Alla era annonser och konversationer raderas." danger>
        <button
          type="button"
          onClick={() => setShowDeleteDialog(true)}
          style={{ padding: "10px 18px", borderRadius: 10, background: "var(--danger-tint)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)", fontWeight: 700, fontSize: "var(--text-sm)", cursor: "pointer", fontFamily: "inherit" }}
        >
          Ta bort företagskonto
        </button>
      </Card>
    </>
  );
}

// ─── Company Praktik toggle ────────────────────────────────────────────────────
function PraktikToggleCard() {
  const [accepts, setAccepts] = useState(null);
  const [, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchMyCompanyProfile()
      .then(d => setAccepts(d?.acceptsPraktik ?? false))
      .catch(() => setAccepts(false));
  }, []);

  const toggle = async () => {
    if (accepts === null) return;
    const next = !accepts;
    setAccepts(next);
    setSaving(true);
    try {
      await updateMyCompanyProfile({ acceptsPraktik: next });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setAccepts(!next);
    } finally {
      setSaving(false);
    }
  };

  if (accepts === null) return null;

  return (
    <Card title="Praktik & APL" sub="Visa för gymnasieelever och YKB-studerande att ni tar emot praktikanter.">
      <ToggleRow
        label="Vi tar emot praktikanter"
        sub={accepts ? "Er profil visas för elever som söker APL-plats i er region." : "Aktivera för att dyka upp i sökresultat för praktikplatser."}
        on={accepts}
        onChange={toggle}
        first
      />
      {saved && (
        <div style={{ marginTop: 10, fontSize: "var(--text-xs)", color: "var(--success)", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon n="check" s={13} c="var(--success)" /> Sparat
        </div>
      )}
    </Card>
  );
}

// ─── Company Verifiering ──────────────────────────────────────────────────────
function CompanyVerifieringSection({ user }) {
  const isVerified = user?.status === "VERIFIED";

  return (
    <Card title="Företagsverifiering" sub="Verifierade åkerier får 3× fler ansökningar i snitt.">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: isVerified ? "var(--success-tint)" : "var(--amber-tint)", border: `1px solid ${isVerified ? "rgba(31,122,58,0.2)" : "rgba(199,122,14,0.2)"}`, borderRadius: 11, marginBottom: 18 }}>
        <div style={{ width: 36, height: 36, borderRadius: 99, background: isVerified ? "rgba(31,122,58,0.15)" : "rgba(199,122,14,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon n={isVerified ? "check" : "shield"} s={17} c={isVerified ? "var(--success)" : "var(--amber)"} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "var(--text-base)", fontWeight: 800, color: isVerified ? "var(--success)" : "var(--amber)" }}>
            {isVerified ? "Verifierat företag" : "Verifiering pågår"}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>
            {isVerified
              ? "Ert företag är granskat och godkänt av STP."
              : "Vår granskare kontrollerar era uppgifter. Detta tar vanligtvis 1–2 arbetsdagar."}
          </div>
        </div>
      </div>

      {!isVerified && (
        <div style={{ padding: "14px 16px", borderRadius: 11, background: "var(--amber-tint)", border: "1px solid rgba(199,122,14,0.2)", fontSize: "var(--text-sm)", color: "var(--ink-700)", lineHeight: 1.6 }}>
          Har du frågor om verifieringen?{" "}
          <a href="mailto:support@transportplattformen.se" style={{ color: "var(--amber)", textDecoration: "underline" }}>
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
  const isMobile = useIsMobile();
  const { user, hasApi, isDriver, isCompany } = useAuth();
  const { profile } = useProfile();

  const [searchParams] = useSearchParams();
  const [section, setSection] = useState(searchParams.get("tab") || "konto");
  const [notifSettings, setNotifSettings] = useState({});
  const [, setNotifSaving] = useState(false);
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
    { k: "konto",       l: "Konto",           i: "user"   },
    { k: "verifiering", l: "Verifiering",     i: "shield" },
    { k: "sokpref",     l: "Sökpreferenser",  i: "search" },
    { k: "notiser",     l: "Notiser",         i: "bell"   },
    { k: "sekretess",   l: "Sekretess",       i: "lock"   },
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
      return (
        <>
          <CompanyVerifieringSection user={user} />
          <PraktikToggleCard />
        </>
      );
    }
    if (section === "notiser") {
      return settingsLoading ? (
        <Card><p style={{ fontSize: "var(--text-sm)", color: "var(--ink-400)", margin: 0 }}>Laddar inställningar…</p></Card>
      ) : (
        <NotifSection isDriver={isDriver} initialSettings={notifSettings} onToggle={handleToggle} />
      );
    }
    if (section === "sokpref" && isDriver) return <SokprefSection profile={profile} />;
    if (section === "sekretess" && isDriver) return <SekretessSection profile={profile} />;
    return null;
  };

  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <PageMeta title="Inställningar – STP" />

      {/* Page header */}
      {!isMobile && (
        <div style={{ background: "var(--paper)", borderBottom: "1px solid var(--line)", paddingTop: 32, paddingBottom: 24 }}>
          <div style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: "0 32px" }}>
            <p style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 10 }}>Konto</p>
            <h1 style={{ fontSize: "var(--text-5xl)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1.2, lineHeight: 1.15, margin: 0 }}>Inställningar</h1>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: isMobile ? "72px 16px 80px" : "28px 32px 100px" }}>

        {/* Mobile title bar */}
        {isMobile && (
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 900, letterSpacing: -0.8, margin: 0, color: "var(--ink-900)" }}>Inställningar</h1>
          </div>
        )}

        {isMobile ? (
          /* Mobile: iOS-style settings list → detail push */
          <div>
            {section !== null ? (
              /* Detail view */
              <div>
                <button type="button" onClick={() => setSection(null)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", background: "none", border: "none", cursor: "pointer", color: "var(--green-text)", fontSize: "var(--text-base)", fontWeight: 700, fontFamily: "inherit", marginBottom: 20 }}>
                  ← Tillbaka
                </button>
                {renderContent()}
              </div>
            ) : (
              /* Index view */
              <div>
                {/* Profile card */}
                <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 14, marginBottom: 8, boxShadow: "var(--sh-sm)" }}>
                  {isCompany ? (
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-xl)", color: "#fff", flexShrink: 0 }}>
                      {(user?.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                  ) : (
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 99, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "var(--text-xl)", color: "#fff" }}>
                        {(user?.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ position: "absolute", bottom: -2, right: -2, width: 18, height: 18, borderRadius: 99, background: "var(--success)", border: "3px solid var(--card)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon n="check" s={9} c="#fff" />
                      </div>
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 2 }}>{user?.name || "—"}</div>
                    <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email || ""}</div>
                    {user?.status === "VERIFIED" && (
                      <div style={{ marginTop: 4, padding: "2px 8px", borderRadius: 99, background: "var(--success-tint)", border: "1px solid rgba(31,122,58,0.2)", display: "inline-block", fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--success)", letterSpacing: 0.5 }}>✓ VERIFIERAD</div>
                    )}
                  </div>
                </div>

                {/* Settings groups */}
                <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", marginBottom: 8, boxShadow: "var(--sh-sm)" }}>
                  {sections.map((s, i) => (
                    <button key={s.k} type="button" onClick={() => setSection(s.k)} style={{ width: "100%", padding: "14px 16px", background: "transparent", border: "none", borderBottom: i < sections.length - 1 ? "1px solid var(--line)" : "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 13, minHeight: 54, textAlign: "left", fontFamily: "inherit" }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon n={s.i} s={14} c="var(--green-text)" />
                      </div>
                      <span style={{ flex: 1, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--ink-900)" }}>{s.l}</span>
                      <span style={{ color: "var(--ink-300)", fontSize: "var(--text-xs)" }}>›</span>
                    </button>
                  ))}
                </div>

                <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", marginBottom: 24, boxShadow: "var(--sh-sm)" }}>
                  <Link to="/loggaut" style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px 16px", textDecoration: "none", minHeight: 54 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--danger-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon n="trash" s={14} c="var(--danger)" />
                    </div>
                    <span style={{ flex: 1, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--danger)" }}>Logga ut</span>
                  </Link>
                </div>

                <div style={{ textAlign: "center", fontSize: "var(--text-2xs)", color: "var(--ink-300)", paddingBottom: 8 }}>STP v2.4.1</div>
              </div>
            )}
          </div>
        ) : (
          /* Desktop: sidebar + content grid */
          <div className="set-grid">
            <nav style={{ display: "flex", flexDirection: "column", gap: 4, position: "sticky", top: 28 }}>
              {sections.map((s) => {
                const active = section === s.k;
                return (
                  <button
                    key={s.k}
                    type="button"
                    onClick={() => setSection(s.k)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 11, padding: "11px 14px", borderRadius: 10, textAlign: "left", background: active ? "var(--green-tint)" : "transparent", color: active ? "var(--green-text)" : "var(--ink-700)", fontSize: "var(--text-base)", fontWeight: active ? 700 : 500, border: "none", cursor: "pointer", fontFamily: "inherit", transition: "background .12s", whiteSpace: "nowrap" }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--card-2)"; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    <Icon n={s.i} s={17} c={active ? "var(--green-text)" : "var(--ink-500)"} />
                    {s.l}
                  </button>
                );
              })}
            </nav>
            <div style={{ minWidth: 0 }} className="stp-fade-up">
              {renderContent()}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
