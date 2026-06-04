/* PROOF — Villkor & Integritet, från "STP Juridik Ljust.html". Route: /preview/juridik */
import { useState } from "react";

const DOCS = {
  terms: {
    title: "Användarvillkor", updated: "Senast uppdaterad 1 maj 2026",
    sections: [
      { id: "intro", h: "1. Inledning", p: ["Dessa användarvillkor reglerar din användning av Sveriges Transportplattform (STP). Genom att skapa ett konto godkänner du villkoren i sin helhet.", "STP är en matchningsplattform som kopplar samman yrkesförare och transportföretag. Vi är inte en arbetsgivare, ett bemanningsföretag eller en part i några anställningsavtal."] },
      { id: "konto", h: "2. Konto och behörighet", p: ["Du måste vara minst 18 år för att använda STP. Du ansvarar för att uppgifterna i din profil är korrekta och aktuella, inklusive körkort och certifikat."], li: ["Du får endast ha ett konto per person eller organisation.", "Du ansvarar för att hålla dina inloggningsuppgifter säkra.", "Åkerier verifieras mot Bolagsverket."] },
      { id: "anvandning", h: "3. Tillåten användning", p: ["Plattformen får endast användas för dess avsedda syfte: att matcha förare med jobb. Det är inte tillåtet att publicera vilseledande information, trakassera andra användare eller använda plattformen för bedrägeri."] },
      { id: "avgifter", h: "4. Avgifter", p: ["Under betafasen är STP kostnadsfritt för alla användare. För förare kommer plattformen alltid att vara gratis. Vi meddelar i god tid innan eventuella betalda funktioner introduceras för åkerier."] },
      { id: "ansvar", h: "5. Ansvarsbegränsning", p: ["STP ansvarar inte för innehållet i jobbannonser eller för anställningsförhållanden som uppstår genom plattformen. Vi förmedlar kontakt, inte anställning."] },
      { id: "uppsagning", h: "6. Avslutande av konto", p: ["Du kan när som helst radera ditt konto. Vi förbehåller oss rätten att stänga av konton som bryter mot dessa villkor."] },
    ],
  },
  privacy: {
    title: "Integritetspolicy", updated: "Senast uppdaterad 1 maj 2026",
    sections: [
      { id: "intro", h: "1. Om denna policy", p: ["STP värnar om din personliga integritet. Denna policy beskriver vilka personuppgifter vi samlar in, hur vi använder dem och vilka rättigheter du har enligt GDPR."] },
      { id: "data", h: "2. Uppgifter vi samlar in", p: ["Vi samlar in de uppgifter du själv anger samt teknisk information om hur du använder plattformen."], li: ["Profiluppgifter: namn, kontaktuppgifter, körkort, certifikat, erfarenhet.", "Användningsdata: inloggningar, sökningar, ansökningar.", "Teknisk data: enhet, IP-adress, webbläsare."] },
      { id: "anvandning", h: "3. Hur vi använder uppgifterna", p: ["Vi använder dina uppgifter för att matcha dig med relevanta jobb eller förare, förbättra plattformen och kommunicera med dig. Din profil visas endast för verifierade åkerier om du valt att vara synlig."] },
      { id: "delning", h: "4. Delning av uppgifter", p: ["Vi säljer aldrig dina uppgifter. Åkerier ser endast den information du valt att visa. Vi delar uppgifter med underleverantörer (t.ex. hosting) endast i den utsträckning som krävs för driften."] },
      { id: "rattigheter", h: "5. Dina rättigheter", p: ["Enligt GDPR har du rätt att:"], li: ["Få tillgång till de uppgifter vi har om dig.", "Begära rättelse eller radering.", "Invända mot behandling och begära dataportabilitet.", "Återkalla samtycke när som helst."] },
      { id: "kontakt", h: "6. Kontakt", p: ["Har du frågor om hur vi hanterar dina uppgifter? Kontakta oss på dataskydd@transportplattformen.se. Du har även rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY)."] },
    ],
  },
};

export default function JuridikPreview() {
  const [doc, setDoc] = useState("terms");
  const d = DOCS[doc];
  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <style>{`.legal-grid{display:grid;grid-template-columns:240px 1fr;gap:48px;align-items:start;max-width:1000px;margin:0 auto;padding:48px 32px 80px}@media(max-width:820px){.legal-grid{grid-template-columns:1fr}.legal-toc{display:none}}.doc h2{font-size:21px;font-weight:800;color:var(--ink-900);letter-spacing:-0.4px;margin:36px 0 12px;scroll-margin-top:80px}.doc h2:first-child{margin-top:0}.doc p{font-size:15px;line-height:1.75;color:var(--ink-700);margin-bottom:14px;text-wrap:pretty}.doc li{font-size:15px;line-height:1.7;color:var(--ink-700);margin-bottom:8px}`}</style>
      <div style={{ background: "var(--card)", borderBottom: "1px solid var(--line)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}><div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13 }}>S</div><span style={{ fontWeight: 800, fontSize: 17, color: "var(--ink-900)", letterSpacing: 0.5 }}>STP</span></a>
          <div style={{ display: "flex", gap: 4, background: "var(--card-2)", padding: 4, borderRadius: 10, border: "1px solid var(--line-2)" }}>{[["terms", "Villkor"], ["privacy", "Integritet"]].map(([k, l]) => <button key={k} onClick={() => setDoc(k)} style={{ padding: "7px 16px", borderRadius: 7, fontSize: 13, fontWeight: 600, background: doc === k ? "var(--green)" : "transparent", color: doc === k ? "#fff" : "var(--ink-700)" }}>{l}</button>)}</div>
        </div>
      </div>
      <div className="legal-grid">
        <nav className="legal-toc" style={{ position: "sticky", top: 88 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)", marginBottom: 12 }}>Innehåll</div>
          {d.sections.map((s) => <a key={s.id} href={`#${s.id}`} style={{ display: "block", fontSize: 13.5, color: "var(--ink-600)", padding: "7px 0", borderLeft: "2px solid var(--line)", paddingLeft: 14, marginLeft: -2, textDecoration: "none" }}>{s.h}</a>)}
        </nav>
        <div>
          <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid var(--line)" }}>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1.4, marginBottom: 8 }}>{d.title}</h1>
            <p style={{ fontSize: 13.5, color: "var(--ink-500)" }}>{d.updated}</p>
          </div>
          <div className="doc">
            {d.sections.map((s) => (
              <section key={s.id} id={s.id}>
                <h2>{s.h}</h2>
                {s.p.map((para, i) => <p key={i}>{para}</p>)}
                {s.li && <ul style={{ paddingLeft: 22, marginBottom: 14 }}>{s.li.map((item, i) => <li key={i}>{item}</li>)}</ul>}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
