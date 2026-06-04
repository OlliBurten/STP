/* ════════════════════════════════════════════════════════════
   PROOF-SKÄRM — Åkeri Inkorg, portad från
   "STP (4)/STP Åkeri Inkorg Ljust.html". Full-höjd två-panels-vy.
   Route: /preview/akeri/inkorg
════════════════════════════════════════════════════════════ */
import { useState, useRef, useEffect } from "react";
import { TopNav, PageShell, Pill, Button, Icon, Avatar } from "../../../components/ui";
import { AKERI_NAV, COMPANY, matchColor } from "./data.js";

const NOW = Date.now();
const minAgo = (n) => NOW - n * 60000;
const clock = (ts) => new Date(ts).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });

const CONVERSATIONS = [
  { id: 0, driver: { name: "Erik Johansson", initials: "EJ", loc: "Malmö", exp: 8 }, job: "CE-chaufför fjärrkörning", stage: "new", match: 94, unread: 2, lastTime: "4 min", messages: [{ from: "driver", text: "Hej! Jag såg er annons och är väldigt intresserad. Jag har 8 års erfarenhet av fjärr mot Tyskland.", at: minAgo(40) }, { from: "driver", text: "Finns det möjlighet att höras den här veckan?", at: minAgo(4) }] },
  { id: 1, driver: { name: "Karin Olsson", initials: "KO", loc: "Malmö", exp: 22 }, job: "CE-chaufför fjärrkörning", stage: "interviewing", match: 91, unread: 0, lastTime: "2h", messages: [{ from: "company", text: "Hej Karin, tack för din ansökan! Din erfarenhet ser stark ut. Kan du på torsdag 14:00 för en intervju?", at: minAgo(180) }, { from: "driver", text: "Absolut, torsdag 14:00 passar bra. Ska jag komma till kontoret i Malmö?", at: minAgo(120) }] },
  { id: 2, driver: { name: "Sara Pettersson", initials: "SP", loc: "Helsingborg", exp: 5 }, job: "Distributionschaufför", stage: "new", match: 86, unread: 1, lastTime: "6h", messages: [{ from: "driver", text: "Hej, jag har ansökt till distributionstjänsten och ser fram emot att höra från er!", at: minAgo(360) }] },
  { id: 3, driver: { name: "Mikael Stenberg", initials: "MS", loc: "Lund", exp: 15 }, job: "Tankbilschaufför ADR", stage: "selected", match: 96, unread: 0, lastTime: "1d", messages: [{ from: "company", text: "Hej Mikael! Vi vill gärna gå vidare med dig. Välkommen ombord!", at: minAgo(1440) }, { from: "driver", text: "Tack så mycket! Det här känns jättekul. När börjar vi?", at: minAgo(1380) }] },
  { id: 4, driver: { name: "Anders Bergström", initials: "AB", loc: "Malmö", exp: 12 }, job: "CE-chaufför fjärrkörning", stage: "contacted", match: 88, unread: 0, lastTime: "3d", messages: [{ from: "company", text: "Hej Anders, tack för ansökan. Vi hör av oss inom kort med besked.", at: minAgo(4320) }] },
];
const stageMeta = { new: { label: "Ny", tone: "amber" }, contacted: { label: "Kontaktad", tone: "info" }, interviewing: { label: "På intervju", tone: "amber" }, selected: { label: "Utvald", tone: "success" }, declined: { label: "Avböjd", tone: "neutral" } };

const ConvItem = ({ c, active, onClick }) => {
  const last = c.messages[c.messages.length - 1];
  const meta = stageMeta[c.stage];
  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "left", display: "block", padding: "14px 18px", background: active ? "var(--green-tint)" : "transparent", borderBottom: "1px solid var(--line)", borderLeft: active ? "3px solid var(--green)" : "3px solid transparent" }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--card-2)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Avatar initials={c.driver.initials} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.driver.name}</span>
            <span style={{ fontSize: 11.5, color: "var(--ink-400)", flexShrink: 0 }}>{c.lastTime}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 1, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.job}</span>
            <span style={{ color: matchColor(c.match), fontWeight: 700, fontFamily: "var(--mono)", flexShrink: 0 }}>{c.match}%</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12.5, color: c.unread ? "var(--ink-900)" : "var(--ink-500)", fontWeight: c.unread ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{last.from === "company" ? "Du: " : ""}{last.text}</span>
            {c.unread > 0 && <span style={{ width: 18, height: 18, borderRadius: 9, background: "var(--green)", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.unread}</span>}
          </div>
          <div style={{ marginTop: 8 }}><Pill tone={meta.tone} size="sm">{meta.label}</Pill></div>
        </div>
      </div>
    </button>
  );
};

const Thread = ({ c }) => {
  const scrollRef = useRef(null);
  const [draft, setDraft] = useState("");
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [c.id]);
  const meta = stageMeta[c.stage];
  return (
    <div className="thread-pane" style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--paper)" }}>
      <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--line)", background: "var(--card)", display: "flex", alignItems: "center", gap: 14 }}>
        <Avatar initials={c.driver.initials} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "var(--ink-900)" }}>{c.driver.name}</span>
            <Pill tone={meta.tone} size="sm">{meta.label}</Pill>
            <span style={{ fontSize: 13, fontWeight: 700, color: matchColor(c.match), fontFamily: "var(--mono)" }}>{c.match}% match</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2 }}>{c.driver.loc} · {c.driver.exp} år · söker {c.job}</div>
        </div>
        <Button variant="secondary" size="sm" icon={<Icon name="user" size={13} stroke={2} />}>Visa profil</Button>
        <Button variant="primary" size="sm">Boka intervju</Button>
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        {c.messages.map((m, i) => {
          const mine = m.from === "company";
          return (
            <div key={i} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "72%" }}>
                <div style={{ padding: "11px 15px", borderRadius: 14, borderBottomRightRadius: mine ? 4 : 14, borderBottomLeftRadius: mine ? 14 : 4, background: mine ? "var(--green)" : "var(--card)", color: mine ? "#fff" : "var(--ink-900)", border: mine ? "none" : "1px solid var(--line)", boxShadow: mine ? "0 1px 2px rgba(31,95,92,0.2)" : "var(--sh-sm)", fontSize: 14, lineHeight: 1.55, textWrap: "pretty" }}>{m.text}</div>
                <div style={{ fontSize: 11, color: "var(--ink-400)", marginTop: 4, textAlign: mine ? "right" : "left" }}>{clock(m.at)}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: "14px 24px 20px", borderTop: "1px solid var(--line)", background: "var(--card)" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "var(--card-2)", border: "1px solid var(--line-2)", borderRadius: 12, padding: "8px 8px 8px 16px" }}>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Skriv ett meddelande..." rows={1} style={{ flex: 1, border: "none", outline: "none", background: "transparent", resize: "none", fontSize: 14, color: "var(--ink-900)", fontFamily: "var(--font)", lineHeight: 1.5, paddingTop: 6, maxHeight: 120 }} />
          <Button variant="primary" size="md" onClick={() => setDraft("")} icon={<Icon name="arrow" size={14} stroke={2.2} />}>Skicka</Button>
        </div>
      </div>
    </div>
  );
};

export default function AkeriInkorgPreview() {
  const [nav, setNav] = useState("inkorg");
  const [selId, setSelId] = useState(0);
  const [filter, setFilter] = useState("all");
  const conv = CONVERSATIONS.find((c) => c.id === selId);
  const totalUnread = CONVERSATIONS.reduce((s, c) => s + c.unread, 0);
  const filters = [{ k: "all", l: "Alla" }, { k: "new", l: "Nya" }, { k: "interviewing", l: "Intervju" }, { k: "selected", l: "Utvalda" }];
  const list = CONVERSATIONS.filter((c) => (filter === "all" ? true : c.stage === filter));

  return (
    <PageShell>
      <style>{`.inbox-grid{display:grid;grid-template-columns:360px 1fr;height:calc(100vh - 60px)}@media(max-width:820px){.inbox-grid{grid-template-columns:1fr}.thread-pane{display:none}}`}</style>
      <TopNav items={AKERI_NAV} active={nav} onActive={setNav} brand="STP" brandSub="Åkeri" currentUser={{ initials: COMPANY.initials, label: COMPANY.name }} />
      <div className="inbox-grid">
        <div style={{ borderRight: "1px solid var(--line)", background: "var(--card)", display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ padding: "18px 18px 12px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.4 }}>Inkorg</h1>
              {totalUnread > 0 && <Pill tone="success" size="sm">{totalUnread} nya</Pill>}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {filters.map((f) => (
                <button key={f.k} onClick={() => setFilter(f.k)} style={{ padding: "6px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, background: filter === f.k ? "var(--green)" : "var(--card-2)", color: filter === f.k ? "#fff" : "var(--ink-700)", border: `1px solid ${filter === f.k ? "var(--green-deep)" : "var(--line-2)"}` }}>{f.l}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {list.map((c) => <ConvItem key={c.id} c={c} active={c.id === selId} onClick={() => setSelId(c.id)} />)}
          </div>
        </div>
        {conv ? <Thread c={conv} /> : <div className="thread-pane" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-400)" }}>Välj en konversation</div>}
      </div>
    </PageShell>
  );
}
