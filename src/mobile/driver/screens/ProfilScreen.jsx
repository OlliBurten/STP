// Driver — Profil. Ported from STP Mobil Förare ProfilScreen, wired to the real
// profile. Deviations from the mock (flagged for review):
//   • Profile-view stats and driver reviews have no backend → those sections are
//     omitted rather than faked.
//   • "Dokument & intyg" lists the driver's real certificates (no expiry/renewal
//     vault yet) — so no status dots / "Förnya".
//   • "Verifierat av STP" is informational copy (kept as in the prototype).
import React, { useState } from "react";
import { Header, ScrollArea, Card, Pill, Dot, Stars, Label, Avatar, Button, Icon } from "../../ui";
import { PRO_LIC, ownedLicenses, highestLic, expPeriod } from "../licenseUtils";

const DOC_TONE = { verified: "success", expiring: "amber", expired: "danger", listed: "muted" };

export default function ProfilScreen({ ctx }) {
  const [sy, setSy] = useState(0);
  const p = ctx.profile;
  const pct = ctx.completion.pct;
  const experience = Array.isArray(p.experience) ? p.experience : [];
  const documents = ctx.documents;
  const stats = ctx.stats;
  const reviews = Array.isArray(ctx.reviews) ? ctx.reviews : [];
  const urgentDocs = documents.filter((d) => d.status === "expired" || d.status === "expiring").length;

  return (
    <>
      <Header title="Profil" scrollY={sy}
        right={<button onClick={() => ctx.setSheet({ type: "settings" })} className="press" style={{ width: 38, height: 38, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="settings" size={20} color="var(--ink-700)" stroke={1.9} /></button>} />
      <ScrollArea onScroll={(e) => setSy(e.target.scrollTop)}>
        <div style={{ padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* hero */}
          <div style={{ textAlign: "center", padding: "4px 0 4px" }}>
            <button onClick={() => ctx.setSheet({ type: "photo" })} className="press" style={{ position: "relative", width: 92, margin: "0 auto 16px", display: "block" }} aria-label="Byt profilbild">
              <Avatar initials={p.initials || (p.name || "?").slice(0, 1).toUpperCase()} src={p.photoUrl} size={84} ring={ctx.seeking} style={{ margin: "0 auto" }} />
              <span style={{ position: "absolute", right: 2, bottom: ctx.seeking ? 8 : 0, width: 26, height: 26, borderRadius: 13, background: "var(--card)", border: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--sh-sm)" }}><Icon name="edit" size={13} color="var(--ink-600)" stroke={2} /></span>
              {ctx.seeking && <span style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)", background: "var(--success)", color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: 0.3, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap", border: "2px solid var(--paper)" }}>SÖKER JOBB</span>}
            </button>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.5, marginBottom: 4 }}>{p.name || "Din profil"}</h1>
            <div style={{ fontSize: 14, color: "var(--ink-500)", marginBottom: ctx.rating ? 8 : 14 }}>{[p.location, p.region].filter(Boolean).join(", ")}{ctx.expYears ? ` · ${ctx.expYears} års erfarenhet` : ""}</div>
            {ctx.rating != null && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                <Stars rating={ctx.rating} size={14} />
                <span style={{ fontSize: 13, color: "var(--ink-500)" }}><b style={{ color: "var(--ink-800)" }}>{ctx.rating.toFixed(1)}</b> · {reviews.length} omdömen</span>
              </div>
            )}
            <div>
              <Button variant="secondary" size="md" icon={<Icon name="edit" size={15} stroke={2} />} onClick={() => ctx.setSheet({ type: "editProfile" })}>Redigera profil</Button>
            </div>
          </div>

          {/* completion */}
          {pct < 100 && (
            <Card onClick={() => ctx.setSheet({ type: "complete" })} className="press" style={{ padding: "15px 16px", background: "var(--amber-tint)", border: "1px solid var(--amber-tint-2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "var(--amber-text)", whiteSpace: "nowrap" }}>Profil {pct}% klar</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--amber-deep)", whiteSpace: "nowrap" }}>{ctx.completion.missing.length} steg kvar →</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: "rgba(199,122,14,0.18)", overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: "var(--amber)", borderRadius: 4 }} /></div>
            </Card>
          )}

          {/* stats */}
          {stats && (
            <Card style={{ padding: "16px", display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
              {[["Visningar 30d", stats.views30], ["Visningar 7d", stats.views7], ["Kontaktade dig", stats.contacted]].map(([l, v], i) => (
                <div key={l} style={{ textAlign: "center", borderRight: i < 2 ? "1px solid var(--line)" : "none" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "var(--green)", fontFamily: "var(--mono)" }}>{v ?? 0}</div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-500)", fontWeight: 600, marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </Card>
          )}

          {/* körkort */}
          <Card style={{ padding: "16px" }}>
            <Label style={{ marginBottom: 5 }}>Körkort</Label>
            <p style={{ fontSize: 12.5, color: "var(--ink-400)", marginBottom: 13, lineHeight: 1.4 }}>Behörigheterna du har. Avgör vilka jobb du matchar mot.</p>
            <div style={{ display: "flex", gap: 7 }}>
              {PRO_LIC.map((l) => {
                const owned = ownedLicenses(p.licenses).has(l);
                const top = highestLic(p.licenses) === l;
                return <div key={l} style={{ flex: 1, height: 46, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: owned ? (top ? "var(--green)" : "var(--green-tint)") : "transparent", border: owned ? (top ? "1px solid var(--green-deep)" : "1px solid var(--green)") : "1px dashed var(--line-2)", color: owned ? (top ? "#fff" : "var(--green-text)") : "var(--ink-300)", fontWeight: 800, fontSize: 14 }}>{l}</div>;
              })}
            </div>
          </Card>

          {/* dokument & intyg (real certificates + expiry status) */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 4px 10px" }}>
              <Label>Dokument & intyg</Label>
              {urgentDocs > 0 && <Pill tone="amber" size="sm" icon={<Dot tone="amber" size={5} />}>{urgentDocs} behöver åtgärd</Pill>}
            </div>
            {documents.length > 0 ? (
              <Card style={{ padding: "4px 16px" }}>
                {documents.map((d, i) => {
                  const urgent = d.status === "expired" || d.status === "expiring";
                  return (
                    <button key={d.id} onClick={() => ctx.setSheet(urgent ? { type: "renew", doc: d } : { type: "docDetail", doc: d })} className="press" style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: i < documents.length - 1 ? "1px solid var(--line)" : "none", textAlign: "left" }}>
                      <div style={{ width: 42, height: 42, borderRadius: 11, background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="file" size={19} color="var(--ink-500)" stroke={1.8} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>{d.name}</span><Dot tone={DOC_TONE[d.status] || "muted"} size={6} /></div>
                        <div style={{ fontSize: 12.5, color: d.status === "expired" ? "var(--danger)" : d.status === "expiring" ? "var(--amber-deep)" : "var(--ink-500)", marginTop: 1, fontWeight: d.status === "verified" || d.status === "listed" ? 400 : 600 }}>{d.expiry}</div>
                      </div>
                      {urgent ? <Pill tone="amber" size="sm">Förnya</Pill> : <Icon name="chevRight" size={18} color="var(--ink-300)" stroke={2.2} />}
                    </button>
                  );
                })}
              </Card>
            ) : (
              <Card style={{ padding: "18px 16px", textAlign: "center", fontSize: 13.5, color: "var(--ink-500)" }}>Inga intyg tillagda än.</Card>
            )}
            <button onClick={() => ctx.setSheet({ type: "addDoc" })} className="press" style={{ marginTop: 10, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", fontSize: 14, fontWeight: 700, color: "var(--green)", background: "var(--card)", border: "1px dashed var(--line-2)", borderRadius: 13 }}><Icon name="plus" size={17} stroke={2.2} />Lägg till dokument</button>
          </div>

          {/* dela CV */}
          <Card style={{ padding: "18px", background: "linear-gradient(135deg,var(--green),var(--green-deep))", border: "none", color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}><Icon name="award" size={19} color="#fff" stroke={2} /><span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", opacity: 0.8 }}>Din STP-profil</span></div>
            <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, marginBottom: 6 }}>Ditt CV – alltid uppdaterat</h2>
            <p style={{ fontSize: 13.5, lineHeight: 1.5, opacity: 0.85, marginBottom: 15 }}>Dela din verifierade profil med vilket åkeri som helst – även utanför STP.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => ctx.setSheet({ type: "share" })} className="press" style={{ flex: 1, height: 46, borderRadius: 12, background: "#fff", color: "var(--green-deep)", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Icon name="share" size={17} stroke={2.2} />Dela profil</button>
              <button onClick={() => ctx.setSheet({ type: "share" })} className="press" style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="download" size={19} color="#fff" stroke={2.2} /></button>
            </div>
          </Card>

          {/* AI brev */}
          <Card onClick={() => ctx.setSheet({ type: "ai" })} className="press" style={{ padding: "16px", display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--amber-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="spark" size={22} color="var(--amber-deep)" stroke={0} style={{ fill: "var(--amber-deep)" }} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink-900)" }}>Personligt brev med AI</div><div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 1 }}>Skapas från din profil på sekunder</div></div>
            <Icon name="chevRight" size={18} color="var(--ink-300)" stroke={2.2} />
          </Card>

          {/* verifierat av STP */}
          <Card style={{ padding: "16px" }}>
            <Label style={{ marginBottom: 4 }}>Verifierat av STP</Label>
            <p style={{ fontSize: 12.5, color: "var(--ink-400)", marginBottom: 13, lineHeight: 1.4 }}>Vad STP själva intygar för åkerier.</p>
            {[
              { ok: true, label: "Körkort granskat", sub: "Av STP · BankID-kontroll snart" },
              { ok: false, label: "Identitet med BankID", sub: "Kommer snart" },
              { ok: true, label: "Tidigare arbetsgivare", sub: "Referenser kan kontaktas" },
            ].map((r, i, arr) => (
              <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none" }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: r.ok ? "var(--success-tint)" : "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={r.ok ? "check" : "clock"} size={15} color={r.ok ? "var(--success)" : "var(--ink-400)"} stroke={2.4} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)" }}>{r.label}</div>
                  <div style={{ fontSize: 12.5, color: r.ok ? "var(--success)" : "var(--ink-400)", marginTop: 1 }}>{r.sub}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 13, padding: "11px 13px", background: "var(--green-tint)", borderRadius: 11, fontSize: 12.5, color: "var(--green-text)", lineHeight: 1.45 }}>Verifierade profiler får fler svar från åkerier.</div>
          </Card>

          {/* experience */}
          <Card style={{ padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 11 }}>
              <Label>Erfarenhet</Label>
              <button onClick={() => ctx.setSheet({ type: "editProfile", focus: "exp" })} className="press" style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>Redigera</button>
            </div>
            {experience.length === 0 ? (
              <p style={{ fontSize: 13.5, color: "var(--ink-400)", padding: "4px 0" }}>Ingen erfarenhet tillagd än.</p>
            ) : (
              experience.map((e, i) => (
                <div key={e.id || i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < experience.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="building" size={18} color="var(--ink-500)" stroke={1.8} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>{e.role || e.title || "Roll"}</div>
                    <div style={{ fontSize: 13, color: "var(--ink-700)", marginTop: 1 }}>{e.company || ""}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 2 }}>{expPeriod(e)}</div>
                  </div>
                </div>
              ))
            )}
          </Card>

          {/* omdömen från åkerier */}
          {reviews.length > 0 && (
            <Card style={{ padding: "16px" }}>
              <Label style={{ marginBottom: 11 }}>Omdömen från åkerier</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {reviews.map((r, i) => (
                  <div key={r.id || i} style={{ paddingBottom: i < reviews.length - 1 ? 11 : 0, borderBottom: i < reviews.length - 1 ? "1px solid var(--line)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <Stars rating={r.rating} size={13} />
                      <span style={{ fontSize: 12.5, color: "var(--ink-400)", fontWeight: 600 }}>{r.companyName || r.author || "Åkeri"}</span>
                    </div>
                    {r.comment && <p style={{ fontSize: 14, color: "var(--ink-800)", lineHeight: 1.5 }}>“{r.comment}”</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <button onClick={() => ctx.setSheet({ type: "settings" })} className="press" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", fontSize: 14.5, fontWeight: 700, color: "var(--ink-700)", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "var(--sh-sm)" }}><Icon name="settings" size={17} stroke={1.9} />Inställningar</button>
        </div>
      </ScrollArea>
    </>
  );
}
