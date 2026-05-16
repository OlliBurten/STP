import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createOrganization } from "../api/organizations.js";
import { useAuth } from "../context/AuthContext";
import { segmentOptions } from "../data/segments";
import { apiGet } from "../api/client.js";

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:      "#050e0e",
  bg2:     "#0a1818",
  bg3:     "#0d2b2b",
  primary: "#1F5F5C",
  pLight:  "#2a7a76",
  amber:   "#F5A623",
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
  outline: "none", transition: "border-color .2s", boxSizing: "border-box",
};

export default function AddCompany() {
  const { refreshOrgs, switchOrg } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [form, setForm]       = useState({
    name: "", orgNumber: "", location: "", region: "", foundedYear: null,
    segmentDefaults: segmentOptions.map(s => s.value),
  });
  const [orgLookup, setOrgLookup] = useState({
    loading: false, valid: null, isTransport: null, error: null,
  });
  const lookupTimer = useRef(null);

  const handleOrgNumberChange = useCallback((raw) => {
    const digits    = raw.replace(/\D/g, "").slice(0, 10);
    const formatted = digits.length > 6 ? `${digits.slice(0, 6)}-${digits.slice(6)}` : digits;

    setForm(p => ({ ...p, orgNumber: formatted, name: "", location: "", region: "", foundedYear: null }));
    setOrgLookup({ loading: false, valid: null, isTransport: null, error: null });

    if (digits.length < 10) return;
    clearTimeout(lookupTimer.current);
    lookupTimer.current = setTimeout(async () => {
      setOrgLookup(s => ({ ...s, loading: true }));
      try {
        const data = await apiGet(`/api/utils/company-lookup?orgnr=${encodeURIComponent(formatted)}`);
        setOrgLookup({
          loading: false,
          valid: data.valid,
          isTransport: data.isTransport ?? null,
          error: data.valid ? null : (data.error || "Ogiltigt organisationsnummer"),
        });
        setForm(p => ({
          ...p,
          orgNumber:   data.formatted    || p.orgNumber,
          name:        data.companyName  || "",
          location:    data.city         || "",
          region:      data.region       || "",
          foundedYear: data.foundedYear  || null,
        }));
      } catch {
        setOrgLookup({ loading: false, valid: null, isTransport: null, error: null });
      }
    }, 600);
  }, []);

  useEffect(() => () => clearTimeout(lookupTimer.current), []);

  const canSave =
    form.orgNumber.replace(/\D/g, "").length >= 10 &&
    orgLookup.valid === true &&
    orgLookup.isTransport !== false &&
    !orgLookup.loading &&
    form.name.trim().length > 0;

  const handleSubmit = async () => {
    setError("");
    if (!form.orgNumber.trim())      { setError("Fyll i organisationsnummer."); return; }
    if (orgLookup.valid === false)   { setError("Ogiltigt organisationsnummer — kontrollera och försök igen."); return; }
    if (orgLookup.valid !== true)    { setError("Vänta tills organisationsnumret har validerats."); return; }
    if (orgLookup.isTransport === false) {
      setError("Ert företag är inte registrerat som transportverksamhet hos Bolagsverket. STP är till för åkerier och transportföretag.");
      return;
    }
    if (!form.name.trim())           { setError("Fyll i företagsnamn."); return; }

    setSaving(true);
    try {
      const org = await createOrganization({
        name:            form.name.trim(),
        orgNumber:       form.orgNumber.trim(),
        location:        form.location   || undefined,
        region:          form.region     || undefined,
        foundedYear:     form.foundedYear || undefined,
        segmentDefaults: form.segmentDefaults,
      });
      await refreshOrgs();
      switchOrg(org.id);
      navigate("/foretag", { replace: true });
    } catch (err) {
      setError(err.message || "Kunde inte lägga till åkeriet. Försök igen.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, color: T.text,
      fontFamily: "inherit", marginTop: "-64px", paddingTop: "64px",
      paddingBottom: "80px",
    }}>
      {/* Progress-bar */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.06)" }}>
        <div style={{ height: 3, background: T.primary, width: "50%" }} />
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px 0" }}>
        {/* Tillbaka */}
        <Link to="/foretag" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 13, color: T.muted, textDecoration: "none", marginBottom: 36,
        }}>
          ← Tillbaka
        </Link>

        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.amber, marginBottom: 12 }}>
          Lägg till åkeri
        </p>
        <h1 style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.1, marginBottom: 12 }}>
          Ange ert<br />
          <span style={{ color: "#7dd3c8" }}>organisationsnummer.</span>
        </h1>
        <p style={{ fontSize: 15, color: T.sub, lineHeight: 1.7, marginBottom: 36 }}>
          Vi hämtar företagsuppgifter automatiskt från Bolagsverket — ni behöver bara ert organisationsnummer.
        </p>

        {/* Orgnummer */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 8 }}>
            Organisationsnummer *
          </p>
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
                  {form.name || "Företag hittades"}
                </p>
                <p style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>
                  Registrerat transportföretag — verifieras automatiskt.
                  {form.location ? ` 📍 ${form.location}${form.region ? `, ${form.region}` : ""}` : ""}
                  {form.foundedYear ? ` · Grundat ${form.foundedYear}` : ""}
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
        </div>

        {/* Företagsnamn — visas när orgnr är validerat */}
        {orgLookup.valid === true && !orgLookup.loading && orgLookup.isTransport !== false && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 8 }}>
              Företagsnamn *
            </p>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Ert åkeri AB"
              style={{
                ...inputStyle,
                borderColor: form.name.trim().length > 0 ? "rgba(74,222,128,0.5)" : T.border2,
              }}
            />
            {!form.name.trim() && (
              <p style={{ marginTop: 6, fontSize: 12, color: T.muted }}>
                Bolagsverket returnerade inget namn — ange det manuellt.
              </p>
            )}
          </div>
        )}

        {/* Fel */}
        {error && (
          <p style={{ marginBottom: 20, fontSize: 13, color: T.red }}>{error}</p>
        )}

        {/* Spara */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !canSave}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            padding: "14px 32px", borderRadius: 12, border: "none",
            background: T.primary, color: "#fff", fontWeight: 700, fontSize: 15,
            fontFamily: "inherit", cursor: saving || !canSave ? "default" : "pointer",
            opacity: saving || !canSave ? 0.4 : 1, transition: "opacity .15s",
            minWidth: 200,
          }}
        >
          {saving ? "Lägger till…" : "Lägg till åkeri →"}
        </button>
        <p style={{ fontSize: 12, color: T.muted, marginTop: 12 }}>
          Gratis för åkerier · Ingen bindningstid
        </p>
      </div>
    </div>
  );
}
