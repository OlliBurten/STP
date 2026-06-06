/* Reusable error / status page — design from "STP Felsidor Ljust.html".
 *
 * Variants: "404" | "500" | "403" | "offline" | "maintenance"
 *
 * Router-independent on purpose (plain <a href> + window.location) so it can
 * safely render as the ErrorBoundary fallback even when the app tree crashed.
 */
import { Button, Icon } from "./ui";

const PAGES = {
  "404": {
    code: "404", icon: "search", tone: "neutral",
    title: "Sidan kunde inte hittas",
    body: "Vägen tog slut här. Sidan du letar efter finns inte längre, eller har flyttat.",
    primary: { label: "Till startsidan", href: "/" },
    secondary: { label: "Se lediga jobb", href: "/jobb" },
  },
  "500": {
    code: "500", icon: "alert", tone: "danger",
    title: "Något gick fel hos oss",
    body: "Ett oväntat fel uppstod. Det är inte ditt fel — vi har fått en notis och jobbar på det. Försök igen om en stund.",
    primary: { label: "Försök igen", retry: true },
    secondary: { label: "Till startsidan", href: "/" },
  },
  "403": {
    code: "403", icon: "settings", tone: "amber",
    title: "Du har inte åtkomst hit",
    body: "Den här sidan kräver behörighet du inte har. Är du inloggad på rätt konto?",
    primary: { label: "Logga in", href: "/login" },
    secondary: { label: "Till startsidan", href: "/" },
  },
  offline: {
    code: "", icon: "info", tone: "neutral",
    title: "Ingen internetanslutning",
    body: "Du verkar vara offline. Kontrollera din uppkoppling — vi laddar om så fort du är tillbaka.",
    primary: { label: "Försök igen", retry: true },
    secondary: null,
  },
  maintenance: {
    code: "", icon: "settings", tone: "amber",
    title: "Vi underhåller plattformen",
    body: "STP är tillfälligt nere för planerat underhåll. Vi är strax tillbaka — oftast inom 30 minuter.",
    primary: null,
    secondary: null,
  },
};

const toneColor = { neutral: "var(--ink-700)", danger: "var(--danger)", amber: "var(--amber-deep)" };
const toneBg = { neutral: "var(--paper-2)", danger: "var(--danger-tint)", amber: "var(--amber-tint)" };

export default function ErrorPage({ variant = "404", onRetry, hideTopBar = false }) {
  const p = PAGES[variant] || PAGES["404"];

  const go = (a) => {
    if (!a) return;
    if (a.retry) { if (onRetry) onRetry(); else window.location.reload(); }
    else if (a.href) { window.location.assign(a.href); }
  };

  return (
    <div style={{ minHeight: hideTopBar ? "72vh" : "100vh", background: "var(--paper)", display: "flex", flexDirection: "column" }}>
      {/* Standalone top bar — skipped when the global app header is already shown */}
      {!hideTopBar && (
        <div style={{ padding: "20px 32px", borderBottom: "1px solid var(--line)", background: "var(--card)" }}>
          <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "var(--text-sm)" }}>S</div>
            <span style={{ fontWeight: 800, fontSize: 17, color: "var(--ink-900)", letterSpacing: 0.5 }}>STP</span>
          </a>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: 460, textAlign: "center" }}>
          {p.code && (
            <div style={{ fontSize: 88, fontWeight: 900, color: "var(--green-tint-2)", letterSpacing: -4, lineHeight: 1, marginBottom: 8, fontFamily: "var(--mono)" }}>{p.code}</div>
          )}
          <div style={{ width: 64, height: 64, borderRadius: 16, background: toneBg[p.tone], margin: p.code ? "0 auto 22px" : "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={p.icon} size={28} color={toneColor[p.tone]} stroke={2} />
          </div>
          <h1 style={{ fontSize: "var(--text-4xl)", fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.8, marginBottom: 12 }}>{p.title}</h1>
          <p style={{ fontSize: "var(--text-md)", color: "var(--ink-500)", lineHeight: 1.65, marginBottom: 30, textWrap: "pretty" }}>{p.body}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {p.primary && (
              <Button variant="primary" size="lg" onClick={() => go(p.primary)} iconRight={<Icon name="arrow" size={15} stroke={2.2} />}>
                {p.primary.label}
              </Button>
            )}
            {p.secondary && (
              <Button variant="secondary" size="lg" onClick={() => go(p.secondary)}>
                {p.secondary.label}
              </Button>
            )}
          </div>
          <div style={{ marginTop: 32, fontSize: "var(--text-sm)", color: "var(--ink-400)" }}>
            Behöver du hjälp? <a href="/kontakt" style={{ color: "var(--green)", fontWeight: 600 }}>Kontakta support</a>
          </div>
        </div>
      </div>
    </div>
  );
}
