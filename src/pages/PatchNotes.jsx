import { releaseNotes, CURRENT_VERSION } from "../lib/releaseNotes";
import { usePageTitle } from "../hooks/usePageTitle";
import PageMeta from "../components/PageMeta";

export default function PatchNotes() {
  usePageTitle("Uppdateringar & nyheter");
  return (
    <main style={{ background: "var(--paper)", minHeight: "100vh", paddingTop: 96 }}>
      <PageMeta
        title="Nyheter & uppdateringar – STP"
        description="Följ de senaste uppdateringarna på Sveriges Transportplattform. Nya funktioner, förbättringar och buggfixar för förare och åkerier."
        canonical="/uppdateringar"
      />
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 80px" }}>

        <div style={{ maxWidth: 560, marginBottom: 48 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 20, background: "var(--success-tint)", border: "1px solid var(--success)", padding: "4px 12px", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--success)", letterSpacing: "0.5px" }}>
            Senaste version: {CURRENT_VERSION}
          </span>
          <h1 style={{ fontSize: "clamp(30px,4vw,42px)", fontWeight: 900, letterSpacing: "-1px", color: "var(--ink-900)", margin: "16px 0 14px", lineHeight: 1.15 }}>
            Vad är nytt
          </h1>
          <p style={{ fontSize: "var(--text-lg)", color: "var(--ink-500)", lineHeight: 1.7, margin: 0 }}>
            Vi uppdaterar STP löpande. Här samlar vi de förändringar som märks för dig som förare eller åkeri.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {releaseNotes.map((note, index) => (
            <article
              key={note.version}
              style={{
                borderRadius: 20,
                border: index === 0 ? "1px solid var(--success)" : "1px solid var(--line)",
                background: index === 0 ? "var(--success-tint)" : "var(--card)",
                overflow: "hidden",
                boxShadow: "var(--sh-sm)",
              }}
            >
              <div style={{ padding: "22px 28px 18px", borderBottom: "1px solid var(--line)" }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      display: "inline-flex", borderRadius: 20, padding: "4px 12px", fontSize: "var(--text-xs)", fontWeight: 700,
                      ...(index === 0 ? { background: "var(--amber)", color: "#000" } : { background: "var(--paper-2)", color: "var(--ink-500)" }),
                    }}>
                      {note.version}
                    </span>
                    {index === 0 && (
                      <span style={{ display: "inline-flex", borderRadius: 20, background: "var(--success-tint)", color: "var(--success)", padding: "4px 10px", fontSize: "var(--text-2xs)", fontWeight: 700, border: "1px solid var(--success)" }}>
                        Senaste
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-300)", margin: 0 }}>{note.date}</p>
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink-900)", margin: 0 }}>{note.title}</h2>
              </div>
              <ul style={{ listStyle: "none", margin: 0, padding: "18px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
                {note.items.map((item) => (
                  <li key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0, width: 6, height: 6, borderRadius: "50%", background: "var(--amber)", marginTop: 8 }} aria-hidden="true" />
                    <span style={{ fontSize: "var(--text-base)", color: "var(--ink-500)", lineHeight: 1.65 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p style={{ marginTop: 40, textAlign: "center", fontSize: "var(--text-base)", color: "var(--ink-300)" }}>
          Har du feedback eller hittade något som inte stämmer?{" "}
          <a href="mailto:hello@transportplattformen.se" style={{ color: "var(--green-text)", textDecoration: "none" }}>
            Hör av dig
          </a>
        </p>
      </section>
    </main>
  );
}
