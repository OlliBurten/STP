// Company — account / company sheets (Mer stack). Ported from STP Mobil Åkeri.
// Wired to the real company APIs where they exist; billing/plan + verification
// status are informational (admin-driven / no billing backend) — flagged.
import React, { useState, useEffect } from "react";
import { Icon, Label, Field, Button, Pill, Avatar, Switch, Stars, SheetBack } from "../../ui";
import { SegPill } from "../ui";
import { setActiveOrgId } from "../../../api/client";
import { getCompanyReviewSummary } from "../../../api/reviews";
import { updateCompanyNotificationSettings } from "../../../api/companies";

const Row = ({ label, sub, right, onClick, danger, last }) => {
  const inner = (<>
    <div><div style={{ fontSize: 14.5, fontWeight: 600, color: danger ? "var(--danger)" : "var(--ink-900)" }}>{label}</div>{sub && <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 1 }}>{sub}</div>}</div>
    {right || (!danger && onClick && <Icon name="chevRight" size={18} color="var(--ink-300)" stroke={2.2} />)}
  </>);
  const style = { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: last ? "none" : "1px solid var(--line)", textAlign: "left" };
  // Toggle rows (Switch in `right`, no row onClick) must not be a <button> — a
  // nested <button> is invalid HTML. Render a <div> there instead.
  return onClick
    ? <button onClick={onClick} className="press" style={style}>{inner}</button>
    : <div style={style}>{inner}</div>;
};

/* ── Edit company profile → ctx.updateCompany ── */
export function EditCompanySheet({ ctx, close }) {
  const c = ctx.company;
  const [name, setName] = useState(c.name || "");
  const [city, setCity] = useState(c.city || "");
  const [website, setWebsite] = useState(c.website || "");
  const [about, setAbout] = useState(c.about || "");
  const [cpName, setCpName] = useState(c.contact?.name || "");
  const [cpRole, setCpRole] = useState(c.contact?.role || "");
  const [cpPhone, setCpPhone] = useState(c.contact?.phone || "");
  const save = () => { ctx.updateCompany({ name, location: city, website, description: about, contact: { ...(c.contact || {}), name: cpName, role: cpRole, phone: cpPhone } }); close(); };
  return (
    <div style={{ padding: "4px 22px 26px" }}>
      <Field label="Företagsnamn" value={name} onChange={setName} />
      <Field label="Ort" value={city} onChange={setCity} />
      <Field label="Webbplats" value={website} onChange={setWebsite} placeholder="https://" />
      <Label style={{ marginBottom: 8 }}>Företagsbeskrivning</Label>
      <textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={5} placeholder="Berätta om ert åkeri…" style={{ width: "100%", padding: "13px 15px", borderRadius: 13, border: "1px solid var(--line-2)", background: "#fff", fontSize: 15, color: "var(--ink-900)", outline: "none", resize: "none", lineHeight: 1.5, marginBottom: 22, fontFamily: "var(--font)" }} />
      <Label style={{ marginBottom: 10 }}>Kontaktperson</Label>
      <Field label="Namn" value={cpName} onChange={setCpName} />
      <Field label="Roll" value={cpRole} onChange={setCpRole} placeholder="t.ex. Trafikledare" />
      <Field label="Telefon" type="tel" inputMode="tel" value={cpPhone} onChange={setCpPhone} />
      <Button variant="primary" size="lg" full onClick={save}>Spara ändringar</Button>
    </div>
  );
}
export const CompleteProfileSheet = EditCompanySheet;

/* ── Settings ── */
export function SettingsSheet({ ctx, close }) {
  const [notif, setNotif] = useState({ applications: true, messages: true, weekly: true });
  const toggle = (k) => setNotif((n) => { const next = { ...n, [k]: !n[k] }; if (ctx.hasApi) updateCompanyNotificationSettings(next).catch(() => {}); return next; });
  return (
    <div style={{ padding: "0 22px 26px" }}>
      <Label style={{ margin: "0 0 2px" }}>Notiser</Label>
      <Row label="Nya ansökningar" right={<Switch on={notif.applications} onToggle={() => toggle("applications")} />} />
      <Row label="Nya meddelanden" right={<Switch on={notif.messages} onToggle={() => toggle("messages")} />} />
      <Row label="Veckosammanfattning" right={<Switch on={notif.weekly} onToggle={() => toggle("weekly")} />} last />
      <Label style={{ margin: "20px 0 2px" }}>Konto</Label>
      <Row label="Företagsprofil" onClick={() => ctx.setSheet({ type: "editCompany" })} />
      {/* Abonnemang/billing dolt tills vidare — ej redo att fakturera åkerier. */}
      <Row label="Team & roller" onClick={() => ctx.setSheet({ type: "team" })} last />
      <div style={{ marginTop: 20 }}><Row label="Logga ut" danger last onClick={() => ctx.setSheet({ type: "logout" })} /></div>
      {ctx.user?.email && <p style={{ textAlign: "center", fontSize: 11.5, color: "var(--ink-400)", marginTop: 18 }}>Inloggad som {ctx.user.email}</p>}
    </div>
  );
}

/* ── Team (members + invites) ── */
export function TeamSheet({ ctx, close }) {
  const members = ctx.company.members || [];
  const invites = ctx.invites || [];
  return (
    <div style={{ padding: "4px 22px 26px" }}>
      <p style={{ fontSize: 13.5, color: "var(--ink-500)", lineHeight: 1.5, marginBottom: 16 }}>Personer med tillgång till {ctx.company.name}. <b style={{ color: "var(--ink-800)" }}>Admin</b> kan publicera, hantera team och betalning. <b style={{ color: "var(--ink-800)" }}>Rekryterare</b> hanterar annonser och kandidater.</p>
      <Label style={{ marginBottom: 11 }}>Medlemmar</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
        {members.length === 0 && <p style={{ fontSize: 13.5, color: "var(--ink-400)" }}>Bara du för tillfället.</p>}
        {members.map((m) => (
          <div key={m.id || m.email} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 13 }}>
            <Avatar initials={m.initials || (m.name || m.email || "?").slice(0, 2).toUpperCase()} size={40} color="var(--green)" />
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>{m.name || m.email}</div><div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{m.role || "Medlem"}</div></div>
            {m.status === "pending" && <Pill tone="amber" size="sm">Inbjuden</Pill>}
          </div>
        ))}
        {invites.map((i) => (
          <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 13 }}>
            <Avatar initials={(i.email || "?").slice(0, 2).toUpperCase()} size={40} color="var(--ink-400)" />
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, color: "var(--ink-700)" }}>{i.email}</div></div>
            <button onClick={() => ctx.revokeInvite(i.id).then(ctx.refresh)} className="press" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--danger)" }}>Ta bort</button>
          </div>
        ))}
      </div>
      <Button variant="secondary" size="lg" full icon={<Icon name="plus" size={17} stroke={2.4} />} onClick={() => ctx.setSheet({ type: "invite" })}>Bjud in kollega</Button>
    </div>
  );
}

export function InviteSheet({ ctx, close }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async () => { setBusy(true); try { await ctx.createInvite(email.trim()); ctx.refresh(); setSent(true); } catch { /* */ } finally { setBusy(false); } };
  if (sent) return (
    <div style={{ padding: "20px 24px 30px", textAlign: "center" }}>
      <div style={{ width: 74, height: 74, borderRadius: 24, background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><Icon name="mail" size={34} color="var(--success)" stroke={2.2} /></div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink-900)", marginBottom: 8 }}>Inbjudan skickad</h2>
      <p style={{ fontSize: 14, color: "var(--ink-500)", marginBottom: 20 }}>{email} får en länk för att gå med i ert team.</p>
      <Button variant="primary" size="lg" full onClick={close}>Klar</Button>
    </div>
  );
  return (
    <div style={{ padding: "4px 22px 26px" }}>
      <SheetBack label="Team" onBack={() => ctx.setSheet({ type: "team" })} />
      <Field label="E-postadress" type="email" value={email} onChange={setEmail} placeholder="kollega@åkeri.se" />
      <Button variant="primary" size="lg" full busy={busy} disabled={!/\S+@\S+\.\S+/.test(email)} onClick={submit}>Skicka inbjudan</Button>
    </div>
  );
}

/* ── Reviews ── */
export function ReviewsSheet({ ctx }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    const id = ctx.orgs?.[0]?.id || ctx.user?.id;
    if (ctx.hasApi && id) getCompanyReviewSummary(id).then(setData).catch(() => setData({ reviews: [] }));
    else setData({ reviews: [] });
  }, []);
  const reviews = data?.reviews || [];
  return (
    <div style={{ padding: "4px 22px 26px" }}>
      {ctx.company.rating != null && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ fontSize: 38, fontWeight: 800, color: "var(--ink-900)", fontFamily: "var(--mono)" }}>{Number(ctx.company.rating).toFixed(1)}</div>
          <div><Stars rating={ctx.company.rating} size={16} /><div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 2 }}>Baserat på {ctx.company.reviewCount} omdömen från förare som arbetat hos er.</div></div>
        </div>
      )}
      {reviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--ink-500)", fontSize: 14 }}>Inga omdömen än. Förare kan lämna omdöme efter kontakt.</div>
      ) : reviews.map((r, i) => (
        <div key={i} style={{ padding: "14px 15px", background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 13, marginBottom: 11 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}><Stars rating={r.rating} size={13} /><span style={{ fontSize: 12, color: "var(--ink-400)" }}>{r.when || ""}</span></div>
          {r.comment && <p style={{ fontSize: 14, color: "var(--ink-800)", lineHeight: 1.5 }}>“{r.comment}”</p>}
        </div>
      ))}
    </div>
  );
}

/* ── Plan / abonnemang (informational — no billing backend) ── */
export function PlanSheet({ ctx, close }) {
  return (
    <div style={{ padding: "4px 22px 26px" }}>
      <div style={{ padding: "18px", background: "linear-gradient(135deg,var(--green),var(--green-deep))", borderRadius: 18, color: "#fff", marginBottom: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", opacity: 0.8 }}>Nuvarande plan</div>
        <div style={{ fontSize: 28, fontWeight: 800, margin: "4px 0 2px" }}>{ctx.company.plan}</div>
        <div style={{ fontSize: 13.5, opacity: 0.85 }}>Publicera annonser och kontakta förare utan provision.</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {["Obegränsade annonser", "Sök bland verifierade förare", "Direktkontakt utan provision", "Team-konton"].map((f) => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}><Icon name="check" size={16} color="var(--success)" stroke={2.6} /><span style={{ fontSize: 14.5, color: "var(--ink-800)" }}>{f}</span></div>
        ))}
      </div>
      <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--ink-400)", marginTop: 20 }}>Kontakta oss för att ändra plan.</p>
    </div>
  );
}

/* ── Verification (admin-driven) ── */
export function VerificationSheet({ ctx, close }) {
  const verified = ctx.verified;
  return (
    <div style={{ padding: "4px 22px 26px" }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: verified ? "var(--success-tint)" : "var(--amber-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}><Icon name="shield" size={26} color={verified ? "var(--success)" : "var(--amber-deep)"} stroke={2} /></div>
      <h2 style={{ fontSize: 21, fontWeight: 800, color: "var(--ink-900)", marginBottom: 8 }}>{verified ? "Ni är verifierade" : "Verifiera ert åkeri"}</h2>
      <p style={{ fontSize: 14.5, color: "var(--ink-600)", lineHeight: 1.55, marginBottom: 16 }}>{verified ? "Er profil visar en grön Verifierad av STP-stämpel. Förare litar på verifierade åkerier." : "Vi kontrollerar ert organisationsnummer mot Bolagsverket (F-skatt + trafiktillstånd). Det krävs för att publicera annonser."}</p>
      {!verified && <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "13px 14px", background: "var(--success-tint)", borderRadius: 12, marginBottom: 16 }}><Icon name="check" size={17} color="var(--success)" stroke={2.4} style={{ flexShrink: 0, marginTop: 1 }} /><span style={{ fontSize: 13, color: "var(--green-text)", lineHeight: 1.45 }}>Verifierade åkerier får en <b>Verifierad av STP</b>-stämpel som förare litar på – fler vågar söka era jobb.</span></div>}
      {!verified && <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", background: "var(--info-tint)", borderRadius: 12, marginBottom: 18 }}><Icon name="info" size={17} color="var(--info)" stroke={2} style={{ flexShrink: 0 }} /><span style={{ fontSize: 13, color: "var(--ink-700)", lineHeight: 1.45 }}>Org.nr {ctx.company.orgnr || "—"} granskas av STP. Ni får en notis när det är klart.</span></div>}
      <Button variant="primary" size="lg" full onClick={close}>{verified ? "Stäng" : "Jag förstår"}</Button>
    </div>
  );
}

/* ── Public profile preview ── */
export function PublicProfileSheet({ ctx, close }) {
  const c = ctx.company;
  return (
    <div style={{ padding: "4px 0 26px" }}>
      <div style={{ padding: "0 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <Avatar initials={c.initials} size={64} color="var(--green-deep)" />
          <div><div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 19, fontWeight: 800, color: "var(--ink-900)" }}>{c.name}</span>{c.verified && <Icon name="check" size={15} color="#fff" stroke={3} style={{ background: "var(--success)", borderRadius: 8, padding: 2 }} />}</div><div style={{ fontSize: 13.5, color: "var(--ink-500)", marginTop: 2 }}>{c.industry}{c.city ? ` · ${c.city}` : ""}</div></div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>{c.segments.map((s) => <SegPill key={s} seg={s} />)}</div>
        {c.about && <><Label style={{ marginBottom: 8 }}>Om oss</Label><p style={{ fontSize: 14.5, color: "var(--ink-700)", lineHeight: 1.55, marginBottom: 18 }}>{c.about}</p></>}
        {c.perks.length > 0 && <><Label style={{ marginBottom: 10 }}>Vi erbjuder</Label><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{c.perks.map((p) => <Pill key={p} tone="soft">{p}</Pill>)}</div></>}
        {!c.about && c.perks.length === 0 && <p style={{ fontSize: 13.5, color: "var(--ink-400)", textAlign: "center", padding: "20px 0" }}>Komplettera profilen så ser förare mer om er.</p>}
      </div>
    </div>
  );
}

/* ── Org switcher ── */
export function OrgSwitcherSheet({ ctx, close }) {
  const orgs = ctx.orgs || [];
  const switchTo = (id) => { try { setActiveOrgId(id); } catch { /* */ } window.location.reload(); };
  return (
    <div style={{ padding: "4px 22px 26px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 14, marginBottom: 18 }}>
        <Avatar initials={(ctx.user?.name || ctx.company.name || "?").slice(0, 2).toUpperCase()} size={42} color="var(--ink-400)" />
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ctx.user?.name || ctx.company.name}</div>{ctx.user?.email && <div style={{ fontSize: 12.5, color: "var(--ink-500)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ctx.user.email}</div>}</div>
      </div>
      <Label style={{ marginBottom: 10 }}>Dina åkerier</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {orgs.length === 0 && <p style={{ fontSize: 13.5, color: "var(--ink-400)" }}>{ctx.company.name}</p>}
        {orgs.map((o) => {
          const active = o.name === ctx.company.name;
          return (
            <button key={o.id} onClick={() => switchTo(o.id)} className="press" style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", background: "var(--card-2)", border: `1px solid ${active ? "var(--green)" : "var(--line)"}`, borderRadius: 13, textAlign: "left" }}>
              <Avatar initials={(o.name || "?").slice(0, 2).toUpperCase()} size={42} color="var(--green-deep)" />
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-900)" }}>{o.name}</span>{o.verified && <Icon name="check" size={13} color="#fff" stroke={3} style={{ background: "var(--success)", borderRadius: 7, padding: 1.5 }} />}</div><div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{[o.role || o.myRole || "Medlem", o.city].filter(Boolean).join(" · ")}</div></div>
              {active ? <Icon name="check" size={18} color="var(--green)" stroke={2.6} /> : <Icon name="chevRight" size={18} color="var(--ink-300)" stroke={2.2} />}
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 12.5, color: "var(--ink-400)", lineHeight: 1.5, textAlign: "center" }}>Hanterar du flera åkerier? Lägg till dem och växla när som helst – ett konto, alla bolag.</p>
    </div>
  );
}

/* ── Notiser ── */
export function NotiserSheet({ ctx }) {
  return (
    <div style={{ padding: "10px 22px 30px", textAlign: "center" }}>
      <div style={{ width: 60, height: 60, borderRadius: 18, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><Icon name="bell" size={26} color="var(--green)" stroke={1.9} /></div>
      <p style={{ fontSize: 14, color: "var(--ink-500)", lineHeight: 1.5 }}>Ansökningar och meddelanden visas på Översikt och i Inkorgen. Du får en notis när något händer.</p>
    </div>
  );
}

export function SupportSheet({ close }) {
  return (
    <div style={{ padding: "4px 22px 26px" }}>
      <a href="mailto:hello@transportplattformen.se" className="press" style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px", background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 14, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="mail" size={20} color="var(--green)" stroke={1.9} /></div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink-900)" }}>Mejla support</div><div style={{ fontSize: 13, color: "var(--ink-500)" }}>hello@transportplattformen.se</div></div>
        <Icon name="chevRight" size={18} color="var(--ink-300)" stroke={2.2} />
      </a>
      <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--ink-400)", marginTop: 8 }}>Vi svarar oftast inom ett dygn, vardagar.</p>
    </div>
  );
}

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
