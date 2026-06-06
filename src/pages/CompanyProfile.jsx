import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyCompanyProfile, updateMyCompanyProfile, updateCompanyNotificationSettings } from "../api/companies.js";
import { listCompanyInvites, createCompanyInvite, revokeCompanyInvite } from "../api/invites.js";
import { changePassword } from "../api/auth.js";
import { useAuth } from "../context/AuthContext";
import { useIsMobile } from "../hooks/useIsMobile";
import { usePageTitle } from "../hooks/usePageTitle";
import { segmentOptions } from "../data/segments";
import { branschValues } from "../data/bransch.js";
import BranschSearch from "../components/BranschSearch.jsx";
import { regions } from "../data/mockJobs.js";
import LoadingBlock from "../components/LoadingBlock";
import { useToast } from "../context/ToastContext";
import { EyeIcon, EyeOffIcon } from "../components/Icons";

// ─── Shared styles ────────────────────────────────────────────────────────────
const inp = {
  width: "100%", padding: "12px 14px", borderRadius: 11,
  background: "var(--paper-2)", border: "1px solid var(--line)",
  color: "var(--ink-900)", fontSize: "var(--text-base)", outline: "none", fontFamily: "inherit",
  boxSizing: "border-box",
};
const lbl = { fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--ink-700)", marginBottom: 7, display: "block" };
const hint = { fontSize: "var(--text-2xs)", color: "var(--ink-400)", marginTop: 6, lineHeight: 1.55 };

function Field({ label, hintText, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={lbl}>{label}</label>
      {children}
      {hintText && <div style={hint}>{hintText}</div>}
    </div>
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <div onClick={disabled ? undefined : onChange}
      style={{ width: 44, height: 24, borderRadius: 12, background: checked ? "var(--green)" : "var(--paper-2)", cursor: disabled ? "default" : "pointer", position: "relative", transition: "background .2s", border: "1px solid var(--line)", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: checked ? 23 : 3, width: 18, height: 18, borderRadius: 9, background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const CheckIconMd = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ width: 13, height: 13 }}>
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 14, height: 14 }}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const DragIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 14, height: 14 }}>
    <circle cx="9" cy="6" r="1" fill="currentColor" /><circle cx="9" cy="12" r="1" fill="currentColor" /><circle cx="9" cy="18" r="1" fill="currentColor" />
    <circle cx="15" cy="6" r="1" fill="currentColor" /><circle cx="15" cy="12" r="1" fill="currentColor" /><circle cx="15" cy="18" r="1" fill="currentColor" />
  </svg>
);
const EyeExtIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// ─── Tab components ────────────────────────────────────────────────────────────
function GrundInfo({ draft, setDraft, isMobile }) {
  const toggleSeg = (v) => setDraft((p) => {
    const cur = p?.companySegmentDefaults || [];
    return { ...p, companySegmentDefaults: cur.includes(v) ? cur.filter((s) => s !== v) : [...cur, v] };
  });

  return (
    <div>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, marginBottom: 6, letterSpacing: -0.3, color: "var(--ink-900)" }}>Grundinfo</h2>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginBottom: 24 }}>Den här informationen visas högst upp på er publika profil.</p>

      <Field label="Företagsnamn">
        <input style={inp} value={draft?.companyName || ""} onChange={(e) => setDraft((p) => ({ ...p, companyName: e.target.value }))} />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
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

      <Field label="Webbplats" hintText="Visas på er profil">
        <input style={inp} value={draft?.companyWebsite || ""} onChange={(e) => setDraft((p) => ({ ...p, companyWebsite: e.target.value }))} placeholder="https://..." />
      </Field>

      <Field label="Verksamhetssegment" hintText="Påverkar vilka förare ni matchas mot">
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {segmentOptions.map((seg) => {
            const on = (draft?.companySegmentDefaults || []).includes(seg.value);
            return (
              <button key={seg.value} type="button" onClick={() => toggleSeg(seg.value)}
                style={{ padding: "8px 14px", borderRadius: 99, background: on ? "var(--green-tint)" : "var(--paper-2)", border: `1px solid ${on ? "rgba(31,95,92,0.3)" : "var(--line)"}`, color: on ? "var(--green-text)" : "var(--ink-500)", fontSize: "var(--text-xs)", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                {on && <CheckIcon />}{seg.label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Bransch" hintText="Används för matchning och synlighet i Åkeri-söket.">
        <BranschSearch
          value={draft?.companyBransch || []}
          onChange={(v) => setDraft((prev) => ({ ...prev, companyBransch: v }))}
          placeholder="Sök bransch, t.ex. tankbil, timmerbil..."
        />
      </Field>

      <Field label="Kontakt-e-post">
        <input style={inp} type="email" value={draft?.companyContactEmail || ""} onChange={(e) => setDraft((p) => ({ ...p, companyContactEmail: e.target.value || null }))} placeholder="rekrytering@ert-akeri.se" />
      </Field>
      <Field label="Telefon (valfritt)">
        <input style={inp} type="tel" value={draft?.companyContactPhone || ""} onChange={(e) => setDraft((p) => ({ ...p, companyContactPhone: e.target.value || null }))} placeholder="070-000 00 00" />
      </Field>
    </div>
  );
}

function OmOss({ draft, setDraft }) {
  const about = draft?.companyDescription || "";
  const [bvHint, setBvHint] = useState(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current || about.trim() || !draft?.companyOrgNumber) return;
    fetched.current = true;
    fetch(`/api/utils/company-lookup?orgnr=${encodeURIComponent(draft.companyOrgNumber)}`)
      .then((r) => r.json())
      .then((d) => { if (d.verksamhetsbeskrivning) setBvHint(d.verksamhetsbeskrivning); })
      .catch(() => {});
  }, [about, draft?.companyOrgNumber]);

  return (
    <div>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, marginBottom: 6, letterSpacing: -0.3, color: "var(--ink-900)" }}>Om oss</h2>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginBottom: 24 }}>Berätta vad som gör er till en bra arbetsgivare. Detta är ofta det första förare läser.</p>

      <Field label="Företagsnamn (kontaktperson)">
        <input style={inp} value={draft?.name || ""} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} placeholder="Ditt namn" />
      </Field>

      <Field label="Om företaget" hintText={`${about.length}/1000 tecken`}>
        <textarea
          style={{ ...inp, lineHeight: 1.55, resize: "vertical", minHeight: 160 }}
          value={about}
          maxLength={1000}
          onChange={(e) => setDraft((p) => ({ ...p, companyDescription: e.target.value }))}
          placeholder="Berätta er historia, värderingar, varför förare trivs hos er..."
        />
        {bvHint && !about.trim() && (
          <div style={{ marginTop: 10, padding: "10px 14px", background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 10, fontSize: "var(--text-xs)", color: "var(--ink-400)", lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700, color: "var(--ink-400)" }}>Från Bolagsverket: </span>{bvHint}
          </div>
        )}
      </Field>

      <div style={{ marginTop: 8, padding: "12px 16px", background: "var(--amber-tint)", border: "1px solid rgba(199,122,14,0.2)", borderRadius: 11, fontSize: "var(--text-xs)", color: "var(--ink-700)", lineHeight: 1.55 }}>
        <strong style={{ color: "var(--amber-text)" }}>Tips:</strong> Nämn om ni har kollektivavtal, hur bilflottan ser ut, och om förare är hemma kvällarna.
      </div>
    </div>
  );
}

function Formaner({ draft, setDraft }) {
  const benefits = draft?._benefits || [];

  const add = () => setDraft((p) => ({ ...p, _benefits: [...(p._benefits || []), ""] }));
  const update = (i, v) => setDraft((p) => ({ ...p, _benefits: (p._benefits || []).map((b, idx) => idx === i ? v : b) }));
  const remove = (i) => setDraft((p) => ({ ...p, _benefits: (p._benefits || []).filter((_, idx) => idx !== i) }));

  return (
    <div>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, marginBottom: 6, letterSpacing: -0.3, color: "var(--ink-900)" }}>Vad ni erbjuder</h2>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginBottom: 24 }}>Förmåner och villkor som lockar förare. Lägg till 3–6 punkter.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {benefits.map((b, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "var(--ink-300)", display: "inline-flex" }}><DragIcon /></span>
            <input value={b} onChange={(e) => update(i, e.target.value)} placeholder="t.ex. Kollektivavtal med Transport" style={{ ...inp, flex: 1 }} />
            <button onClick={() => remove(i)} style={{ padding: 8, borderRadius: 9, background: "transparent", border: "1px solid var(--line)", color: "var(--ink-400)", cursor: "pointer", display: "flex" }}>
              <XIcon />
            </button>
          </div>
        ))}
      </div>

      <button onClick={add} style={{ marginTop: 12, padding: "10px 16px", borderRadius: 99, background: "transparent", border: "1px dashed var(--line-2)", color: "var(--ink-500)", fontSize: "var(--text-xs)", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
        <PlusIcon /> Lägg till förmån
      </button>

      <div style={{ marginTop: 24, padding: "14px 16px", background: "var(--amber-tint-2)", border: "1px solid rgba(245,166,35,0.18)", borderRadius: 11, fontSize: "var(--text-xs)", color: "var(--ink-500)", lineHeight: 1.55 }}>
        <strong style={{ color: "var(--amber-text)" }}>Tips:</strong> "Kollektivavtal", "Hemma varje kväll" och "Nya bilar" är de tre vanligaste sakerna förare letar efter.
      </div>
    </div>
  );
}

function Verifiering({ draft, setDraft }) {
  const fSkatt = Boolean(draft?.fSkattsedel);
  const kollektiv = Boolean(draft?.industryOrgMember);

  return (
    <div>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, marginBottom: 6, letterSpacing: -0.3, color: "var(--ink-900)" }}>Verifiering</h2>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginBottom: 24 }}>Era verifierade märken visas publikt. Hantera filer och status via Verifierings-sidan.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {[
          { label: "F-skattsedel", verified: fSkatt, sub: fSkatt ? "Intygas av er" : "Ej bekräftat ännu" },
          { label: "Trafiktillstånd", verified: false, sub: "Ladda upp dokument i verifieringsflödet" },
          { label: "Branschorganisation", verified: kollektiv, sub: draft?.industryOrgName || (kollektiv ? "Bekräftat" : "Ej bekräftat") },
          { label: "Bolagsverket", verified: false, sub: "Kräver organisationsnummer" },
        ].map((item, i) => (
          <div key={i} style={{ padding: "14px 16px", background: "var(--card)", border: `1px solid ${item.verified ? "rgba(31,122,58,0.2)" : "var(--line)"}`, borderRadius: 11, display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--sh-sm)" }}>
            <div style={{ width: 32, height: 32, borderRadius: 99, background: item.verified ? "var(--success-tint)" : "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {item.verified ? <span style={{ color: "var(--success)" }}><CheckIconMd /></span> : <ShieldIcon />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-900)" }}>{item.label}</div>
              <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)" }}>{item.sub}</div>
            </div>
            {item.verified && (
              <span style={{ padding: "3px 9px", borderRadius: 6, background: "var(--success-tint)", color: "var(--success)", fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 0.4 }}>VERIFIERAD</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 0", borderBottom: "1px solid var(--line)", cursor: "pointer" }}>
          <div onClick={() => setDraft((p) => ({ ...p, fSkattsedel: !p?.fSkattsedel }))}
            style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${fSkatt ? "var(--green)" : "var(--line-2)"}`, background: fSkatt ? "var(--green)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, cursor: "pointer" }}>
            {fSkatt && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--ink-900)", marginBottom: 2 }}>Vi innehar F-skattsedel</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", lineHeight: 1.5 }}>Intygar att ni betalar arbetsgivaravgifter och följer Skatteverkets regler.</div>
          </div>
        </label>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 0", borderBottom: "1px solid var(--line)", cursor: "pointer" }}>
          <div onClick={() => setDraft((p) => ({ ...p, industryOrgMember: !p?.industryOrgMember }))}
            style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${kollektiv ? "var(--green)" : "var(--line-2)"}`, background: kollektiv ? "var(--green)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, cursor: "pointer" }}>
            {kollektiv && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--ink-900)", marginBottom: 2 }}>Medlem i branschorganisation</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", lineHeight: 1.5 }}>T.ex. TYA eller annan branschorganisation.</div>
          </div>
        </label>
        {kollektiv && (
          <div style={{ marginLeft: 32, marginTop: 8 }}>
            <input style={inp} value={draft?.industryOrgName || ""} onChange={(e) => setDraft((p) => ({ ...p, industryOrgName: e.target.value }))} placeholder="t.ex. TYA" />
          </div>
        )}
        <label style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 0", cursor: "pointer" }}>
          <div onClick={() => setDraft((p) => ({ ...p, policyAgreedAt: p?.policyAgreedAt ? null : new Date().toISOString() }))}
            style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${draft?.policyAgreedAt ? "var(--green)" : "var(--line-2)"}`, background: draft?.policyAgreedAt ? "var(--green)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, cursor: "pointer" }}>
            {draft?.policyAgreedAt && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--ink-900)", marginBottom: 2 }}>Vi förbinder oss att följa STP:s uppförandekod</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", lineHeight: 1.5 }}>Intygar att ni inte diskriminerar, villfarar eller missbrukar plattformen.</div>
          </div>
        </label>
      </div>

      <Link to="/foretag/verifiering" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 99, background: "var(--green-tint)", border: "1px solid rgba(31,95,92,0.2)", color: "var(--green-text)", fontSize: "var(--text-xs)", fontWeight: 700, textDecoration: "none" }}>
        Hantera verifiering →
      </Link>
    </div>
  );
}

function TeamTab({ isOwner, invites, setInvites, toast }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [lastDevInviteLink, setLastDevInviteLink] = useState("");

  if (!isOwner) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-400)", fontSize: "var(--text-base)" }}>
        Endast ägaren kan hantera teammedlemmar.
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, marginBottom: 6, letterSpacing: -0.3, color: "var(--ink-900)" }}>Team</h2>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginBottom: 24 }}>Kollegor som har åtkomst till kontot. Visas inte publikt.</p>

      {invites.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Skickade inbjudningar</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {invites.map((inv) => (
              <div key={inv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 11, background: "var(--paper-2)", border: "1px solid var(--line)" }}>
                <div>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--ink-900)" }}>{inv.email}</span>
                  <span style={{ marginLeft: 10, fontSize: "var(--text-2xs)", color: inv.status === "ACCEPTED" ? "var(--success)" : "var(--ink-400)" }}>
                    {inv.status === "PENDING" ? "Väntar" : inv.status === "ACCEPTED" ? "Accepterad" : "Återkallad"}
                  </span>
                </div>
                {inv.status === "PENDING" && (
                  <button type="button"
                    onClick={async () => {
                      try { await revokeCompanyInvite(inv.id); setInvites(await listCompanyInvites()); }
                      catch (err) { setInviteError(err.message); }
                    }}
                    style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--danger)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    Återkalla
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 6, fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: 1 }}>Bjud in kollega</div>
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
        <div style={{ display: "flex", gap: 10 }}>
          <input style={{ ...inp, flex: 1 }} type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="kollega@foretag.se" disabled={inviteLoading} />
          <button type="submit" disabled={inviteLoading || !inviteEmail.trim()}
            style={{ padding: "11px 22px", borderRadius: 11, background: "var(--green)", color: "#fff", fontSize: "var(--text-sm)", fontWeight: 800, border: "none", cursor: inviteLoading || !inviteEmail.trim() ? "not-allowed" : "pointer", opacity: inviteLoading || !inviteEmail.trim() ? 0.5 : 1, whiteSpace: "nowrap", fontFamily: "inherit" }}>
            {inviteLoading ? "Skickar..." : "Bjud in"}
          </button>
        </div>
      </form>

      {inviteError && <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)", color: "var(--danger)", fontSize: "var(--text-sm)" }}>{inviteError}</div>}

      {lastDevInviteLink && (
        <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: 12, background: "var(--amber-tint)", border: "1px solid rgba(199,122,14,0.2)" }}>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--amber-text)", marginBottom: 8 }}>Länk att dela manuellt</div>
          <code style={{ display: "block", fontSize: "var(--text-2xs)", color: "var(--ink-700)", wordBreak: "break-all", lineHeight: 1.6 }}>{lastDevInviteLink}</code>
          <button type="button" onClick={() => navigator.clipboard.writeText(lastDevInviteLink).then(() => toast.success("Kopierad"), () => {})}
            style={{ marginTop: 8, fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--amber-text)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
            Kopiera länk
          </button>
        </div>
      )}

      {/* Lösenord + notiser under team */}
      <div style={{ marginTop: 32, paddingTop: 28, borderTop: "1px solid var(--line)" }}>
        <div style={{ fontSize: "var(--text-lg)", fontWeight: 800, letterSpacing: -0.3, marginBottom: 20, color: "var(--ink-900)" }}>Kontoinställningar</div>
        <PasswordSection />
      </div>
    </div>
  );
}

function PasswordSection() {
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNext, setShowPwNext] = useState(false);

  return (
    <div>
      <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: 14, color: "var(--ink-700)" }}>Ändra lösenord</div>
      <form onSubmit={async (e) => {
        e.preventDefault();
        setPwError(""); setPwSuccess("");
        if (pwForm.next.length < 8) { setPwError("Lösenordet måste vara minst 8 tecken."); return; }
        if (pwForm.next !== pwForm.confirm) { setPwError("Lösenorden matchar inte."); return; }
        setPwLoading(true);
        try {
          await changePassword(pwForm.current, pwForm.next);
          setPwSuccess("Lösenordet har uppdaterats.");
          setPwForm({ current: "", next: "", confirm: "" });
        } catch (err) {
          setPwError(err.message || "Kunde inte uppdatera lösenordet.");
        } finally {
          setPwLoading(false);
        }
      }} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400 }}>
        {pwError && <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)", color: "var(--danger)", fontSize: "var(--text-sm)" }}>{pwError}</div>}
        {pwSuccess && <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--success-tint)", border: "1px solid rgba(31,122,58,0.2)", color: "var(--success)", fontSize: "var(--text-sm)" }}>{pwSuccess}</div>}
        {[
          { id: "cp-current", label: "Nuvarande lösenord", key: "current", show: showPwCurrent, setShow: setShowPwCurrent },
          { id: "cp-next", label: "Nytt lösenord", key: "next", show: showPwNext, setShow: setShowPwNext },
          { id: "cp-confirm", label: "Bekräfta nytt lösenord", key: "confirm", show: showPwNext, setShow: null },
        ].map(({ id, label, key, show, setShow }) => (
          <div key={id}>
            <label htmlFor={id} style={lbl}>{label}</label>
            <div style={{ position: "relative" }}>
              <input id={id} type={show ? "text" : "password"} value={pwForm[key]} onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))} required style={{ ...inp, paddingRight: setShow ? 44 : 14 }} />
              {setShow && (
                <button type="button" onClick={() => setShow((v) => !v)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--ink-400)", display: "flex" }}>
                  {show ? <EyeOffIcon style={{ width: 18, height: 18 }} /> : <EyeIcon style={{ width: 18, height: 18 }} />}
                </button>
              )}
            </div>
          </div>
        ))}
        <button type="submit" disabled={pwLoading}
          style={{ alignSelf: "flex-start", padding: "11px 24px", borderRadius: 11, background: pwLoading ? "var(--paper-2)" : "var(--green)", color: pwLoading ? "var(--ink-300)" : "#fff", fontSize: "var(--text-sm)", fontWeight: 800, border: "none", cursor: pwLoading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
          {pwLoading ? "Sparar…" : "Spara nytt lösenord"}
        </button>
      </form>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "basic", label: "Grundinfo" },
  { id: "about", label: "Om oss" },
  { id: "team", label: "Team" },
  // "benefits" tab disabled — no backend field yet
  // "verification" tab disabled — waiting for Skatteverket/Transportstyrelsen APIs
];

export default function CompanyProfile() {
  const isMobile = useIsMobile();
  const { hasApi, user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState("basic");
  const tabTitles = { basic: "Företagsprofil", about: "Om oss", team: "Team" };
  usePageTitle(tabTitles[tab] || "Företagsprofil");
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isOwner = !user?.companyOwnerId;

  const [invites, setInvites] = useState([]);

  const [notifSettings, setNotifSettings] = useState(null);
  const [notifSaving, setNotifSaving] = useState(false);

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

  if (loading) return <main style={{ background: "var(--paper)", minHeight: "100vh" }}><div style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: "60px 24px" }}><LoadingBlock message="Hämtar företagsprofil..." /></div></main>;

  if (!hasApi) return (
    <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <div style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: "60px 24px", textAlign: "center", color: "var(--ink-400)" }}>
        Företagsprofil kräver API-läge.
      </div>
    </main>
  );

  const SECTIONS = [
    { id: "basic", label: "Grundinfo", icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> },
    { id: "about", label: "Om oss",   icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
    { id: "team",  label: "Team",     icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ];

  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh", color: "var(--ink-900)" }}>
      {/* Floating save bar */}
      {changed && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: "var(--card)", borderTop: "1px solid var(--amber)", padding: isMobile ? "14px 20px 18px" : "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, boxShadow: "var(--sh-md)" }}>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--amber-text)", fontWeight: 600 }}>Osparade ändringar</span>
          <button type="button" onClick={save} disabled={saving}
            style={{ padding: "10px 22px", borderRadius: 99, background: saving ? "var(--paper-2)" : "var(--green)", color: saving ? "var(--ink-300)" : "#fff", fontSize: "var(--text-sm)", fontWeight: 800, border: "none", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {saving ? "Sparar..." : "Spara ändringar"}
          </button>
        </div>
      )}

      {/* Page header */}
      <div style={{ background: "var(--paper)", borderBottom: "1px solid var(--line)", paddingTop: 32, paddingBottom: 24 }}>
        <div style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: "0 32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p style={{ fontSize: "var(--text-2xs)", fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 10 }}>För åkerier</p>
            <h1 style={{ fontSize: "var(--text-5xl)", fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1.2, lineHeight: 1.15 }}>Företagsprofil</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link to={`/foretag/${user?.companyOwnerId || user?.id}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontSize: "var(--text-sm)", fontWeight: 600, textDecoration: "none", boxShadow: "var(--sh-sm)" }}>
              <EyeExtIcon /> Förhandsgranska
            </Link>
            <button type="button" onClick={save} disabled={saving || !changed}
              style={{ padding: "9px 18px", borderRadius: 10, background: changed ? "var(--green)" : "var(--paper-2)", border: changed ? "none" : "1px solid var(--line)", color: changed ? "#fff" : "var(--ink-300)", fontSize: "var(--text-sm)", fontWeight: 700, cursor: changed ? "pointer" : "not-allowed", fontFamily: "inherit", boxShadow: changed ? "var(--sh-sm)" : "none" }}>
              {saving ? "Sparar..." : "Spara ändringar"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "var(--w-read)", margin: "0 auto", padding: isMobile ? "20px 20px 100px" : "28px 32px 80px" }}>
        {/* Varning */}
        {draft && (!Array.isArray(draft.companyBransch) || draft.companyBransch.length === 0 || !draft.companyRegion) && (
          <div style={{ marginBottom: 20, padding: "14px 18px", borderRadius: 14, background: "var(--amber-tint)", border: "1px solid rgba(199,122,14,0.25)", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <div>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--amber-text)", marginBottom: 3 }}>Syns inte i Hitta åkerier ännu</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-700)", lineHeight: 1.5 }}>Fyll i <strong>bransch</strong> och <strong>region</strong> så att förare kan hitta er.</div>
            </div>
          </div>
        )}

        {/* Mobile tabs */}
        {isMobile && (
          <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid var(--line)", overflowX: "auto" }}>
            {SECTIONS.map((s) => {
              const active = tab === s.id;
              return (
                <button key={s.id} onClick={() => setTab(s.id)}
                  style={{ padding: "10px 14px 12px", background: "none", border: "none", color: active ? "var(--ink-900)" : "var(--ink-400)", fontSize: "var(--text-sm)", fontWeight: active ? 700 : 500, cursor: "pointer", position: "relative", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                  {s.label}
                  {active && <span style={{ position: "absolute", left: 14, right: 14, bottom: -1, height: 3, background: "var(--green)", borderRadius: "3px 3px 0 0" }}/>}
                </button>
              );
            })}
          </div>
        )}

        <div className={isMobile ? "" : "cp-grid"}>
          {/* Section nav (desktop) */}
          {!isMobile && (
            <nav style={{ display: "flex", flexDirection: "column", gap: 4, position: "sticky", top: 28 }}>
              {SECTIONS.map((s) => {
                const active = tab === s.id;
                return (
                  <button key={s.id} onClick={() => setTab(s.id)} style={{
                    display: "inline-flex", alignItems: "center", gap: 11, padding: "11px 14px", borderRadius: 10, textAlign: "left",
                    background: active ? "var(--green-tint)" : "transparent",
                    color: active ? "var(--green-text)" : "var(--ink-700)",
                    fontSize: "var(--text-base)", fontWeight: active ? 700 : 500, whiteSpace: "nowrap",
                    border: "none", cursor: "pointer", fontFamily: "inherit",
                  }}>
                    <span style={{ color: active ? "var(--green-text)" : "var(--ink-500)", display: "inline-flex", flexShrink: 0 }}>{s.icon}</span>
                    {s.label}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Content */}
          <div className="stp-fade-up" key={tab}>
            {tab === "basic" && (
              <>
                <GrundInfo draft={draft} setDraft={setDraft} isMobile={isMobile} />
                <div style={{ marginTop: 24, padding: "20px 22px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14 }}>
                  <div style={{ fontSize: "var(--text-base)", fontWeight: 800, letterSpacing: -0.3, marginBottom: 4, color: "var(--ink-900)" }}>E-postnotiser</div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)", marginBottom: 16 }}>Välj vilka påminnelser ni vill få via e-post.</div>
                  {[
                    { key: "profileReminder", label: "Profilpåminnelser", desc: "Påminnelse när er företagsprofil inte är komplett." },
                    { key: "jobMatch", label: "Förarrekommendationer", desc: "När nya förare matchar era krav publiceras." },
                    { key: "messageReminder", label: "Obesvarade meddelanden", desc: "Påminnelse när ett meddelande väntar på svar." },
                    { key: "inactivity", label: "Inaktivitetspåminnelse", desc: "Om ni inte loggat in på 30 dagar." },
                  ].map(({ key, label, desc }, i) => {
                    const enabled = notifSettings ? notifSettings[key] !== false : true;
                    return (
                      <div key={key} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "13px 0", borderTop: i === 0 ? "none" : "1px solid var(--line)", gap: 20 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--ink-900)" }}>{label}</div>
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", marginTop: 2 }}>{desc}</div>
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
                </div>
              </>
            )}
            {tab === "about" && <OmOss draft={draft} setDraft={setDraft} />}
            {tab === "team" && <TeamTab isOwner={isOwner} invites={invites} setInvites={setInvites} toast={toast} />}
          </div>
        </div>
      </div>
    </main>
  );
}
