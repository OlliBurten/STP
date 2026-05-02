import { releaseNotes, CURRENT_VERSION } from "../lib/releaseNotes";
import { usePageTitle } from "../hooks/usePageTitle";

export default function PatchNotes() {
  usePageTitle("Uppdateringar & nyheter");
  return (
    <main style={{ background: "#060f0f", minHeight: "100vh", marginTop: "-64px", paddingTop: 96 }}>
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 80px" }}>

        <div style={{ maxWidth: 560, marginBottom: 48 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 20, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", padding: "4px 12px", fontSize: 12, fontWeight: 700, color: "#4ade80", letterSpacing: "0.5px" }}>
            Senaste version: {CURRENT_VERSION}
          </span>
          <h1 style={{ fontSize: "clamp(28px,4vw,38px)", fontWeight: 900, letterSpacing: "-1px", color: "#f0faf9", margin: "16px 0 14px", lineHeight: 1.15 }}>
            Vad är nytt
          </h1>
          <p style={{ fontSize: 16, color: "rgba(240,250,249,0.55)", lineHeight: 1.7, margin: 0 }}>
            Vi uppdaterar STP löpande. Här samlar vi de förändringar som märks för dig som förare eller åkeri.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {releaseNotes.map((note, index) => (
            <article
              key={note.version}
              style={{
                borderRadius: 20,
                border: index === 0 ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(255,255,255,0.07)",
                background: index === 0 ? "rgba(74,222,128,0.04)" : "rgba(255,255,255,0.02)",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "22px 28px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      display: "inline-flex", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700,
                      ...(index === 0 ? { background: "#F5A623", color: "#000" } : { background: "rgba(255,255,255,0.08)", color: "rgba(240,250,249,0.55)" }),
                    }}>
                      {note.version}
                    </span>
                    {index === 0 && (
                      <span style={{ display: "inline-flex", borderRadius: 20, background: "rgba(74,222,128,0.1)", color: "#4ade80", padding: "4px 10px", fontSize: 11, fontWeight: 700, border: "1px solid rgba(74,222,128,0.2)" }}>
                        Senaste
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: "rgba(240,250,249,0.35)", margin: 0 }}>{note.date}</p>
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#f0faf9", margin: 0 }}>{note.title}</h2>
              </div>
              <ul style={{ listStyle: "none", margin: 0, padding: "18px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
                {note.items.map((item) => (
                  <li key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0, width: 6, height: 6, borderRadius: "50%", background: "#F5A623", marginTop: 8 }} aria-hidden="true" />
                    <span style={{ fontSize: 14, color: "rgba(240,250,249,0.65)", lineHeight: 1.65 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p style={{ marginTop: 40, textAlign: "center", fontSize: 14, color: "rgba(240,250,249,0.35)" }}>
          Har du feedback eller hittade något som inte stämmer?{" "}
          <a href="mailto:hej@transportplattformen.se" style={{ color: "#4ade80", textDecoration: "none" }}>
            Hör av dig
          </a>
        </p>
      </section>
    </main>
  );
}
