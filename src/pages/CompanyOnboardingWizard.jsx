import { useEffect, useState, useCallback, useRef } from "react";
import { Navigate, Link } from "react-router-dom";
import { fetchMyCompanyProfile, updateMyCompanyProfile } from "../api/companies.js";
import { fetchMyOrganizations, createOrganization } from "../api/organizations.js";
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
  zap: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
  star: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
};
const Icon = ({ n, s = 18, c = "currentColor" }) => (
  <span style={{ display: "inline-flex", width: s, height: s, color: c, flexShrink: 0 }}>{IC[n]}</span>
);

const WIZARD_STEPS = [
  { id: "welcome",  label: "Välkommen" },
  { id: "org",      label: "Ditt åkeri" },
  { id: "segments", label: "Verksamhet" },
  { id: "profile",  label: "Profil" },
];

const TRANSPORT_TYPES = [
  { value: "Fjärrtransport",    label: "Fjärrtransport",    desc: "Långväga godstransporter" },
  { value: "Distribution",      label: "Distribution",      desc: "Lokal och regional distribution" },
  { value: "Tank & ADR",        label: "Tank & ADR",        desc: "Farligt gods och flytande last" },
  { value: "Bygg & schakt",     label: "Bygg & schakt",     desc: "Anläggningstransporter" },
  { value: "Skog & timmer",     label: "Skog & timmer",     desc: "Virkestransporter och skogsbranschen" },
  { value: "Specialtransport",  label: "Specialtransport",  desc: "Tung last och specialfordon" },
];

const SIZES = [
  { v: "1-5",   l: "1–5 förare" },
  { v: "6-20",  l: "6–20 förare" },
  { v: "21-50", l: "21–50 förare" },
  { v: "50+",   l: "50+ förare" },
];

const inp = {
  width: "100%", padding: "12px 14px", borderRadius: 11,
  background: "var(--paper-2)", border: "1px solid var(--line)",
  color: "var(--ink-900)", fontSize: "var(--text-base)", outline: "none", fontFamily: "inherit",
};

// ─── Step 0: Welcome ──────────────────────────────────────────────────────────
function Step0() {
  const features = [
    { icon: "search", title: "Sök bland aktiva förare", desc: "Se alla verifierade yrkesförare med rätt körkort och erfarenhet — sortera och filtrera direkt." },
    { icon: "zap",    title: "Direktkontakt",           desc: "Kontakta förare direkt i plattformen. Inga mellanhänder, inga förmedlingsavgifter." },
    { icon: "star",   title: "Verifierade profiler",    desc: "Alla förare har styrkt sina körkort och certifikat. Du vet vad du får." },
  ];
  return (
    <div>
      <h1 style={{ fontSize: "var(--text-4xl)", fontWeight: 800, letterSpacing: -0.8, marginBottom: 8, lineHeight: 1.2 }}>
        Välkommen till STP
      </h1>
      <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.55, marginBottom: 32 }}>
        Vi hjälper åkerier att hitta rätt förare — utan mellanhänder. Sätt upp din profil på fyra minuter.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {features.map(({ icon, title, desc }) => (
          <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "18px 20px", borderRadius: 14, background: "var(--card)", border: "1px solid var(--line)" }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon n={icon} s={18} c="var(--green-text)" />
            </div>
            <div>
              <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--ink-900)", marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.5 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 1: Org lookup ───────────────────────────────────────────────────────
function Step1({ form, orgLookup, onLookup, error }) {
  return (
    <div>
      <h1 style={{ fontSize: "var(--text-4xl)", fontWeight: 800, letterSpacing: -0.8, marginBottom: 8, lineHeight: 1.2 }}>
        Hej! Vilket åkeri jobbar du på?
      </h1>
      <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.55, marginBottom: 28 }}>
        Vi hämtar uppgifterna från Bolagsverket så slipper du fylla i allt manuellt.
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--ink-700)", marginBottom: 7, display: "block" }}>
          Organisationsnummer
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={form.orgNumber}
            onChange={(e) => onLookup(e.target.value)}
            placeholder="556677-8899"
            style={{ ...inp, flex: 1, fontSize: "var(--text-lg)", letterSpacing: 0.5, borderColor: orgLookup.valid === false ? "rgba(239,68,68,0.6)" : orgLookup.valid === true ? "rgba(74,222,128,0.5)" : "var(--line)" }}
          />
          <button
            type="button"
            onClick={() => onLookup(form.orgNumber, true)}
            disabled={orgLookup.loading || form.orgNumber.replace(/\D/g, "").length < 10}
            style={{ padding: "0 18px", borderRadius: 11, background: "var(--green)", border: "none", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 800, cursor: orgLookup.loading ? "default" : "pointer", display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", opacity: form.orgNumber.replace(/\D/g, "").length < 10 ? 0.5 : 1, fontFamily: "inherit" }}
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
        <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-400)", marginTop: 6 }}>Format: 556677-8899</div>
      </div>

      {orgLookup.error && (
        <div style={{ padding: "10px 14px", borderRadius: 11, background: "var(--danger-tint)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)", fontSize: "var(--text-sm)", marginBottom: 14 }}>
          {orgLookup.error}
        </div>
      )}

      {orgLookup.valid === true && !orgLookup.loading && form.companyName && (
        <div style={{ padding: "18px 20px", background: "var(--success-tint)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 13, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: 99, background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon n="check" s={14} c="var(--success)" />
            </div>
            <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--success)" }}>Hämtat från Bolagsverket</div>
          </div>
          <div style={{ fontSize: "var(--text-lg)", fontWeight: 800, marginBottom: 4 }}>{form.companyName}</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
            {form.city && <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>{form.city}</div>}
            {form.companyType && <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)" }}>·</div>}
            {form.companyType && <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>{form.companyType}</div>}
            {form.foundedYear && <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)" }}>·</div>}
            {form.foundedYear && <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>Grundat {form.foundedYear}</div>}
          </div>
        </div>
      )}

      {orgLookup.valid === true && !orgLookup.loading && orgLookup.isTransport === false && (
        <div style={{ padding: "12px 16px", borderRadius: 12, background: "var(--danger-tint)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 14 }}>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--danger)", fontWeight: 600 }}>
            Ert företag är inte registrerat som transportverksamhet hos Bolagsverket.
            STP är till för åkerier och transportföretag.
          </p>
        </div>
      )}

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--danger-tint)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)", fontSize: "var(--text-sm)", marginBottom: 14 }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Transport segments ───────────────────────────────────────────────
function Step2({ form, setForm }) {
  const toggle = (v) => setForm((p) => {
    const cur = p.transportTypes || [];
    return { ...p, transportTypes: cur.includes(v) ? cur.filter((s) => s !== v) : [...cur, v] };
  });

  return (
    <div>
      <h1 style={{ fontSize: "var(--text-4xl)", fontWeight: 800, letterSpacing: -0.8, marginBottom: 8, lineHeight: 1.2 }}>
        Vilken typ av transport kör ni?
      </h1>
      <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.55, marginBottom: 28 }}>
        Vi matchar er med förare som söker rätt typ av uppdrag. Välj en eller flera.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
        {TRANSPORT_TYPES.map(({ value, label, desc }) => {
          const on = (form.transportTypes || []).includes(value);
          return (
            <button key={value} type="button" onClick={() => toggle(value)}
              style={{
                padding: "16px 16px", borderRadius: 13, textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                background: on ? "var(--green-tint)" : "var(--card)",
                border: `1px solid ${on ? "var(--green)" : "var(--line)"}`,
                transition: "all .15s",
              }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: on ? "var(--green-text)" : "var(--ink-900)", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: "var(--text-xs)", color: on ? "var(--green-text)" : "var(--ink-500)", opacity: on ? 0.8 : 1, lineHeight: 1.4 }}>{desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 3: Regions + size ───────────────────────────────────────────────────
function Step3({ form, setForm }) {
  const toggleRegion = (r) => setForm((p) => {
    const cur = p.companyRegions || [];
    return { ...p, companyRegions: cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r] };
  });

  return (
    <div>
      <h1 style={{ fontSize: "var(--text-4xl)", fontWeight: 800, letterSpacing: -0.8, marginBottom: 8, lineHeight: 1.2 }}>
        Var och hur stor är ni?
      </h1>
      <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.55, marginBottom: 28 }}>
        Används för att matcha er med förare i rätt region.
      </p>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--ink-700)", marginBottom: 10, display: "block" }}>
          Hur stort är ert åkeri?
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SIZES.map((s) => {
            const on = form.companySize === s.v;
            return (
              <button key={s.v} type="button" onClick={() => setForm((p) => ({ ...p, companySize: s.v }))}
                style={{ padding: "10px 18px", borderRadius: 99, fontFamily: "inherit", cursor: "pointer", fontSize: "var(--text-sm)", fontWeight: 700, transition: "all .15s", background: on ? "var(--green-tint)" : "var(--card)", border: `1px solid ${on ? "var(--green)" : "var(--line)"}`, color: on ? "var(--green-text)" : "var(--ink-600)" }}>
                {s.l}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--ink-700)", marginBottom: 10, display: "block" }}>
          Vilka regioner kör ni i? Välj alla som gäller
        </label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {regions.map((r) => {
            const on = (form.companyRegions || []).includes(r);
            return (
              <button key={r} type="button" onClick={() => toggleRegion(r)}
                style={{ padding: "7px 13px", borderRadius: 99, background: on ? "var(--green-tint)" : "var(--paper-2)", border: `1px solid ${on ? "var(--green)" : "var(--line)"}`, color: on ? "var(--green-text)" : "var(--ink-500)", fontSize: "var(--text-xs)", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}>
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
      <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--success)", marginBottom: 10 }}>Klart!</div>
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 10, color: "var(--ink-900)" }}>
        Välkommen till STP{form.companyName ? ` — ${form.companyName}` : ""}!
      </h1>
      <p style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.55, maxWidth: 440, margin: "0 auto 32px" }}>
        Ert konto är skapat. För att börja anställa behöver ni verifiera er och publicera er första annons.
      </p>

      <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, padding: 6, textAlign: "left", marginBottom: 24 }}>
        {[
          { icon: "truck",  title: "Publicera annons",       desc: "Beskriv tjänsten — vi matchar förare automatiskt · 5 min", to: "/foretag/annonser/ny", primary: true },
          { icon: "shield", title: "Verifiera åkeriet",      desc: "Ladda upp F-skatt och trafiktillstånd · 4 min",            to: "/foretag/verifiering" },
          { icon: "search", title: "Sök bland förare",       desc: "Bläddra bland verifierade yrkesförare direkt",             to: "/forare" },
        ].map((item, i) => (
          <Link key={i} to={item.to}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 14px", borderRadius: 11, background: item.primary ? "var(--green-tint)" : "transparent", textDecoration: "none", color: "var(--ink-900)", transition: "background .15s", border: item.primary ? "1px solid rgba(30,107,91,0.15)" : "1px solid transparent", marginBottom: i < 2 ? 4 : 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: item.primary ? "var(--green-tint)" : "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon n={item.icon} s={16} c={item.primary ? "var(--green-text)" : "var(--ink-400)"} />
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: 2, color: item.primary ? "var(--green-text)" : "var(--ink-900)" }}>{item.title}</div>
              <div style={{ fontSize: "var(--text-2xs)", color: item.primary ? "var(--green-text)" : "var(--ink-400)", opacity: item.primary ? 0.8 : 1 }}>{item.desc}</div>
            </div>
            <Icon n="arrow" s={14} c={item.primary ? "var(--green-text)" : "var(--ink-300)"} />
          </Link>
        ))}
      </div>

      <Link to="/foretag" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 22px", borderRadius: 99, background: "var(--green)", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 800, textDecoration: "none", boxShadow: "var(--sh-sm)" }}>
        Gå till översikten <Icon n="arrow" s={14} />
      </Link>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CompanyOnboardingWizard() {
  const { hasApi, refreshUser, refreshOrgs, switchOrg } = useAuth();
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0); // 0, 1, 2, 3, "done"
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [needsFirstCompany, setNeedsFirstCompany] = useState(false);

  const [form, setForm] = useState({
    orgNumber: "",
    companyName: "",
    city: "",
    foundedYear: null,
    companyType: null,
    transportTypes: [],
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
    if (step === 0) return true;
    if (step === 1) {
      const digits = form.orgNumber.replace(/\D/g, "");
      return digits.length >= 10 && orgLookup.valid === true && orgLookup.isTransport !== false && !orgLookup.loading && form.companyName.trim().length > 0;
    }
    if (step === 2) return (form.transportTypes || []).length > 0;
    if (step === 3) return (form.companyRegions || []).length > 0 && !!form.companySize;
    return true;
  };

  const handleNext = async () => {
    setError("");
    if (step < 3) { setStep((s) => s + 1); return; }
    // Step 3 → save
    setSaving(true);
    try {
      const segmentValues = form.transportTypes.length > 0 ? form.transportTypes : ["Fjärrtransport"];
      if (needsFirstCompany) {
        const org = await createOrganization({
          name: form.companyName.trim(),
          orgNumber: form.orgNumber.trim(),
          region: (form.companyRegions || [])[0] || undefined,
          segmentDefaults: segmentValues,
        });
        await refreshUser?.();
        await refreshOrgs?.();
        if (org?.id) switchOrg?.(org.id);
      } else {
        await updateMyCompanyProfile({
          name: profile?.name || "",
          companyName: form.companyName || profile?.companyName || "",
          companyDescription: profile?.companyDescription || "",
          companyWebsite: profile?.companyWebsite || "",
          companyLocation: form.city || profile?.companyLocation || "",
          companySegmentDefaults: segmentValues,
          companyRegion: (form.companyRegions || [])[0] || profile?.companyRegion || "",
        });
        await refreshUser?.();
      }
      trackCompanyOnboardingComplete(segmentValues);
      setStep("done");
    } catch (e) {
      setError(e.message || "Kunde inte spara. Försök igen.");
    } finally {
      setSaving(false);
    }
  };

  const numSteps = WIZARD_STEPS.length;
  const stepIdx = typeof step === "number" ? step : null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", color: "var(--ink-900)", display: "flex", flexDirection: "column" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* TopBar */}
      <div style={{ height: 60, borderBottom: "1px solid var(--line)", background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/stp-logo.png" alt="STP – Sveriges Transportplattform" style={{ height: 26, width: "auto", display: "block" }} />
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", paddingLeft: 8, marginLeft: 4, borderLeft: "1px solid var(--line-2)", fontWeight: 600, letterSpacing: 0.5 }}>Åkeri</span>
        </div>
        <Link to="/loggaut" style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", fontWeight: 600, textDecoration: "none" }}>Spara &amp; avsluta</Link>
      </div>

      <div style={{ maxWidth: 620, width: "100%", margin: "0 auto", padding: "32px 24px 40px", flex: 1, display: "flex", flexDirection: "column" }}>
        {step !== "done" && (
          <>
            {/* Progress segments */}
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {WIZARD_STEPS.map((s, i) => (
                <div key={s.id} style={{ height: 4, flex: 1, borderRadius: 2, background: i <= stepIdx ? "var(--green)" : "var(--line-2)", transition: "background .3s" }} />
              ))}
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", fontWeight: 600, marginBottom: 32 }}>
              Steg {stepIdx + 1} av {numSteps} · {WIZARD_STEPS[stepIdx]?.label}
            </div>
          </>
        )}

        <div className="stp-fade-up" key={step} style={{ flex: 1 }}>
          {step === 0 && <Step0 />}
          {step === 1 && <Step1 form={form} setForm={setForm} orgLookup={orgLookup} onLookup={handleOrgLookup} error={error} />}
          {step === 2 && <Step2 form={form} setForm={setForm} />}
          {step === 3 && <Step3 form={form} setForm={setForm} />}
          {step === "done" && <DoneScreen form={form} />}
        </div>

        {step !== "done" && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 20px", borderRadius: 10, background: "transparent", border: "1px solid var(--line-2)", color: "var(--ink-500)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                <Icon n="back" s={14} /> Tillbaka
              </button>
            ) : <span />}
            <button
              type="button"
              onClick={handleNext}
              disabled={!canContinue() || saving}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", borderRadius: 10, background: canContinue() && !saving ? "var(--green)" : "var(--paper-2)", border: "none", color: canContinue() && !saving ? "#fff" : "var(--ink-300)", fontSize: "var(--text-sm)", fontWeight: 800, cursor: canContinue() && !saving ? "pointer" : "default", boxShadow: canContinue() && !saving ? "var(--sh-sm)" : "none", transition: "all .15s", fontFamily: "inherit" }}
            >
              {saving ? "Sparar…" : step === 3 ? "Skapa konto" : step === 0 ? "Kom igång" : "Fortsätt"}
              {!saving && <Icon n="arrow" s={14} />}
            </button>
          </div>
        )}
      </div>

      {/* Mobile sticky CTA */}
      {isMobile && step !== "done" && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, padding: "14px 20px max(env(safe-area-inset-bottom), 24px)", background: "var(--card)", borderTop: "1px solid var(--line)", zIndex: 40 }}>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canContinue() || saving}
            style={{ width: "100%", padding: 16, borderRadius: 14, background: canContinue() && !saving ? "var(--green)" : "var(--paper-2)", border: "none", color: canContinue() && !saving ? "#fff" : "var(--ink-300)", fontSize: "var(--text-md)", fontWeight: 800, cursor: canContinue() && !saving ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}
          >
            {saving ? "Sparar…" : step === 3 ? "Skapa konto" : step === 0 ? "Kom igång" : "Fortsätt"} {!saving && <Icon n="arrow" s={14} />}
          </button>
        </div>
      )}
    </div>
  );
}
