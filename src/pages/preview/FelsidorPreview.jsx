/* PROOF — Felsidor (404/500/403/offline/underhåll), från "STP Felsidor Ljust.html". Route: /preview/felsidor */
import { useState } from "react";
import { Button, Icon } from "../../components/ui";

const PAGES = {
  "404": { code: "404", icon: "search", tone: "neutral", title: "Sidan kunde inte hittas", body: "Vägen tog slut här. Sidan du letar efter finns inte längre, eller har flyttat.", primary: "Till startsidan", secondary: "Se lediga jobb" },
  "500": { code: "500", icon: "alert", tone: "danger", title: "Något gick fel hos oss", body: "Ett oväntat fel uppstod. Det är inte ditt fel — vi har fått en notis och jobbar på det. Försök igen om en stund.", primary: "Försök igen", secondary: "Till startsidan" },
  "403": { code: "403", icon: "settings", tone: "amber", title: "Du har inte åtkomst hit", body: "Den här sidan kräver behörighet du inte har. Är du inloggad på rätt konto?", primary: "Logga in", secondary: "Till startsidan" },
  offline: { code: "", icon: "info", tone: "neutral", title: "Ingen internetanslutning", body: "Du verkar vara offline. Kontrollera din uppkoppling — vi laddar om så fort du är tillbaka.", primary: "Försök igen", secondary: null },
  maintenance: { code: "", icon: "settings", tone: "amber", title: "Vi underhåller plattformen", body: "STP är tillfälligt nere för planerat underhåll. Vi är strax tillbaka — oftast inom 30 minuter.", primary: null, secondary: null },
};
const toneColor = { neutral: "var(--ink-700)", danger: "var(--danger)", amber: "var(--amber-deep)" };
const toneBg = { neutral: "var(--paper-2)", danger: "var(--danger-tint)", amber: "var(--amber-tint)" };

export default function FelsidorPreview() {
  const [page, setPage] = useState("404");
  const p = PAGES[page];
  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 32px", borderBottom: "1px solid var(--line)", background: "var(--card)" }}>
        <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}><div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13 }}>S</div><span style={{ fontWeight: 800, fontSize: 17, color: "var(--ink-900)", letterSpacing: 0.5 }}>STP</span></a>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: 460, textAlign: "center" }}>
          {p.code && <div style={{ fontSize: 88, fontWeight: 900, color: "var(--green-tint-2)", letterSpacing: -4, lineHeight: 1, marginBottom: 8, fontFamily: "var(--mono)" }}>{p.code}</div>}
          <div style={{ width: 64, height: 64, borderRadius: 16, background: toneBg[p.tone], margin: p.code ? "0 auto 22px" : "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={p.icon} size={28} color={toneColor[p.tone]} stroke={2} /></div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 12 }}>{p.title}</h1>
          <p style={{ fontSize: 15.5, color: "var(--ink-500)", lineHeight: 1.65, marginBottom: 30, textWrap: "pretty" }}>{p.body}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {p.primary && <Button variant="primary" size="lg" iconRight={<Icon name="arrow" size={15} stroke={2.2} />}>{p.primary}</Button>}
            {p.secondary && <Button variant="secondary" size="lg">{p.secondary}</Button>}
          </div>
          <div style={{ marginTop: 32, fontSize: 13, color: "var(--ink-400)" }}>Behöver du hjälp? <a href="#" style={{ color: "var(--green)", fontWeight: 600 }}>Kontakta support</a></div>
        </div>
      </div>
      <div style={{ position: "fixed", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4, background: "var(--ink-900)", padding: 5, borderRadius: 999, zIndex: 50, boxShadow: "var(--sh-md)" }}>
        {Object.keys(PAGES).map((k) => <button key={k} onClick={() => setPage(k)} style={{ padding: "5px 12px", borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: page === k ? "var(--green)" : "transparent", color: page === k ? "#fff" : "rgba(255,255,255,0.6)", textTransform: "capitalize" }}>{k}</button>)}
      </div>
    </div>
  );
}
