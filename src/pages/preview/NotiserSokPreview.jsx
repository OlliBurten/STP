/* PROOF — Notiser & globalt sök, från "STP Notiser & Sök Ljust.html". Route: /preview/notiser-sok */
import { useState } from "react";
import { TopNav, PageShell, Button, Icon } from "../../components/ui";

const NOTIFS = [
  { id: 1, icon: "msg", tone: "primary", text: "Nordic Transport AB skickade ett meddelande", time: "4 min sen", unread: true },
  { id: 2, icon: "check", tone: "success", text: "Du är utvald av Nordic Transport AB för CE-chaufför fjärr", time: "2 tim sen", unread: true },
  { id: 3, icon: "search", tone: "primary", text: "Nytt jobb matchar din profil — CE-chaufför Helsingborg (88%)", time: "5 tim sen", unread: false },
  { id: 4, icon: "eye", tone: "neutral", text: "Stockholm Logistik såg din ansökan", time: "igår", unread: false },
  { id: 5, icon: "alert", tone: "amber", text: "Ditt YKB är utgånget — uppdatera för att synas i fler sök", time: "2 dgr sen", unread: false },
];
const SEARCH = {
  Jobb: [{ icon: "search", title: "CE-chaufför fjärrkörning", sub: "Nordic Transport AB · Malmö", meta: "94%" }, { icon: "search", title: "Tankbilschaufför ADR", sub: "PetrolTrans Nordic · Göteborg", meta: "88%" }],
  Åkerier: [{ icon: "building", title: "Nordic Transport AB", sub: "Malmö · 5 lediga jobb", meta: "4.3★" }],
  Meddelanden: [{ icon: "msg", title: "Nordic Transport AB", sub: "Skulle du kunna på torsdag 14?", meta: "4 min" }],
};
const toneColor = { primary: "var(--green-text)", success: "var(--success)", amber: "var(--amber-deep)", neutral: "var(--ink-500)" };
const toneBg = { primary: "var(--green-tint)", success: "var(--success-tint)", amber: "var(--amber-tint)", neutral: "var(--paper-2)" };
const NAV = [{ id: "jobb", label: "Jobb" }, { id: "akerier", label: "Åkerier" }, { id: "meddelanden", label: "Meddelanden", badge: 2 }, { id: "favoriter", label: "Favoriter" }];

const NotifPanel = ({ onClose }) => (
  <>
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
    <div style={{ position: "fixed", top: 56, right: 24, width: 380, maxHeight: "calc(100vh - 80px)", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "0 24px 60px rgba(15,22,22,0.22)", zIndex: 61, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: "var(--ink-900)" }}>Notiser</span>
        <button style={{ fontSize: 12.5, fontWeight: 700, color: "var(--green)" }}>Markera alla lästa</button>
      </div>
      <div style={{ overflowY: "auto" }}>
        {NOTIFS.map((n) => (
          <button key={n.id} style={{ width: "100%", textAlign: "left", display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 18px", borderBottom: "1px solid var(--line)", background: n.unread ? "var(--green-tint)" : "transparent" }}>
            <span style={{ width: 36, height: 36, borderRadius: 9, background: toneBg[n.tone], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={n.icon} size={16} color={toneColor[n.tone]} stroke={2} /></span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, color: "var(--ink-900)", lineHeight: 1.45, fontWeight: n.unread ? 600 : 400 }}>{n.text}</div><div style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 3 }}>{n.time}</div></div>
            {n.unread && <span style={{ width: 8, height: 8, borderRadius: 4, background: "var(--green)", flexShrink: 0, marginTop: 6 }} />}
          </button>
        ))}
      </div>
      <div style={{ padding: "12px", borderTop: "1px solid var(--line)" }}><Button variant="secondary" size="sm" full>Visa alla notiser</Button></div>
    </div>
  </>
);

const SearchModal = ({ onClose }) => {
  const [q, setQ] = useState("");
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,22,22,0.5)", backdropFilter: "blur(3px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "12vh 24px 24px", zIndex: 100 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 560, background: "var(--card)", borderRadius: 16, boxShadow: "0 30px 70px rgba(15,22,22,0.3)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <Icon name="search" size={20} color="var(--ink-400)" stroke={2} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sök jobb, åkerier, meddelanden..." style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 16.5, color: "var(--ink-900)", fontFamily: "var(--font)" }} />
          <kbd style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-500)", background: "var(--card-2)", border: "1px solid var(--line-2)", borderRadius: 6, padding: "3px 7px", fontFamily: "var(--mono)" }}>ESC</kbd>
        </div>
        <div style={{ maxHeight: "50vh", overflowY: "auto", padding: "8px" }}>
          {Object.entries(SEARCH).map(([group, items]) => (
            <div key={group} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: "var(--ink-400)", padding: "8px 12px 6px" }}>{group}</div>
              {items.map((it, i) => (
                <button key={i} style={{ width: "100%", textAlign: "left", display: "flex", gap: 12, alignItems: "center", padding: "10px 12px", borderRadius: 10, background: "transparent" }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card-2)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <span style={{ width: 34, height: 34, borderRadius: 8, background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={it.icon} size={16} color="var(--ink-600)" stroke={2} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-900)" }}>{it.title}</div><div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{it.sub}</div></div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--green)", fontFamily: "var(--mono)" }}>{it.meta}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
        <div style={{ padding: "10px 16px", borderTop: "1px solid var(--line)", display: "flex", gap: 16, fontSize: 11.5, color: "var(--ink-400)" }}><span><kbd style={{ fontFamily: "var(--mono)" }}>↑↓</kbd> navigera</span><span><kbd style={{ fontFamily: "var(--mono)" }}>↵</kbd> öppna</span></div>
      </div>
    </div>
  );
};

export default function NotiserSokPreview() {
  const [overlay, setOverlay] = useState("notif");
  return (
    <PageShell>
      <TopNav items={NAV} active="jobb" currentUser={{ initials: "OH", label: "Oliver Harburt" }}
        rightExtras={
          <>
            <button onClick={() => setOverlay("search")} style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(232,237,237,0.7)", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5 }}><Icon name="search" size={14} color="rgba(232,237,237,0.7)" stroke={2} /> Sök <kbd style={{ fontSize: 10, fontFamily: "var(--mono)", opacity: 0.7 }}>⌘K</kbd></button>
            <button onClick={() => setOverlay("notif")} style={{ padding: 8, borderRadius: 8, color: "rgba(232,237,237,0.7)", position: "relative" }}><Icon name="bell" size={18} stroke={1.7} /><span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: 4, background: "var(--amber)", border: "1.5px solid var(--ink-900)" }} /></button>
          </>
        } />
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "40px 32px" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" size="md" onClick={() => setOverlay("notif")} icon={<Icon name="bell" size={14} stroke={2} />}>Öppna notiser</Button>
          <Button variant="secondary" size="md" onClick={() => setOverlay("search")} icon={<Icon name="search" size={14} stroke={2} />}>Öppna sök (⌘K)</Button>
        </div>
        <p style={{ fontSize: 14, color: "var(--ink-500)", marginTop: 16 }}>Notispanelen och det globala söket ligger som overlays — klicka utanför för att stänga.</p>
      </div>
      {overlay === "notif" && <NotifPanel onClose={() => setOverlay(null)} />}
      {overlay === "search" && <SearchModal onClose={() => setOverlay(null)} />}
    </PageShell>
  );
}
