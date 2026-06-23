import { useState } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import { useIsMobile } from "../hooks/useIsMobile";
import PageMeta from "../components/PageMeta";
import { submitFeedback } from "../api/feedback";

const FAQ = [
  { q: "Hur snabbt svarar ni?", a: "Vi svarar normalt inom 1–2 vardagar. Vid enklare frågor ofta samma dag." },
  { q: "Vad kan jag kontakta er om?", a: "Frågor om plattformen, samverkan, genomgångar, pressförfrågningar eller feedback. Är du inloggad och har ett tekniskt problem — beskriv gärna vad som hände." },
  { q: "Finns det telefonsupport?", a: "Inte just nu. Vi prioriterar e-post för att kunna ge genomtänkta svar. Det gör det också lättare att följa upp och dokumentera ärendet." },
  { q: "Hur kontaktar jag er som åkeri eller partner?", a: "Samma adress — hello@transportplattformen.se. Ange gärna i ämnesraden att det gäller partnerskap eller samverkan så prioriteras det." },
];

function FaqItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "16px 20px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
        aria-expanded={open}
      >
        <span style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--ink-900)" }}>{item.q}</span>
        <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 8, background: open ? "var(--green)" : "var(--green-tint)", color: open ? "#fff" : "var(--green-text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-xl)", fontWeight: 400, transition: "all .15s" }}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div style={{ padding: "14px 20px 16px", fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.7, borderTop: "1px solid var(--line)" }}>
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function Kontakt() {
  usePageTitle("Kontakt");
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const submitContact = async () => {
    if (!form.message.trim() || status === "sending") return;
    setStatus("sending");
    try { await submitFeedback(form); setStatus("sent"); }
    catch { setStatus("error"); }
  };
  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh" }}>
      <PageMeta title="Kontakt – Sveriges Transportplattform" description="Kontakta Sveriges Transportplattform (STP) med frågor om samverkan, plattformen eller genomgång. Vi svarar på hello@transportplattformen.se." canonical="/kontakt" />

      <div style={{ maxWidth: "var(--w-public)", margin: "0 auto", padding: isMobile ? "24px 20px 64px" : "64px 32px 80px" }}>
        {/* Top grid: contact info + form */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 28 : 48, alignItems: "start", marginBottom: isMobile ? 40 : 64 }}>
          {/* Left */}
          <div>
            <h1 style={{ fontSize: isMobile ? 30 : 38, fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1.2, marginBottom: 12 }}>Hör av dig</h1>
            <p style={{ fontSize: "var(--text-lg)", color: "var(--ink-500)", lineHeight: 1.7, marginBottom: 24 }}>
              Frågor, feedback eller vill du veta mer? Mejla oss så svarar vi oftast inom 1–2 vardagar.
            </p>
            {[
              { icon: "mail",  label: "E-post",  value: "hello@transportplattformen.se" },
            ].map(({ icon, label, value }) => (
              <a key={label} href="mailto:hello@transportplattformen.se" style={{ display: "flex", gap: 13, alignItems: "center", marginBottom: 16, textDecoration: "none" }}>
                <span style={{ width: 42, height: 42, borderRadius: 11, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {icon === "mail" && <svg viewBox="0 0 24 24" fill="none" stroke="var(--green-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,7 12,13 22,7"/></svg>}
                </span>
                <div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--ink-900)" }}>{value}</div>
                </div>
              </a>
            ))}
          </div>

          {/* Right: contact form */}
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: isMobile ? "24px 20px" : "28px 30px" }}>
            <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)", marginBottom: 18 }}>Skicka ett meddelande</div>
            {status === "sent" ? (
              <div style={{ padding: "16px 16px", borderRadius: 12, background: "var(--green-tint)", color: "var(--green-text)", fontSize: "var(--text-base)", lineHeight: 1.6, fontWeight: 600 }}>
                Tack! Vi har tagit emot ditt meddelande och svarar oftast inom 1–2 vardagar.
              </div>
            ) : (
              <>
                {[["Namn", "name", "text"], ["E-post", "email", "email"]].map(([l, k, t]) => (
                  <label key={k} style={{ display: "block", marginBottom: 16 }}>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-700)", display: "block", marginBottom: 8 }}>{l}</span>
                    <input
                      type={t}
                      value={form[k]}
                      onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                      style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "var(--card-2)", border: "1px solid var(--line-2)", fontSize: "var(--text-base)", color: "var(--ink-900)", outline: "none", fontFamily: "inherit" }}
                    />
                  </label>
                ))}
                <label style={{ display: "block", marginBottom: 18 }}>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--ink-700)", display: "block", marginBottom: 8 }}>Meddelande</span>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "var(--card-2)", border: "1px solid var(--line-2)", fontSize: "var(--text-base)", color: "var(--ink-900)", outline: "none", fontFamily: "inherit", lineHeight: 1.5, resize: "vertical" }}
                  />
                </label>
                {status === "error" && (
                  <div style={{ marginBottom: 12, fontSize: "var(--text-sm)", color: "var(--danger)", fontWeight: 600 }}>Kunde inte skicka just nu. Försök igen eller mejla hello@transportplattformen.se.</div>
                )}
                <button
                  type="button"
                  onClick={submitContact}
                  disabled={status === "sending" || !form.message.trim()}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 24px", borderRadius: 10, background: "var(--green)", color: "#fff", fontSize: "var(--text-base)", fontWeight: 800, border: "none", cursor: status === "sending" || !form.message.trim() ? "not-allowed" : "pointer", opacity: status === "sending" || !form.message.trim() ? 0.5 : 1, fontFamily: "inherit" }}
                >
                  {status === "sending" ? "Skickar…" : "Skicka"}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: "var(--w-prose)" }}>
          <p style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)", marginBottom: 20 }}>Vanliga frågor</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQ.map((item) => (
              <FaqItem key={item.q} item={item} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
