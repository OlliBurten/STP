import { useState, useCallback, useRef, useEffect } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { useNavigate, Link } from "react-router-dom";
import { createOrganization } from "../api/organizations.js";
import { useAuth } from "../context/AuthContext";
import { segmentOptions } from "../data/segments";
import { apiGet } from "../api/client.js";

const DUPLICATE_ORG_MSG = "Organisationsnumret används redan av ett annat åkeri.";

const inputStyle = {
  width: "100%", padding: "14px 16px", borderRadius: 12,
  background: "var(--paper-2)", border: "1.5px solid var(--line-2)",
  color: "var(--ink-900)", fontSize: "var(--text-md)", fontFamily: "inherit",
  outline: "none", transition: "border-color .2s", boxSizing: "border-box",
};

export default function AddCompany() {
  const { refreshOrgs, switchOrg } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [duplicate, setDuplicate] = useState(false);
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
    setDuplicate(false);
    setError("");

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
          nameFromLookup: Boolean(data.companyName),
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
    setDuplicate(false);
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
      if (err.message === DUPLICATE_ORG_MSG) {
        setDuplicate(true);
      } else {
        setError(err.message || "Kunde inte lägga till åkeriet. Försök igen.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--paper)", color: "var(--ink-900)",
      fontFamily: "inherit", paddingBottom: "80px",
    }}>
      {/* Progress-bar */}
      <div style={{ height: 3, background: "var(--line)" }}>
        <div style={{ height: 3, background: "var(--green)", width: "50%" }} />
      </div>

      <div style={{ maxWidth: "var(--w-form)", margin: "0 auto", padding: isMobile ? "24px 20px 0" : "48px 24px 0" }}>
        {/* Tillbaka */}
        <Link to="/foretag" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: "var(--text-sm)", color: "var(--ink-400)", textDecoration: "none", marginBottom: isMobile ? 22 : 36,
        }}>
          ← Tillbaka
        </Link>

        <p style={{ fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--amber-text)", marginBottom: 12 }}>
          Lägg till åkeri
        </p>
        <h1 style={{ fontSize: isMobile ? "clamp(30px, 8.5vw, 40px)" : "var(--text-5xl)", fontWeight: 900, lineHeight: 1.1, marginBottom: 12 }}>
          Ange ert<br />
          <span style={{ color: "var(--green-text)" }}>organisationsnummer.</span>
        </h1>
        <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", lineHeight: 1.7, marginBottom: 36 }}>
          Vi hämtar företagsuppgifterna automatiskt — ni behöver bara ert organisationsnummer.
        </p>

        {/* Orgnummer */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--ink-500)", marginBottom: 8 }}>
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
                  ? "var(--danger)"
                  : orgLookup.valid === true
                    ? "var(--success)"
                    : undefined,
                paddingRight: 120,
              }}
            />
            {orgLookup.loading && (
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: "var(--text-xs)", color: "var(--ink-400)" }}>
                Kontrollerar…
              </span>
            )}
            {orgLookup.valid === true && !orgLookup.loading && (
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--green-text)" }}>
                ✓ Giltigt
              </span>
            )}
          </div>

          {/* Bolagsverket-feedback */}
          {orgLookup.error && (
            <p style={{ marginTop: 8, fontSize: "var(--text-xs)", color: "var(--danger)" }}>{orgLookup.error}</p>
          )}
          {orgLookup.valid === true && !orgLookup.loading && orgLookup.isTransport !== false && (
            <div style={{
              marginTop: 12, padding: "12px 16px", borderRadius: 12,
              background: "var(--success-tint)", border: "1px solid var(--success)",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ color: "var(--green-text)", fontSize: "var(--text-lg)" }}>✓</span>
              <div>
                <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--green-text)" }}>
                  {form.name || "Företag hittades"}
                </p>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 2 }}>
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
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            }}>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--danger)", fontWeight: 600 }}>
                Ert företag är inte registrerat som transportverksamhet hos Bolagsverket.
                STP är till för åkerier och transportföretag.
              </p>
            </div>
          )}
        </div>

        {/* Företagsnamn — endast som fallback när slagningen inte gav något namn */}
        {orgLookup.valid === true && !orgLookup.loading && orgLookup.isTransport !== false && !orgLookup.nameFromLookup && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--ink-500)", marginBottom: 8 }}>
              Företagsnamn *
            </p>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Ert åkeri AB"
              style={{
                ...inputStyle,
                borderColor: form.name.trim().length > 0 ? "var(--success)" : undefined,
              }}
            />
            {!form.name.trim() && (
              <p style={{ marginTop: 6, fontSize: "var(--text-xs)", color: "var(--ink-400)" }}>
                Vi hittade inget företagsnamn — ange det manuellt.
              </p>
            )}
          </div>
        )}

        {/* Duplicerat org-nummer */}
        {duplicate && (
          <div style={{
            marginBottom: 20, padding: "16px 18px", borderRadius: 12,
            background: "var(--amber-tint)", border: "1px solid var(--amber)",
          }}>
            <p style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--amber-text)", marginBottom: 6 }}>
              Det här åkeriet finns redan på STP.
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", lineHeight: 1.6 }}>
              Varje åkeri kan bara läggas till av en person. Det finns två alternativ:
            </p>
            <ul style={{ marginTop: 8, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
              <li style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)" }}>
                → <strong style={{ color: "var(--ink-900)" }}>Redan ett konto?</strong>{" "}
                <Link to="/login" style={{ color: "var(--amber-text)", textDecoration: "underline" }}>Logga in</Link>{" "}
                med det kontot som skapade åkeriet.
              </li>
              <li style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)" }}>
                → <strong style={{ color: "var(--ink-900)" }}>Anställd på åkeriet?</strong>{" "}
                Be den som äger kontot bjuda in dig via <em>Headern → Team</em>.
              </li>
            </ul>
          </div>
        )}

        {/* Övriga fel */}
        {error && (
          <p style={{ marginBottom: 20, fontSize: "var(--text-sm)", color: "var(--danger)" }}>{error}</p>
        )}

        {/* Spara */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !canSave}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            padding: "14px 32px", borderRadius: 12, border: "none",
            background: "var(--green)", color: "#fff", fontWeight: 700, fontSize: "var(--text-md)",
            fontFamily: "inherit", cursor: saving || !canSave ? "default" : "pointer",
            opacity: saving || !canSave ? 0.4 : 1, transition: "opacity .15s",
            minWidth: 200,
          }}
        >
          {saving ? "Lägger till…" : "Lägg till åkeri →"}
        </button>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", marginTop: 12 }}>
          Gratis för åkerier · Ingen bindningstid
        </p>
      </div>
    </div>
  );
}
