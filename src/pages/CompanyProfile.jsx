import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyCompanyProfile, updateMyCompanyProfile, updateCompanyNotificationSettings } from "../api/companies.js";
import { listCompanyInvites, createCompanyInvite, revokeCompanyInvite } from "../api/invites.js";
import { changePassword } from "../api/auth.js";
import { useAuth } from "../context/AuthContext";
import { useIsMobile } from "../hooks/useIsMobile";
import { segmentOptions } from "../data/segments";
import { branschValues } from "../data/bransch.js";
import BranschSearch from "../components/BranschSearch.jsx";
import { regions } from "../data/mockJobs.js";
import LoadingBlock from "../components/LoadingBlock";
import { useToast } from "../context/ToastContext";
import { EyeIcon, EyeOffIcon } from "../components/Icons";

// ─── Design tokens ────────────────────────────────────────────────────────────
const inp = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
  color: "#f0faf9", fontSize: 14, outline: "none", fontFamily: "inherit",
  boxSizing: "border-box",
};
const lbl = { display: "block", fontSize: 12, fontWeight: 700, color: "rgba(240,250,249,0.5)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 7 };
const hint = { fontSize: 12, color: "rgba(240,250,249,0.35)", marginTop: 5, lineHeight: 1.6 };

function Field({ label, sub, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={lbl}>{label}</label>
      {sub && <div style={{ ...hint, marginTop: 0, marginBottom: 7 }}>{sub}</div>}
      {children}
    </div>
  );
}

function Card({ title, sub, children, accent }) {
  return (
    <div style={{ background: "#0a1414", border: `1px solid ${accent ? "rgba(245,166,35,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: 18, padding: "24px 28px", marginBottom: 16 }}>
      {title && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#f0faf9", letterSpacing: -0.3, margin: 0 }}>{title}</h2>
          {sub && <p style={{ ...hint, marginTop: 5 }}>{sub}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <div onClick={disabled ? undefined : onChange}
      style={{ width: 44, height: 24, borderRadius: 12, background: checked ? "#F5A623" : "rgba(255,255,255,0.1)", cursor: disabled ? "default" : "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: checked ? 23 : 3, width: 18, height: 18, borderRadius: 9, background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
    </div>
  );
}

function CheckRow({ label, sub, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}>
      <div
        onClick={onChange}
        style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? "#F5A623" : "rgba(255,255,255,0.2)"}`, background: checked ? "#F5A623" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all .15s", cursor: "pointer" }}>
        {checked && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#f0faf9", marginBottom: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "rgba(240,250,249,0.45)", lineHeight: 1.5 }}>{sub}</div>}
      </div>
    </label>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CompanyProfile() {
  const isMobile = useIsMobile();
  const { hasApi, user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isOwner = !user?.companyOwnerId;

  const [invites, setInvites] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [lastDevInviteLink, setLastDevInviteLink] = useState("");

  const [notifSettings, setNotifSettings] = useState(null);
  const [notifSaving, setNotifSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNext, setShowPwNext] = useState(false);

  useEffect(() => {
    if (!hasApi) { setLoading(false); return; }
    fetchMyCompanyProfile()
      .then((data) => {
        setProfile(data);
        setDraft(data);
        if (data?.emailNotificationSettings) setNotifSettings(data.emailNotificationSettings);
      })
      .finally(() => setLoading(false));
  }, [hasApi]);

  useEffect(() => {
    if (!hasApi || !isOwner) return;
    listCompanyInvites().then(setInvites).catch(() => setInvites([]));
  }, [hasApi, isOwner]);

  const changed = useMemo(
    () => JSON.stringify(profile || {}) !== JSON.stringify(draft || {}),
    [profile, draft]
  );

  const save = async () => {
    if (!draft || !changed) return;
    setSaving(true);
    try {
      const updated = await updateMyCompanyProfile({
        name: draft.name || "",
        companyName: draft.companyName || "",
        companyDescription: draft.companyDescription || "",
        companyWebsite: draft.companyWebsite || "",
        companyLocation: draft.companyLocation || "",
        companySegmentDefaults: Array.isArray(draft.companySegmentDefaults) ? draft.companySegmentDefaults : [],
        companyBransch: (Array.isArray(draft.companyBransch) ? draft.companyBransch : []).filter((b) => branschValues.includes(b)),
        companyRegion: draft.companyRegion !== undefined ? draft.companyRegion : "",
        fSkattsedel: Boolean(draft.fSkattsedel),
        industryOrgMember: Boolean(draft.industryOrgMember),
        industryOrgName: draft.industryOrgName || null,
        policyAgreedAt: draft.policyAgreedAt || null,
        companyContactEmail: draft.companyContactEmail || null,
        companyContactPhone: draft.companyContactPhone || null,
      });
      setProfile(updated);
      setDraft(updated);
      toast.success("Företagsprofilen är sparad!");
    } catch {
      toast.error("Kunde inte spara profilen. Försök igen.");
    } finally {
      setSaving(false);
    }
  };

  const darkPage = { background: "#060f0f", minHeight: "100vh", marginTop: "-64px", paddingTop: 64, color: "#f0faf9" };

  if (loading) return <main style={darkPage}><div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px" }}><LoadingBlock message="Hämtar företagsprofil..." /></div></main>;

  if (!hasApi) return (
    <main style={darkPage}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px", textAlign: "center", color: "rgba(240,250,249,0.4)" }}>
        Företagsprofil kräver API-läge.
      </div>
    </main>
  );

  return (
    <main style={darkPage}>
      {/* Floating save bar */}
      {changed && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: "rgba(6,15,15,0.96)", backdropFilter: "blur(14px)", borderTop: "1px solid rgba(245,166,35,0.3)", padding: isMobile ? "14px 20px 18px" : "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <span style={{ fontSize: 13, color: "#F5A623", fontWeight: 600 }}>Osparade ändringar</span>
          <button type="button" onClick={save} disabled={saving}
            style={{ padding: "10px 22px", borderRadius: 99, background: saving ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#F5A623,#d97706)", color: saving ? "rgba(255,255,255,0.3)" : "#000", fontSize: 13.5, fontWeight: 800, border: "none", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {saving ? "Sparar..." : "Spara ändringar"}
          </button>
        </div>
      )}

      <div style={{ maxWidth: 760, margin: "0 auto", padding: isMobile ? "28px 20px 100px" : "36px 32px 100px" }}>
        {/* Tillbaka */}
        <Link to="/foretag" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "rgba(240,250,249,0.45)", textDecoration: "none", marginBottom: 24 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Tillbaka till översikten
        </Link>

        <h1 style={{ fontSize: isMobile ? 26 : 32, fontWeight: 900, letterSpacing: -1, marginBottom: 28, color: "#f0faf9" }}>Företagsprofil</h1>

        {/* Varning: saknar bransch/region */}
        {draft && (!Array.isArray(draft.companyBransch) || draft.companyBransch.length === 0 || !draft.companyRegion) && (
          <div style={{ marginBottom: 20, padding: "14px 18px", borderRadius: 14, background: "rgba(245,166,35,0.07)", border: "1px solid rgba(245,166,35,0.25)", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#F5A623", marginBottom: 3 }}>Syns inte i Hitta åkerier ännu</div>
              <div style={{ fontSize: 12, color: "rgba(245,166,35,0.75)", lineHeight: 1.5 }}>Fyll i <strong>bransch</strong> och <strong>region</strong> nedan så att förare kan hitta er.</div>
            </div>
          </div>
        )}

        {/* ── Grunduppgifter ── */}
        <Card title="Grunduppgifter">
          <Field label="Företagsnamn">
            <input style={inp} value={draft?.companyName || ""} onChange={(e) => setDraft((p) => ({ ...p, companyName: e.target.value }))} />
          </Field>
          <Field label="Kontaktperson">
            <input style={inp} value={draft?.name || ""} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <Field label="Ort">
              <input style={inp} value={draft?.companyLocation || ""} onChange={(e) => setDraft((p) => ({ ...p, companyLocation: e.target.value }))} placeholder="t.ex. Malmö" />
            </Field>
            <Field label="Region">
              <select style={{ ...inp, appearance: "none" }} value={draft?.companyRegion || ""} onChange={(e) => setDraft((p) => ({ ...p, companyRegion: e.target.value }))}>
                <option value="">Välj region</option>
                {regions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Om företaget" sub="Beskriv ert åkeri, uppdrag och vad ni erbjuder förare.">
            <textarea style={{ ...inp, minHeight: 120, lineHeight: 1.6, resize: "vertical" }}
              value={draft?.companyDescription || ""}
              onChange={(e) => setDraft((p) => ({ ...p, companyDescription: e.target.value }))}
              placeholder="Vi är ett åkeri med fokus på..."
            />
          </Field>
          <Field label="Webbplats">
            <input style={inp} value={draft?.companyWebsite || ""} onChange={(e) => setDraft((p) => ({ ...p, companyWebsite: e.target.value }))} placeholder="https://..." />
          </Field>
        </Card>

        {/* ── Bransch & segment ── */}
        <Card title="Bransch & segment" sub="Används för matchning och synlighet i Åkeri-söket.">
          <Field label="Bransch">
            <BranschSearch
              value={draft?.companyBransch || []}
              onChange={(v) => setDraft((prev) => ({ ...prev, companyBransch: v }))}
              placeholder="Sök bransch, t.ex. tankbil, timmerbil..."
            />
          </Field>
          <Field label="Standardsegment för nya annonser" sub="Används som förval i publiceringsflödet.">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {segmentOptions.map((segment) => {
                const active = (draft?.companySegmentDefaults || []).includes(segment.value);
                return (
                  <button key={segment.value} type="button"
                    onClick={() => setDraft((prev) => {
                      const cur = prev?.companySegmentDefaults || [];
                      return { ...prev, companySegmentDefaults: cur.includes(segment.value) ? cur.filter((s) => s !== segment.value) : [...cur, segment.value] };
                    })}
                    style={{ padding: "8px 14px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s", background: active ? "rgba(31,95,92,0.35)" : "rgba(255,255,255,0.04)", border: `1px solid ${active ? "rgba(31,95,92,0.6)" : "rgba(255,255,255,0.09)"}`, color: active ? "#6ee7e7" : "rgba(240,250,249,0.45)" }}>
                    {segment.label}
                  </button>
                );
              })}
            </div>
          </Field>
        </Card>

        {/* ── Kontaktuppgifter ── */}
        <Card title="Kontaktuppgifter" sub="Visas för inloggade förare i åkeridatabasen — direktväg för spontankontakt.">
          <Field label="Kontakt-e-post">
            <input style={inp} type="email" value={draft?.companyContactEmail || ""} onChange={(e) => setDraft((p) => ({ ...p, companyContactEmail: e.target.value || null }))} placeholder="rekrytering@ert-akeri.se" />
          </Field>
          <Field label="Telefon (valfritt)">
            <input style={inp} type="tel" value={draft?.companyContactPhone || ""} onChange={(e) => setDraft((p) => ({ ...p, companyContactPhone: e.target.value || null }))} placeholder="070-000 00 00" />
          </Field>
        </Card>

        {/* ── Certifieringar ── */}
        <Card title="Certifieringar & trovärdighet" sub="Visas som badges på er offentliga profil. Ni intygar på heder att uppgifterna stämmer.">
          <CheckRow
            label="Vi innehar F-skattsedel"
            sub="Intygar att ni betalar arbetsgivaravgifter och följer Skatteverkets regler."
            checked={Boolean(draft?.fSkattsedel)}
            onChange={() => setDraft((p) => ({ ...p, fSkattsedel: !p?.fSkattsedel }))}
          />
          <CheckRow
            label="Medlem i branschorganisation"
            sub="T.ex. Transportföretagen, Sveriges Åkeriföretag (SÅ), TYA eller liknande."
            checked={Boolean(draft?.industryOrgMember)}
            onChange={() => setDraft((p) => ({ ...p, industryOrgMember: !p?.industryOrgMember }))}
          />
          {draft?.industryOrgMember && (
            <div style={{ marginLeft: 32, marginTop: 8 }}>
              <input style={inp} value={draft?.industryOrgName || ""} onChange={(e) => setDraft((p) => ({ ...p, industryOrgName: e.target.value }))} placeholder="t.ex. Sveriges Åkeriföretag" />
            </div>
          )}
          <CheckRow
            label="Vi förbinder oss att följa STP:s uppförandekod"
            sub="Intygar att ni inte diskriminerar, villfarar eller missbrukar plattformen."
            checked={Boolean(draft?.policyAgreedAt)}
            onChange={() => setDraft((p) => ({ ...p, policyAgreedAt: p?.policyAgreedAt ? null : new Date().toISOString() }))}
          />
        </Card>

        {/* ── Teammedlemmar ── */}
        {isOwner && (
          <Card title="Bjud in teammedlemmar" sub="Kollegor som ska kunna logga in, publicera jobb och söka förare.">
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!inviteEmail.trim()) return;
              setInviteError("");
              setInviteLoading(true);
              try {
                const result = await createCompanyInvite(inviteEmail.trim());
                setInviteEmail("");
                setInvites(await listCompanyInvites());
                setLastDevInviteLink(result.devInviteLink || "");
                toast.success(result.emailSent ? "Inbjudan skickad!" : "Inbjudan skapad — kopiera länken nedan.");
              } catch (err) {
                setInviteError(err.message || "Kunde inte skicka inbjudan");
              } finally {
                setInviteLoading(false);
              }
            }}>
              <div style={{ display: "flex", gap: 10, flexDirection: isMobile ? "column" : "row" }}>
                <input style={{ ...inp, flex: 1 }} type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="kollega@foretag.se" disabled={inviteLoading} />
                <button type="submit" disabled={inviteLoading || !inviteEmail.trim()}
                  style={{ padding: "11px 22px", borderRadius: 10, background: "linear-gradient(135deg,#F5A623,#d97706)", color: "#000", fontSize: 13, fontWeight: 800, border: "none", cursor: inviteLoading || !inviteEmail.trim() ? "not-allowed" : "pointer", opacity: inviteLoading || !inviteEmail.trim() ? 0.5 : 1, whiteSpace: "nowrap", fontFamily: "inherit" }}>
                  {inviteLoading ? "Skickar..." : "Skicka inbjudan"}
                </button>
              </div>
            </form>
            {inviteError && <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: 13 }}>{inviteError}</div>}
            {lastDevInviteLink && (
              <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: 12, background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#F5A623", marginBottom: 8 }}>Länk att dela manuellt (dev)</div>
                <code style={{ display: "block", fontSize: 11, color: "rgba(240,250,249,0.7)", wordBreak: "break-all", lineHeight: 1.6 }}>{lastDevInviteLink}</code>
                <button type="button" onClick={() => navigator.clipboard.writeText(lastDevInviteLink).then(() => toast.success("Kopierad"), () => {})}
                  style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "#F5A623", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
                  Kopiera länk
                </button>
              </div>
            )}
            {invites.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,250,249,0.35)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Skickade inbjudningar</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {invites.map((inv) => (
                    <div key={inv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{inv.email}</span>
                        <span style={{ marginLeft: 10, fontSize: 11, color: inv.status === "ACCEPTED" ? "#4ade80" : "rgba(240,250,249,0.4)" }}>
                          {inv.status === "PENDING" ? "Väntar" : inv.status === "ACCEPTED" ? "Accepterad" : "Återkallad"}
                        </span>
                      </div>
                      {inv.status === "PENDING" && (
                        <button type="button"
                          onClick={async () => { try { await revokeCompanyInvite(inv.id); setInvites(await listCompanyInvites()); } catch (err) { setInviteError(err.message); } }}
                          style={{ fontSize: 12, fontWeight: 600, color: "#f87171", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                          Återkalla
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ── E-postnotiser ── */}
        <Card title="E-postnotiser" sub="Välj vilka påminnelser ni vill få via e-post.">
          {[
            { key: "profileReminder", label: "Profilpåminnelser",       desc: "Påminnelse när er företagsprofil inte är komplett." },
            { key: "jobMatch",        label: "Förarrekommendationer",   desc: "När nya förare matchar era krav publiceras." },
            { key: "messageReminder", label: "Obesvarade meddelanden",  desc: "Påminnelse när ett meddelande väntar på svar." },
            { key: "inactivity",      label: "Inaktivitetspåminnelse",  desc: "Om ni inte loggat in på 30 dagar." },
          ].map(({ key, label, desc }, i) => {
            const enabled = notifSettings ? notifSettings[key] !== false : true;
            return (
              <div key={key} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "13px 0", borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)", gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#f0faf9" }}>{label}</div>
                  <div style={{ fontSize: 12, color: "rgba(240,250,249,0.45)", marginTop: 2 }}>{desc}</div>
                </div>
                <Toggle checked={enabled} disabled={notifSaving} onChange={async () => {
                  const next = { ...(notifSettings || {}), [key]: !enabled };
                  setNotifSettings(next);
                  setNotifSaving(true);
                  try { await updateCompanyNotificationSettings(next); }
                  catch { setNotifSettings((prev) => ({ ...prev, [key]: enabled })); }
                  finally { setNotifSaving(false); }
                }} />
              </div>
            );
          })}
        </Card>

        {/* ── Ändra lösenord ── */}
        <Card title="Ändra lösenord" sub="Välj ett nytt lösenord på minst 8 tecken.">
          <form onSubmit={async (e) => {
            e.preventDefault();
            setPwError(""); setPwSuccess("");
            if (pwForm.next.length < 8) { setPwError("Lösenordet måste vara minst 8 tecken."); return; }
            if (pwForm.next !== pwForm.confirm) { setPwError("Lösenorden matchar inte."); return; }
            setPwLoading(true);
            try { await changePassword(pwForm.current, pwForm.next); setPwSuccess("Lösenordet har uppdaterats."); setPwForm({ current: "", next: "", confirm: "" }); }
            catch (err) { setPwError(err.message || "Kunde inte uppdatera lösenordet."); }
            finally { setPwLoading(false); }
          }} style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 420 }}>
            {pwError && <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: 13 }}>{pwError}</div>}
            {pwSuccess && <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", fontSize: 13 }}>{pwSuccess}</div>}
            {[
              { id: "cp-current", label: "Nuvarande lösenord", key: "current", show: showPwCurrent, setShow: setShowPwCurrent },
              { id: "cp-next",    label: "Nytt lösenord",       key: "next",    show: showPwNext,    setShow: setShowPwNext    },
              { id: "cp-confirm", label: "Bekräfta nytt lösenord", key: "confirm", show: showPwNext, setShow: null },
            ].map(({ id, label, key, show, setShow }) => (
              <div key={id}>
                <label htmlFor={id} style={lbl}>{label}</label>
                <div style={{ position: "relative" }}>
                  <input id={id} type={show ? "text" : "password"} value={pwForm[key]} onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))} required style={{ ...inp, paddingRight: setShow ? 44 : 14 }} />
                  {setShow && (
                    <button type="button" onClick={() => setShow((v) => !v)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(240,250,249,0.4)", display: "flex" }}>
                      {show ? <EyeOffIcon style={{ width: 18, height: 18 }} /> : <EyeIcon style={{ width: 18, height: 18 }} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button type="submit" disabled={pwLoading}
              style={{ alignSelf: "flex-start", padding: "11px 24px", borderRadius: 10, background: pwLoading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#F5A623,#d97706)", color: pwLoading ? "rgba(255,255,255,0.3)" : "#000", fontSize: 13.5, fontWeight: 800, border: "none", cursor: pwLoading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {pwLoading ? "Sparar…" : "Spara nytt lösenord"}
            </button>
          </form>
        </Card>
      </div>
    </main>
  );
}
