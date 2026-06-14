/* ════════════════════════════════════════════════════════════
   PROOF-SKÄRM — Inkorg / Meddelanden (förare), portad från
   "STP (4)/STP Inkorg Ljust.html".

   Full-höjd två-panels-vy (konversationslista + tråd). Detta är den
   ENA app-vyn som medvetet bryter standard-innehållspaddingen — den
   fyller hela viewporten under TopNav (60px), som en mejlklient.
   Route: /preview/inkorg
════════════════════════════════════════════════════════════ */
import { useState, useRef, useEffect } from "react";
import { TopNav, PageShell, Pill, Button, Icon } from "../../components/ui";

const NOW = Date.now();
const minAgo = (n) => NOW - n * 60000;
const dayAgo = (n) => NOW - n * 864e5;
const relShort = (ts) => {
  const min = Math.floor((NOW - ts) / 60000);
  if (min < 1) return "nu";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(ts).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
};
const clock = (ts) => new Date(ts).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });

const CONVERSATIONS = [
  { id: 1, company: "Nordic Transport AB", logo: "NT", jobTitle: "CE-chaufför fjärrkörning", location: "Malmö", salary: "34 000 kr/mån", match: 94, stage: "selected", unread: 1,
    messages: [
      { from: "company", text: "Hej Oliver! Tack för din ansökan — vi har gått igenom din profil och är imponerade.", at: dayAgo(1.8) },
      { from: "me", text: "Tack! Det låter intressant. Vad innebär tjänsten konkret i veckorna?", at: dayAgo(1.7) },
      { from: "company", text: "Fjärr Norden, 2–3 övernattningar/vecka, ny Volvo FH. Vi vill gärna träffas för en intervju.", at: dayAgo(1.6) },
      { from: "company", text: "Skulle du kunna på torsdag kl 14? Eller någon annan tid som passar dig denna vecka? Ring gärna 040-123 45 om det är lättare.", at: minAgo(12) },
    ] },
  { id: 2, company: "Stockholm Logistik", logo: "SL", jobTitle: "C-chaufför distribution", location: "Stockholm", salary: "29 000 kr/mån", match: 81, stage: "review", unread: 0,
    messages: [
      { from: "me", text: "Hej, jag har ansökt till tjänsten och ser fram emot att höra från er.", at: dayAgo(5) },
      { from: "company", text: "Hej! Tack för ansökan. Vi går igenom alla profiler den här veckan och hör av oss.", at: dayAgo(4) },
    ] },
  { id: 3, company: "PetrolTrans Nordic", logo: "PT", jobTitle: "CE-chaufför tanktransporter", location: "Göteborg", salary: "Enligt koll. + OB", match: 68, stage: "seen", unread: 0,
    messages: [{ from: "me", text: "Hej, jag har ansökt och ser fram emot att höra från er.", at: dayAgo(7) }] },
  { id: 4, company: "Svensk Cementering", logo: "SC", jobTitle: "Lokalchaufför C, dagskift", location: "Uppsala", salary: "28 500 kr/mån", match: 57, stage: "rejected", unread: 0,
    messages: [
      { from: "me", text: "Hej, jag har ansökt till lokalchaufför-tjänsten.", at: dayAgo(18) },
      { from: "company", text: "Hej Oliver, tack för din ansökan. Vi har tyvärr beslutat gå vidare med en annan kandidat med mer lokalkännedom. Lycka till!", at: dayAgo(12) },
    ] },
];

const stageMeta = {
  applied: { label: "Skickad", tone: "neutral" },
  seen: { label: "Sedd", tone: "info" },
  review: { label: "I urval", tone: "amber" },
  selected: { label: "Utvald", tone: "success" },
  rejected: { label: "Ej aktuell", tone: "danger" },
};
const NAV_ITEMS = [
  { id: "jobb", label: "Jobb" }, { id: "ansokningar", label: "Mina ansökningar" },
  { id: "meddelanden", label: "Meddelanden", badge: 1 }, { id: "favoriter", label: "Favoriter" },
];
const ME = { initials: "OH", label: "Oliver Harburt" };

const ConvItem = ({ conv, active, onClick }) => {
  const last = conv.messages?.at(-1);
  const meta = stageMeta[conv.stage];
  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "left", display: "block", padding: "14px 18px", background: active ? "var(--green-tint)" : "transparent", borderBottom: "1px solid var(--line)", borderLeft: active ? "3px solid var(--green)" : "3px solid transparent" }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--card-2)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: "var(--paper-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13.5, fontWeight: 800, color: "var(--ink-700)" }}>{conv.logo}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.company}</span>
            <span style={{ fontSize: 11.5, color: "var(--ink-400)", flexShrink: 0 }}>{relShort(last.at)}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 1, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.jobTitle}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12.5, color: conv.unread ? "var(--ink-900)" : "var(--ink-500)", fontWeight: conv.unread ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{last.from === "me" ? "Du: " : ""}{last.text}</span>
            {conv.unread > 0 && <span style={{ width: 18, height: 18, borderRadius: 9, background: "var(--green)", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{conv.unread}</span>}
          </div>
          <div style={{ marginTop: 8 }}><Pill tone={meta.tone} size="sm">{meta.label}</Pill></div>
        </div>
      </div>
    </button>
  );
};

const Thread = ({ conv }) => {
  const scrollRef = useRef(null);
  const [draft, setDraft] = useState("");
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [conv.id]);
  const meta = stageMeta[conv.stage];
  return (
    <div className="thread-pane" style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--paper)" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--line)", background: "var(--card)", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, flexShrink: 0, background: "var(--paper-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "var(--ink-700)" }}>{conv.logo}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "var(--ink-900)" }}>{conv.company}</span>
            <Pill tone={meta.tone} size="sm">{meta.label}</Pill>
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2 }}>{conv.jobTitle} · {conv.location} · <span style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>{conv.salary}</span></div>
        </div>
        <Button variant="secondary" size="sm" icon={<Icon name="eye" size={13} stroke={2} />}>Visa annons</Button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 14 }}>
        {conv.messages.map((m, i) => {
          const mine = m.from === "me";
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

export default function InkorgPreview() {
  const [nav, setNav] = useState("meddelanden");
  const [selId, setSelId] = useState(1);
  const conv = CONVERSATIONS.find((c) => c.id === selId);
  const totalUnread = CONVERSATIONS.reduce((s, c) => s + c.unread, 0);

  return (
    <PageShell>
      <style>{`.inbox-grid{display:grid;grid-template-columns:340px 1fr;height:calc(100vh - 60px)}@media(max-width:820px){.inbox-grid{grid-template-columns:1fr}.thread-pane{display:none}}`}</style>
      <TopNav items={NAV_ITEMS} active={nav} onActive={setNav} currentUser={ME} />
      <div className="inbox-grid">
        <div style={{ borderRight: "1px solid var(--line)", background: "var(--card)", display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.4 }}>Meddelanden</h1>
              {totalUnread > 0 && <Pill tone="success" size="sm">{totalUnread} nya</Pill>}
            </div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-400)" }}><Icon name="search" size={15} stroke={2} /></span>
              <input placeholder="Sök konversation..." style={{ width: "100%", padding: "9px 14px 9px 36px", background: "var(--card-2)", border: "1px solid var(--line-2)", borderRadius: 9, fontSize: 13.5, color: "var(--ink-900)", outline: "none", fontFamily: "var(--font)" }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {CONVERSATIONS.map((c) => <ConvItem key={c.id} conv={c} active={c.id === selId} onClick={() => setSelId(c.id)} />)}
          </div>
        </div>
        {conv ? <Thread conv={conv} /> : (
          <div className="thread-pane" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-400)", fontSize: 14 }}>Välj en konversation</div>
        )}
      </div>
    </PageShell>
  );
}
