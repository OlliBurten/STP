import { useEffect, useState, useCallback, useRef } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { fetchMyCompanyProfile, updateMyCompanyProfile } from "../api/companies.js";
import { fetchMyOrganizations, createOrganization } from "../api/organizations.js";
import { segmentOptions } from "../data/segments";
import { regions } from "../data/mockJobs.js";
import { useAuth } from "../context/AuthContext";
import { trackCompanyOnboardingComplete } from "../utils/segmentMetrics";
import { apiGet } from "../api/client.js";
import { useIsMobile } from "../hooks/useIsMobile";

// ─── Icons ────────────────────────────────────────────────────────────────────
const IC = {
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  arrow: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>,
  back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  truck: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
};
const Icon = ({ n, s = 18, c = "currentColor" }) => (
  <span style={{ display: "inline-flex", width: s, height: s, color: c, flexShrink: 0 }}>{IC[n]}</span>
);

// ─── StepDots ─────────────────────────────────────────────────────────────────
function StepDots({ step, total }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => {
        const num = i + 1;
        const done = step > num;
        const active = step === num;
        return (
          <div key={i} style={{ width: active ? 28 : 8, height: 8, borderRadius: 99, background: done ? "var(--success)" : active ? "var(--amber)" : "var(--line)", transition: "all .3s" }} />
        );
      })}
    </div>
  );
}

const inp = {
  width: "100%", padding: "12px 14px", borderRadius: 11,
  background: "var(--paper-2)", border: "1px solid var(--line)",
  color: "var(--ink-900)", fontSize: 14, outline: "none", fontFamily: "inherit",
};

// ─── Step 1: Company ──────────────────────────────────────────────────────────
function Step1({ form, setForm, orgLookup, onLookup, error }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--amber-text)", marginBottom: 10, textAlign: "center" }}>Steg 1 av 3</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8, marginBottom: 8, lineHeight: 1.2, textAlign: "center" }}>
        Hej! Vilket åkeri jobbar du på?
      </h1>
      <p style={{ fontSize: 14, color: "var(--ink-500)", lineHeight: 1.55, maxWidth: 440, margin: "0 auto 28px", textAlign: "center" }}>
        Vi hämtar uppgifterna från Bolagsverket så slipper du fylla i allt manuellt.
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-700)", marginBottom: 7, display: "block" }}>
          Organisationsnummer
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={form.orgNumber}
            onChange={(e) => onLookup(e.target.value)}
            placeholder="556677-8899"
            style={{ ...inp, flex: 1, fontSize: 16, letterSpacing: 0.5, borderColor: orgLookup.valid === false ? "rgba(239,68,68,0.6)" : orgLookup.valid === true ? "rgba(74,222,128,0.5)" : "var(--line)" }}
          />
          <button
            type="button"
            onClick={() => onLookup(form.orgNumber, true)}
            disabled={orgLookup.loading || form.orgNumber.replace(/\D/g, "").length < 10}
            style={{ padding: "0 18px", borderRadius: 11, background: "var(--green)", border: "none", color: "#fff", fontSize: 13, fontWeight: 800, cursor: orgLookup.loading ? "default" : "pointer", display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", opacity: form.orgNumber.replace(/\D/g, "").length < 10 ? 0.5 : 1, fontFamily: "inherit" }}
          >
            {orgLookup.loading ? (
              <>
                <span style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: 99, animation: "spin 1s linear infinite" }} />
                Hämtar...
              </>
            ) : (
              <><Icon n="search" s={13} /> Hämta</>
            )}
          </button>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--ink-400)", marginTop: 6 }}>Format: 556677-8899</div>
      </div>

      {orgLookup.error && (
        <div style={{ padding: "10px 14px", borderRadius: 11, background: "var(--danger-tint)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)", fontSize: 13, marginBottom: 14 }}>
          {orgLookup.error}
        </div>
      )}

      {orgLookup.valid === true && !orgLookup.loading && form.companyName && (
        <div style={{ padding: "18px 20px", background: "var(--success-tint)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 13, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 99, background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon n="check" s={14} c="var(--success)" />
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--success)" }}>Hämtat från Bolagsverket</div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{form.companyName}</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
            {form.city && <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{form.city}</div>}
            {form.companyType && <div style={{ fontSize: 12.5, color: "var(--ink-400)" }}>·</div>}
            {form.companyType && <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{form.companyType}</div>}
            {form.foundedYear && <div style={{ fontSize: 12.5, color: "var(--ink-400)" }}>·</div>}
            {form.foundedYear && <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>Grundat {form.foundedYear}</div>}
          </div>
        </div>
      )}

      {orgLookup.valid === true && !orgLookup.loading && orgLookup.isTransport === false && (
        <div style={{ padding: "12px 16px", borderRadius: 12, background: "var(--danger-tint)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: "var(--danger)", fontWeight: 600 }}>
            Ert företag är inte registrerat som transportverksamhet hos Bolagsverket.
            STP är till för åkerier och transportföretag.
          </p>
        </div>
      )}

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--danger-tint)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)", fontSize: 13, marginBottom: 14 }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Contact person ───────────────────────────────────────────────────
function Step2({ form, setForm }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--amber-text)", marginBottom: 10, textAlign: "center" }}>Steg 2 av 3</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8, marginBottom: 8, lineHeight: 1.2, textAlign: "center" }}>Vem är du i företaget?</h1>
      <p style={{ fontSize: 14, color: "var(--ink-500)", lineHeight: 1.55, maxWidth: 440, margin: "0 auto 28px", textAlign: "center" }}>
        Du blir kontoadministratör. Du kan bjuda in kollegor senare.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-700)", marginBottom: 7, display: "block" }}>Förnamn</label>
          <input value={form.firstName || ""} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} placeholder="t.ex. Anna" style={inp} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-700)", marginBottom: 7, display: "block" }}>Efternamn</label>
          <input value={form.lastName || ""} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} placeholder="t.ex. Karlsson" style={inp} />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-700)", marginBottom: 7, display: "block" }}>Din roll på företaget</label>
        <div style={{ position: "relative" }}>
          <select value={form.contactRole || ""} onChange={(e) => setForm((p) => ({ ...p, contactRole: e.target.value }))} style={{ ...inp, paddingRight: 40, appearance: "none", cursor: "pointer" }}>
            <option value="">Välj roll...</option>
            <option value="vd">VD / ägare</option>
            <option value="trafikledare">Trafikledare</option>
            <option value="hr">HR / rekrytering</option>
            <option value="annat">Annan roll</option>
          </select>
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--ink-400)", fontSize: 11 }}>▼</div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-700)", marginBottom: 7, display: "block" }}>Telefonnummer</label>
        <input value={form.phone || ""} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="070-123 45 67" type="tel" style={inp} />
        <div style={{ fontSize: 11.5, color: "var(--ink-400)", marginTop: 6 }}>Används bara av STP — visas inte för förare</div>
      </div>

      <div style={{ marginTop: 20, padding: "14px 16px", background: "var(--info-tint)", border: "1px solid var(--info)", borderRadius: 12, display: "flex", alignItems: "flex-start", gap: 11 }}>
        <Icon n="shield" s={15} c="var(--info)" />
        <div style={{ fontSize: 12, color: "var(--ink-500)", lineHeight: 1.5 }}>
          Vi delar aldrig dina kontaktuppgifter med tredje part. Endast verifierade förare som söker dina jobb kan kontakta er.
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Operations ───────────────────────────────────────────────────────
const SIZES = [
  { v: "1-5", l: "1–5 förare" },
  { v: "6-20", l: "6–20 förare" },
  { v: "21-50", l: "21–50 förare" },
  { v: "51-200", l: "51–200 förare" },
  { v: "200+", l: "200+ förare" },
];

function Step3({ form, setForm }) {
  const toggleSeg = (v) => setForm((p) => {
    const cur = p.segmentDefaults || [];
    return { ...p, segmentDefaults: cur.includes(v) ? cur.filter((s) => s !== v) : [...cur, v] };
  });
  const toggleRegion = (r) => setForm((p) => {
    const cur = p.companyRegions || [];
    return { ...p, companyRegions: cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r] };
  });

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--amber-text)", marginBottom: 10, textAlign: "center" }}>Steg 3 av 3</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8, marginBottom: 8, lineHeight: 1.2, textAlign: "center" }}>Berätta om er verksamhet</h1>
      <p style={{ fontSize: 14, color: "var(--ink-500)", lineHeight: 1.55, maxWidth: 440, margin: "0 auto 28px", textAlign: "center" }}>
        Vi använder detta för att matcha er med förare som söker rätt typ av jobb.
      </p>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-700)", marginBottom: 10, display: "block" }}>
          Vilken typ av transport kör ni? Välj en eller flera
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {segmentOptions.map((s) => {
            const on = (form.segmentDefaults || []).includes(s.value);
            return (
              <button key={s.value} type="button" onClick={() => toggleSeg(s.value)}
                style={{ padding: "12px 14px", borderRadius: 11, background: on ? "var(--amber-tint)" : "var(--paper-2)", border: `1px solid ${on ? "var(--amber)" : "var(--line)"}`, color: on ? "var(--amber-text)" : "var(--ink-700)", textAlign: "left", cursor: "pointer", transition: "all .15s", fontFamily: "inherit" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{s.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-700)", marginBottom: 10, display: "block" }}>
          Hur stort är ert åkeri?
        </label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {SIZES.map((s) => {
            const on = form.companySize === s.v;
            return (
              <button key={s.v} type="button" onClick={() => setForm((p) => ({ ...p, companySize: s.v }))}
                style={{ padding: "9px 14px", borderRadius: 99, background: on ? "var(--amber-tint)" : "var(--paper-2)", border: `1px solid ${on ? "var(--amber)" : "var(--line)"}`, color: on ? "var(--amber-text)" : "var(--ink-500)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {s.l}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-700)", marginBottom: 10, display: "block" }}>
          Vilka regioner kör ni i? Välj alla som gäller
        </label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {regions.map((r) => {
            const on = (form.companyRegions || []).includes(r);
            return (
              <button key={r} type="button" onClick={() => toggleRegion(r)}
                style={{ padding: "7px 13px", borderRadius: 99, background: on ? "var(--green-tint)" : "var(--paper-2)", border: `1px solid ${on ? "var(--green)" : "var(--line)"}`, color: on ? "var(--green-text)" : "var(--ink-500)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}>
                {on && <Icon n="check" s={10} />} {r}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Done screen ──────────────────────────────────────────────────────────────
function DoneScreen({ form }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ width: 72, height: 72, borderRadius: 99, background: "var(--success-tint)", border: "2px solid var(--success)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <Icon n="check" s={32} c="var(--success)" />
      </div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--success)", marginBottom: 10 }}>Klart!</div>
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 10, color: "var(--ink-900)" }}>
        Välkommen till STP{form.firstName ? `, ${form.firstName}` : ""}
      </h1>
      <p style={{ fontSize: 14, color: "var(--ink-500)", lineHeight: 1.55, maxWidth: 440, margin: "0 auto 32px" }}>
        Ert konto är skapat. För att börja anställa behöver ni verifiera er och publicera er första annons.
      </p>

      <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: 6, textAlign: "left", marginBottom: 24 }}>
        {[
          { icon: "shield", title: "Verifiera ert åkeri", desc: "Ladda upp F-skatt och trafiktillstånd · 4 min", to: "/foretag/verifiering", primary: true },
          { icon: "truck", title: "Publicera er första annons", desc: "Beskriv tjänsten — vi matchar förare automatiskt · 5 min", to: "/foretag/annonser/ny" },
          { icon: "user", title: "Komplettera företagsprofilen", desc: "Lägg till om-text, förmåner · 2 min", to: "/foretag/profil" },
        ].map((item, i) => (
          <Link key={i} to={item.to}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 14px", borderRadius: 11, background: item.primary ? "var(--amber-tint)" : "transparent", textDecoration: "none", color: "var(--ink-900)", transition: "background .15s", border: item.primary ? "1px solid rgba(245,166,35,0.2)" : "1px solid transparent", marginBottom: i < 2 ? 4 : 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: item.primary ? "var(--amber-tint)" : "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon n={item.icon} s={16} c={item.primary ? "var(--amber-text)" : "var(--ink-400)"} />
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 2, color: "var(--ink-900)" }}>{item.title}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-400)" }}>{item.desc}</div>
            </div>
            <Icon n="arrow" s={14} c="var(--ink-300)" />
          </Link>
        ))}
      </div>

      <Link to="/foretag" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 22px", borderRadius: 99, background: "var(--green)", color: "#fff", fontSize: 13.5, fontWeight: 800, textDecoration: "none", boxShadow: "var(--sh-sm)" }}>
        Gå till översikten <Icon n="arrow" s={14} />
      </Link>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CompanyOnboardingWizard() {
  const { hasApi, refreshUser, refreshOrgs, switchOrg } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1); // 1, 2, 3, done
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [needsFirstCompany, setNeedsFirstCompany] = useState(false);

  const [form, setForm] = useState({
    orgNumber: "",
    companyName: "",
    city: "",
    foundedYear: null,
    companyType: null,
    firstName: "",
    lastName: "",
    contactRole: "",
    phone: "",
    segmentDefaults: segmentOptions.map((s) => s.value),
    companySize: "",
    companyRegions: [],
  });

  const [orgLookup, setOrgLookup] = useState({
    loading: false, valid: null, isTransport: null, error: null,
  });
  const lookupTimer = useRef(null);

  useEffect(() => {
    if (!hasApi) { setLoading(false); return; }
    Promise.all([fetchMyCompanyProfile().catch(() => null), fetchMyOrganizations().catch(() => [])])
      .then(([profileData, orgs]) => {
        setProfile(profileData);
        setNeedsFirstCompany(!profileData && (!orgs || orgs.length === 0));
      })
      .finally(() => setLoading(false));
  }, [hasApi]);

  const handleOrgLookup = useCallback((raw, immediate = false) => {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    const formatted = digits.length > 6 ? `${digits.slice(0, 6)}-${digits.slice(6)}` : digits;
    setForm((p) => ({ ...p, orgNumber: formatted, companyName: "", city: "", foundedYear: null, companyType: null }));
    setOrgLookup({ loading: false, valid: null, isTransport: null, error: null });
    if (digits.length < 10) return;
    clearTimeout(lookupTimer.current);
    const delay = immediate ? 0 : 600;
    lookupTimer.current = setTimeout(async () => {
      setOrgLookup((s) => ({ ...s, loading: true }));
      try {
        const data = await apiGet(`/api/utils/company-lookup?orgnr=${encodeURIComponent(formatted)}`);
        setOrgLookup({ loading: false, valid: data.valid, isTransport: data.isTransport ?? null, error: data.valid ? null : (data.error || "Ogiltigt organisationsnummer") });
        setForm((p) => ({
          ...p,
          orgNumber: data.formatted || p.orgNumber,
          companyName: data.companyName || "",
          city: data.city || "",
          foundedYear: data.foundedYear || null,
          companyType: data.companyType || null,
        }));
      } catch {
        setOrgLookup({ loading: false, valid: null, isTransport: null, error: null });
      }
    }, delay);
  }, []);

  useEffect(() => () => clearTimeout(lookupTimer.current), []);

  if (!hasApi) return <Navigate to="/foretag" replace />;
  if (!loading && profile && (profile.companySegmentDefaults || []).length > 0) return <Navigate to="/foretag" replace />;
  if (!loading && !needsFirstCompany && !profile) return <Navigate to="/foretag" replace />;

  const canContinue = () => {
    if (step === 1) {
      const digits = form.orgNumber.replace(/\D/g, "");
      return digits.length >= 10 && orgLookup.valid === true && orgLookup.isTransport !== false && !orgLookup.loading && form.companyName.trim().length > 0;
    }
    if (step === 2) return form.firstName.trim() && form.lastName.trim() && form.contactRole;
    if (step === 3) return (form.segmentDefaults || []).length > 0 && form.companySize && (form.companyRegions || []).length > 0;
    return true;
  };

  const handleNext = async () => {
    setError("");
    if (step < 3) { setStep((s) => s + 1); return; }
    // Step 3 → save
    setSaving(true);
    try {
      if (needsFirstCompany) {
        const org = await createOrganization({
          name: form.companyName.trim(),
          orgNumber: form.orgNumber.trim(),
          region: (form.companyRegions || [])[0] || undefined,
          segmentDefaults: form.segmentDefaults,
        });
        await refreshUser?.();
        await refreshOrgs?.();
        if (org?.id) switchOrg?.(org.id);
      } else {
        await updateMyCompanyProfile({
          name: `${form.firstName} ${form.lastName}`.trim() || profile?.name || "",
          companyName: form.companyName || profile?.companyName || "",
          companyDescription: profile?.companyDescription || "",
          companyWebsite: profile?.companyWebsite || "",
          companyLocation: form.city || profile?.companyLocation || "",
          companySegmentDefaults: form.segmentDefaults,
          companyRegion: (form.companyRegions || [])[0] || profile?.companyRegion || "",
        });
        await refreshUser?.();
      }
      trackCompanyOnboardingComplete(form.segmentDefaults);
      setStep("done");
    } catch (e) {
      setError(e.message || "Kunde inte spara. Försök igen.");
    } finally {
      setSaving(false);
    }
  };

  const wrapStyle = {
    minHeight: "100vh", background: "var(--paper)", color: "var(--ink-900)",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  };

  return (
    <div style={wrapStyle}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Minimal header — on mobile: progress bar instead of step dots */}
      <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 16px" : "0 32px", borderBottom: "1px solid var(--line)", position: "sticky", top: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", zIndex: 50 }}>
        {isMobile && step !== "done" && step > 1 ? (
          <button type="button" onClick={() => setStep(s => s - 1)} style={{ width: 40, height: 40, borderRadius: 99, background: "var(--paper-2)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-700)", flexShrink: 0 }}>
            <Icon n="back" s={18} />
          </button>
        ) : (
          <div style={{ fontWeight: 800, letterSpacing: -0.8, fontSize: 21, color: "var(--ink-900)" }}>STP</div>
        )}
        {isMobile && step !== "done" ? (
          <div style={{ flex: 1, height: 4, background: "var(--line)", borderRadius: 99, overflow: "hidden", margin: "0 16px" }}>
            <div style={{ height: "100%", width: `${(step / 3) * 100}%`, background: "var(--green)", borderRadius: 99, transition: "width .3s" }} />
          </div>
        ) : (
          <div style={{ flex: 1 }} />
        )}
        <Link to="/loggaut" style={{ fontSize: 13, color: "var(--ink-400)", textDecoration: "none", fontWeight: 600 }}>Avbryt</Link>
      </header>

      <main style={{ maxWidth: 520, margin: "0 auto", padding: isMobile ? "24px 20px 120px" : "40px 24px 80px" }}>
        {step !== "done" && !isMobile && <StepDots step={step} total={3} />}

        {step === 1 && <Step1 form={form} setForm={setForm} orgLookup={orgLookup} onLookup={handleOrgLookup} error={error} />}
        {step === 2 && <Step2 form={form} setForm={setForm} />}
        {step === 3 && <Step3 form={form} setForm={setForm} />}
        {step === "done" && <DoneScreen form={form} />}

        {step !== "done" && !isMobile && (
          <>
            <div style={{ display: "flex", gap: 10, marginTop: 32 }}>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  style={{ padding: "13px 22px", borderRadius: 99, background: "transparent", border: "1px solid var(--line)", color: "var(--ink-500)", fontSize: 13.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: "inherit" }}
                >
                  <Icon n="back" s={13} /> Tillbaka
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={!canContinue() || saving}
                style={{ flex: 1, padding: "13px 22px", borderRadius: 99, background: canContinue() && !saving ? "var(--green)" : "var(--paper-2)", border: "none", color: canContinue() && !saving ? "#fff" : "var(--ink-300)", fontSize: 13.5, fontWeight: 800, cursor: canContinue() && !saving ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: canContinue() && !saving ? "var(--sh-sm)" : "none", transition: "all .15s", fontFamily: "inherit" }}
              >
                {saving ? "Sparar…" : step === 3 ? "Skapa konto" : "Fortsätt"} {!saving && <Icon n="arrow" s={14} />}
              </button>
            </div>
            <div style={{ marginTop: 24, textAlign: "center", fontSize: 11.5, color: "var(--ink-400)" }}>
              Gratis för åkerier · Ingen bindningstid
            </div>
          </>
        )}
      </main>

      {/* Mobile sticky bottom CTA */}
      {isMobile && step !== "done" && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, padding: "14px 20px 32px", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderTop: "1px solid var(--line)", zIndex: 40 }}>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canContinue() || saving}
            style={{ width: "100%", padding: 16, borderRadius: 14, background: canContinue() && !saving ? "var(--green)" : "var(--paper-2)", border: "none", color: canContinue() && !saving ? "#fff" : "var(--ink-300)", fontSize: 15, fontWeight: 800, cursor: canContinue() && !saving ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: canContinue() && !saving ? "var(--sh-sm)" : "none", minHeight: 54, fontFamily: "inherit" }}
          >
            {saving ? "Sparar…" : step === 3 ? "Skapa konto" : "Fortsätt"} {!saving && <Icon n="arrow" s={14} />}
          </button>
        </div>
      )}
    </div>
  );
}
