import { useEffect, useState, useCallback, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { fetchMyCompanyProfile, updateMyCompanyProfile } from "../api/companies.js";
import { fetchMyOrganizations, createOrganization } from "../api/organizations.js";
import { createCompanyInvite } from "../api/invites.js";
import { segmentOptions } from "../data/segments";
import { useAuth } from "../context/AuthContext";
import { trackCompanyOnboardingComplete } from "../utils/segmentMetrics";
import { apiGet } from "../api/client.js";

// ── Design tokens (matchar DriverOnboardingWizard) ──────────────────────────
const T = {
  bg:      "#050e0e",
  bg2:     "#0a1818",
  bg3:     "#0d2b2b",
  primary: "#1F5F5C",
  pLight:  "#2a7a76",
  pGlow:   "rgba(31,95,92,0.3)",
  pDim:    "rgba(31,95,92,0.15)",
  amber:   "#F5A623",
  amberDim:"rgba(245,166,35,0.12)",
  text:    "#f0faf9",
  sub:     "rgba(240,250,249,0.55)",
  muted:   "rgba(240,250,249,0.3)",
  border:  "rgba(255,255,255,0.08)",
  border2: "rgba(255,255,255,0.14)",
  card:    "rgba(255,255,255,0.04)",
  green:   "#4ade80",
  red:     "#f87171",
};

const inputStyle = {
  width: "100%", padding: "14px 16px", borderRadius: 12,
  background: T.bg2, border: `1.5px solid ${T.border2}`,
  color: T.text, fontSize: 15, fontFamily: "inherit",
  outline: "none", transition: "border-color .2s",
};

// ── Atoms ───────────────────────────────────────────────────────────────────
const Btn = ({ children, v = "primary", onClick, style, disabled, type = "button" }) => {
  const vs = {
    primary: { bg: T.primary,                  color: "#fff",   border: "none" },
    amber:   { bg: T.amber,                     color: "#0a1010",border: "none" },
    outline: { bg: "transparent",               color: T.text,   border: `1.5px solid ${T.border2}` },
    dim:     { bg: "rgba(255,255,255,0.07)",     color: T.sub,    border: "none" },
    green:   { bg: "rgba(74,222,128,0.12)",      color: T.green,  border: `1px solid rgba(74,222,128,0.25)` },
  };
  const s = vs[v] || vs.primary;
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
      fontFamily: "inherit", fontWeight: 700, cursor: disabled ? "default" : "pointer",
      border: s.border, borderRadius: 11, fontSize: 14, padding: "11px 24px",
      minHeight: 44, background: s.bg, color: s.color, opacity: disabled ? 0.4 : 1,
      transition: "all .15s", ...style,
    }}>{children}</button>
  );
};

// ── Company preview card ─────────────────────────────────────────────────────
function CompanyPreview({ name, orgNumber, city, isTransport }) {
  const completion = [
    name?.trim().length > 0,
    orgNumber?.replace(/\D/g, "").length >= 10,
  ].filter(Boolean).length;
  const pct = Math.round(completion / 2 * 100);

  return (
    <div style={{
      background: T.bg2, border: `1px solid ${T.border}`,
      borderRadius: 16, overflow: "hidden",
      position: "sticky", top: 80,
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${T.bg3} 0%, #061414 100%)`,
        padding: "20px 20px 16px",
      }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted, marginBottom: 12 }}>
          Ert åkeri
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `linear-gradient(135deg, ${T.primary} 0%, ${T.pLight} 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 900, color: "#fff",
            border: "2px solid rgba(255,255,255,0.12)", flexShrink: 0,
          }}>
            {name?.trim() ? name.trim().split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase() : "?"}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: T.text }}>
              {name?.trim() || <span style={{ color: T.muted }}>Företagsnamn</span>}
            </p>
            <p style={{ fontSize: 11, color: T.sub }}>
              {city ? `📍 ${city}` : orgNumber?.replace(/\D/g,"").length >= 10 ? "📍 Hämtar stad…" : <span style={{ color: T.muted }}>📍 Stad</span>}
            </p>
          </div>
        </div>
        {isTransport && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 20,
            background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)",
          }}>
            <span style={{ fontSize: 10, color: T.green }}>✓</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.green }}>Verifierat transportföretag</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: T.sub }}>Kontoprofil</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 80 ? T.green : pct >= 50 ? T.amber : T.sub }}>{pct}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 5, background: "rgba(255,255,255,0.08)" }}>
          <div style={{
            height: 5, borderRadius: 5, transition: "width .4s",
            background: pct >= 80 ? T.green : pct >= 50 ? T.amber : T.primary,
            width: `${pct}%`,
          }} />
        </div>
      </div>

      {/* Checklist */}
      <div style={{ padding: "14px 20px" }}>
        {[
          { label: "Organisationsnummer", done: orgNumber?.replace(/\D/g,"").length >= 10 },
          { label: "Företagsnamn hämtat", done: name?.trim().length > 0 },
        ].map(({ label, done }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "6px 0", borderBottom: `1px solid rgba(255,255,255,0.04)`,
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
              background: done ? "rgba(74,222,128,0.15)" : "transparent",
              border: `1.5px solid ${done ? T.green : T.border2}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, color: T.green,
            }}>{done ? "✓" : ""}</div>
            <span style={{ fontSize: 12, color: done ? T.text : T.muted, fontWeight: done ? 500 : 400 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Huvudkomponent ──────────────────────────────────────────────────────────
export default function CompanyOnboardingWizard() {
  const { hasApi, refreshUser, refreshOrgs, switchOrg } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [step, setStep]                     = useState(0); // 0=orgnr, 1=invite, 2=done
  const [error, setError]                   = useState("");
  const [profile, setProfile]               = useState(null);
  const [needsFirstCompany, setNeedsFirstCompany] = useState(false);

  // Formulärdata — segmentDefaults sätts till alla värden automatiskt (inget val behövs i onboarding)
  const [form, setForm] = useState({
    orgNumber: "", name: "", region: "", city: "",
    foundedYear: null, segmentDefaults: segmentOptions.map(s => s.value),
  });
  const [orgLookup, setOrgLookup] = useState({
    loading: false, valid: null, isTransport: null, suggestion: null, error: null,
  });
  const lookupTimer = useRef(null);

  // Inbjudan
  const [inviteEmail, setInviteEmail]     = useState("");
  const [inviteList, setInviteList]       = useState([]);
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteErrors, setInviteErrors]   = useState({});

  // Ladda befintlig profil
  useEffect(() => {
    if (!hasApi) { setLoading(false); return; }
    Promise.all([fetchMyCompanyProfile().catch(() => null), fetchMyOrganizations().catch(() => [])])
      .then(([profileData, orgs]) => {
        setProfile(profileData);
        setNeedsFirstCompany(!profileData && (!orgs || orgs.length === 0));
      })
      .finally(() => setLoading(false));
  }, [hasApi]);

  // Org-nummer → Bolagsverket
  const handleOrgNumberChange = useCallback((raw) => {
    setForm(p => ({ ...p, orgNumber: raw }));
    setOrgLookup({ loading: false, valid: null, isTransport: null, suggestion: null, error: null });
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 10) return;
    clearTimeout(lookupTimer.current);
    lookupTimer.current = setTimeout(async () => {
      setOrgLookup(s => ({ ...s, loading: true }));
      try {
        const data = await apiGet(`/api/utils/company-lookup?orgnr=${encodeURIComponent(raw)}`);
        setOrgLookup({
          loading: false,
          valid: data.valid,
          isTransport: data.isTransport ?? null,
          suggestion: data.companyName || null,
          error: data.valid ? null : (data.error || "Ogiltigt organisationsnummer"),
        });
        if (data.formatted) setForm(p => ({ ...p, orgNumber: data.formatted }));
        setForm(p => ({
          ...p,
          name:        data.companyName && !p.name.trim() ? data.companyName : p.name,
          city:        data.city        ? data.city        : p.city,
          foundedYear: data.foundedYear ? data.foundedYear : p.foundedYear,
        }));
      } catch {
        setOrgLookup({ loading: false, valid: null, isTransport: null, suggestion: null, error: null });
      }
    }, 600);
  }, [form.name]);

  useEffect(() => () => clearTimeout(lookupTimer.current), []);

  // Guards
  if (!hasApi) return <Navigate to="/foretag" replace />;
  if (!loading && profile && (profile.companySegmentDefaults || []).length > 0)
    return <Navigate to="/foretag" replace />;
  if (!loading && !needsFirstCompany && !profile)
    return <Navigate to="/foretag" replace />;

  // Spara och gå till steg 1 (inbjudan)
  const handleSave = async () => {
    setError("");
    if (!form.orgNumber.trim()) { setError("Fyll i organisationsnummer."); return; }
    if (orgLookup.valid === false) { setError("Ogiltigt organisationsnummer — kontrollera och försök igen."); return; }
    if (orgLookup.valid !== true)  { setError("Vänta tills organisationsnumret har validerats."); return; }
    if (orgLookup.isTransport === false) {
      setError("Ert företag är inte registrerat som transportverksamhet hos Bolagsverket. STP är till för åkerier och transportföretag.");
      return;
    }

    setSaving(true);
    try {
      if (needsFirstCompany) {
        const org = await createOrganization({
          name: form.name.trim(),
          orgNumber: form.orgNumber.trim(),
          region: form.region || undefined,
          segmentDefaults: form.segmentDefaults,
        });
        await refreshUser?.();
        await refreshOrgs?.();
        if (org?.id) switchOrg?.(org.id);
      } else {
        await updateMyCompanyProfile({
          name: profile?.name || "",
          companyName: form.name || profile?.companyName || "",
          companyDescription: profile?.companyDescription || "",
          companyWebsite: profile?.companyWebsite || "",
          companyLocation: form.city || profile?.companyLocation || "",
          companySegmentDefaults: form.segmentDefaults,
        });
        await refreshUser?.();
      }
      trackCompanyOnboardingComplete(form.segmentDefaults);
      setStep(1);
    } catch (e) {
      setError(e.message || "Kunde inte spara. Försök igen.");
    } finally {
      setSaving(false);
    }
  };

  // Inbjudan
  const addInvite = () => {
    const t = inviteEmail.trim().toLowerCase();
    if (!t || inviteList.includes(t) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return;
    setInviteList(p => [...p, t]);
    setInviteEmail("");
  };
  const removeInvite = (email) => {
    setInviteList(p => p.filter(e => e !== email));
    setInviteErrors(p => { const n = { ...p }; delete n[email]; return n; });
  };
  const sendInvites = async () => {
    if (inviteList.length === 0) { finish(); return; }
    setInviteSending(true);
    const errors = {};
    for (const email of inviteList) {
      try { await createCompanyInvite(email); }
      catch (e) { errors[email] = e.message || "Kunde inte skicka"; }
    }
    setInviteSending(false);
    if (Object.keys(errors).length > 0) { setInviteErrors(errors); return; }
    finish();
  };
  const finish = () => {
    setStep(2);
    setTimeout(() => navigate("/foretag", { replace: true }), 2400);
  };

  // ── Gemensam wrapper ──────────────────────────────────────────────────────
  const canContinue = () => {
    if (step === 0) {
      const digits = form.orgNumber.replace(/\D/g, "");
      return digits.length >= 10 && orgLookup.valid === true && orgLookup.isTransport !== false && !orgLookup.loading;
    }
    return true;
  };

  const wrapStyle = {
    minHeight: "100vh",
    background: T.bg,
    color: T.text,
    fontFamily: "inherit",
    marginTop: "-64px",
    paddingTop: "64px",
  };

  // ── Done ─────────────────────────────────────────────────────────────────
  if (step === 2) return (
    <div style={{ ...wrapStyle, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(74,222,128,0.1)", border: "2px solid rgba(74,222,128,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, margin: "0 auto 24px", color: T.green,
        }}>✓</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.15, marginBottom: 14 }}>
          Ni är live<br />
          <span style={{ color: T.green }}>på STP!</span>
        </h1>
        <p style={{ fontSize: 15, color: T.sub, lineHeight: 1.7, marginBottom: 32 }}>
          {form.name || "Ert åkeri"} är nu aktiv på plattformen. Ni kan publicera jobb och kontakta förare direkt.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
          {[
            { icon: "🚛", title: "Hitta förare direkt", text: "Sök bland förare med rätt körkort och region — kontakta dem utan mellanhänder." },
            { icon: "📋", title: "Publicera er första annons", text: "En jobbannons når förare som matchar er region och era körkortskrav automatiskt." },
            { icon: "🔔", title: "Bli hittade av förare", text: "Förare söker bland åkerier på STP — er profil visas för dem i er region." },
          ].map(({ icon, title, text }) => (
            <div key={title} style={{
              display: "flex", gap: 14, padding: "14px 16px", borderRadius: 12, textAlign: "left",
              background: T.card, border: `1px solid ${T.border}`,
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{title}</p>
                <p style={{ fontSize: 12, color: T.sub, lineHeight: 1.5 }}>{text}</p>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: T.muted }}>Tar dig till dashboarden…</p>
      </div>
    </div>
  );

  // ── Steg 1: Inbjudan ─────────────────────────────────────────────────────
  if (step === 1) return (
    <div style={{ ...wrapStyle, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 520, width: "100%" }}>
        {/* Steg-prickar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32, justifyContent: "center" }}>
          {["Företag", "Team"].map((label, i) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: i < 1 ? T.primary : "transparent",
                border: i === 1 ? `2px solid ${T.primary}` : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: i < 1 ? "#fff" : T.primary,
              }}>{i < 1 ? "✓" : "2"}</div>
              <span style={{ fontSize: 10, color: i === 1 ? T.text : T.muted }}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 20, padding: "32px 36px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.amber, marginBottom: 14 }}>
            Steg 2 · Bjud in team
          </p>
          <h2 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.2, marginBottom: 10 }}>
            Lägg till<br />
            <span style={{ color: "#7dd3c8" }}>teammedlemmar.</span>
          </h2>
          <p style={{ fontSize: 14, color: T.sub, marginBottom: 28, lineHeight: 1.65 }}>
            Valfritt — kolleger som ska ha åtkomst till kontot. De får en inbjudan via e-post.
          </p>

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addInvite(); } }}
              placeholder="kollega@foretagsnamn.se"
              style={{ ...inputStyle, flex: 1 }}
            />
            <Btn v="outline" onClick={addInvite}>Lägg till</Btn>
          </div>

          {inviteList.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
              {inviteList.map(email => (
                <div key={email} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderRadius: 10, background: T.card, border: `1px solid ${T.border}`,
                }}>
                  <span style={{ fontSize: 13, color: T.text }}>{email}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {inviteErrors[email] && <span style={{ fontSize: 11, color: T.red }}>{inviteErrors[email]}</span>}
                    <button onClick={() => removeInvite(email)} style={{
                      background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 18, lineHeight: 1,
                    }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24 }}>
            <button onClick={finish} style={{
              background: "none", border: "none", color: T.muted, cursor: "pointer",
              fontSize: 13, fontFamily: "inherit", textDecoration: "underline",
            }}>Hoppa över</button>
            <Btn onClick={sendInvites} disabled={inviteSending}>
              {inviteSending
                ? "Skickar…"
                : inviteList.length > 0
                  ? `Skicka ${inviteList.length === 1 ? "inbjudan" : `${inviteList.length} inbjudningar`} →`
                  : "Fortsätt →"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Steg 0 + 1: Wizard (org + segment) ───────────────────────────────────
  const showSidebar = true;

  return (
    <div style={{ ...wrapStyle, padding: "0 0 80px" }}>
      {/* Progress-bar */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.06)" }}>
        <div style={{
          height: 3, background: T.primary, transition: "width .4s",
          width: step === 0 ? "40%" : "100%",
        }} />
      </div>

      <div style={{
        maxWidth: 1060, margin: "0 auto", padding: "48px 24px 0",
        display: "grid",
        gridTemplateColumns: showSidebar ? "1fr 320px" : "1fr",
        gap: 48,
        alignItems: "start",
      }}>
        {/* LEFT — steg-innehåll */}
        <div>
          {/* Steg-prickar */}
          <div style={{ display: "flex", gap: 6, marginBottom: 40 }}>
            {["Företag", "Team"].map((label, i) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: i === 0 ? T.primary : "transparent",
                  border: i > 0 ? `2px solid ${T.border2}` : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  color: i === 0 ? "#fff" : T.muted,
                }}>1</div>
                <span style={{ fontSize: 10, color: i === 0 ? T.text : T.muted }}>{label}</span>
              </div>
            ))}
          </div>

          {/* ── Steg 0: Orgnr ── */}
          {step === 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.amber, marginBottom: 14 }}>
                Välkommen till STP
              </p>
              <h1 style={{ fontSize: 38, fontWeight: 900, lineHeight: 1.1, marginBottom: 14 }}>
                Starta ert åkeri<br />
                <span style={{ color: "#7dd3c8" }}>på 3 minuter.</span>
              </h1>
              <p style={{ fontSize: 15, color: T.sub, lineHeight: 1.7, marginBottom: 36, maxWidth: 500 }}>
                Vi hämtar företagsuppgifter automatiskt från Bolagsverket — ni behöver bara ert organisationsnummer.
              </p>

              {/* Fördelar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36, maxWidth: 520 }}>
                {[
                  { icon: "🎯", title: "Hitta rätt förare snabbare", text: "Sök bland förare med CE/C, rätt region och rätt tillgänglighet — allt på ett ställe." },
                  { icon: "📋", title: "Publicera jobb direkt", text: "En annons når automatiskt förare som matchar era krav. Inga jobbportaler." },
                  { icon: "✓", title: "Automatisk verifiering", text: "Transportföretag verifieras mot Bolagsverket direkt — inga väntetider." },
                ].map(({ icon, title, text }) => (
                  <div key={title} style={{
                    display: "flex", gap: 14, padding: "14px 18px", borderRadius: 14,
                    background: T.card, border: `1px solid ${T.border}`,
                  }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 3 }}>{title}</p>
                      <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.55 }}>{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Org-nummer input */}
              <div style={{ maxWidth: 520 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 8 }}>Organisationsnummer *</p>
                <div style={{ position: "relative" }}>
                  <input
                    value={form.orgNumber}
                    onChange={e => handleOrgNumberChange(e.target.value)}
                    placeholder="556123-4567"
                    style={{
                      ...inputStyle,
                      borderColor: orgLookup.valid === false
                        ? "rgba(248,113,113,0.6)"
                        : orgLookup.valid === true
                          ? "rgba(74,222,128,0.5)"
                          : T.border2,
                      paddingRight: 120,
                    }}
                  />
                  {orgLookup.loading && (
                    <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: T.muted }}>
                      Kontrollerar…
                    </span>
                  )}
                  {orgLookup.valid === true && !orgLookup.loading && (
                    <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 600, color: T.green }}>
                      ✓ Giltigt
                    </span>
                  )}
                </div>

                {/* Bolagsverket-feedback */}
                {orgLookup.error && (
                  <p style={{ marginTop: 8, fontSize: 12, color: T.red }}>{orgLookup.error}</p>
                )}
                {orgLookup.valid === true && !orgLookup.loading && orgLookup.isTransport !== false && (
                  <div style={{
                    marginTop: 12, padding: "12px 16px", borderRadius: 12,
                    background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ color: T.green, fontSize: 16 }}>✓</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: T.green }}>
                        {form.name || orgLookup.suggestion || "Företag hittades"}
                      </p>
                      <p style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>
                        Registrerat transportföretag — verifieras automatiskt.
                        {form.city ? ` 📍 ${form.city}` : ""}
                      </p>
                    </div>
                  </div>
                )}
                {orgLookup.valid === true && !orgLookup.loading && orgLookup.isTransport === false && (
                  <div style={{
                    marginTop: 12, padding: "12px 16px", borderRadius: 12,
                    background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
                  }}>
                    <p style={{ fontSize: 12, color: T.red, fontWeight: 600 }}>
                      Ert företag är inte registrerat som transportverksamhet hos Bolagsverket.
                      STP är till för åkerier och transportföretag.
                    </p>
                  </div>
                )}

                {error && step === 0 && (
                  <p style={{ marginTop: 10, fontSize: 13, color: T.red }}>{error}</p>
                )}
              </div>

              {/* Navigering */}
              <div style={{ marginTop: 36, maxWidth: 520 }}>
                <Btn
                  disabled={saving || !canContinue()}
                  onClick={handleSave}
                  style={{ minWidth: 200 }}
                >
                  {saving ? "Sparar…" : "Skapa konto →"}
                </Btn>
                <p style={{ fontSize: 12, color: T.muted, marginTop: 12 }}>
                  Gratis för åkerier · Ingen bindningstid
                </p>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT — preview */}
        <CompanyPreview
          name={form.name}
          orgNumber={form.orgNumber}
          city={form.city}
          isTransport={orgLookup.isTransport}
        />
      </div>
    </div>
  );
}
