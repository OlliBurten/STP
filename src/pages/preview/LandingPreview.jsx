/* ════════════════════════════════════════════════════════════
   PROOF — Landningssida (publik), portad från "STP Landing Page Ljust.html".
   Standalone (egen nav, transparent → vit vid scroll). "För förare"/"För
   åkerier" är ankarlänkar till sektioner — inga separata sidor.
   Route: /preview/landing
════════════════════════════════════════════════════════════ */
import { useState, useEffect } from "react";
import { Card, Pill, Button, Icon, Avatar, Dot } from "../../components/ui";

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn); fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? "rgba(245,242,236,0.92)" : "transparent", borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent", backdropFilter: scrolled ? "blur(12px)" : "none", transition: "background .25s, border-color .25s" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68, padding: "0 32px" }}>
        <a href="#top" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.20)" }}>S</div>
          <span style={{ fontWeight: 800, fontSize: 17, color: scrolled ? "var(--ink-900)" : "#fff", letterSpacing: 0.5, transition: "color .25s" }}>STP</span>
        </a>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {[["För förare", "#hur"], ["För åkerier", "#hur"], ["Så fungerar det", "#hur"], ["Om STP", "#"]].map(([l, href]) => (
            <a key={l} href={href} style={{ fontSize: 14, fontWeight: 500, color: scrolled ? "var(--ink-700)" : "rgba(255,255,255,0.82)", transition: "color .25s", textDecoration: "none" }}>{l}</a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button style={{ padding: "7px 14px", fontSize: 13.5, fontWeight: 600, color: scrolled ? "var(--ink-900)" : "#fff", transition: "color .25s" }}>Logga in</button>
          <Button variant="primary" size="sm">Kom igång</Button>
        </div>
      </div>
    </nav>
  );
};

const ROTATE = ["Förare.", "Åkeri.", "Match."];
const Hero = () => {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = setInterval(() => { setVisible(false); setTimeout(() => { setIdx((i) => (i + 1) % ROTATE.length); setVisible(true); }, 250); }, 2600);
    return () => clearInterval(id);
  }, []);
  return (
    <section id="top" style={{ background: "var(--ink-900)", backgroundImage: "url('/hero.webp')", backgroundSize: "cover", backgroundPosition: "center 55%", minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: 96, paddingBottom: 48, position: "relative", color: "#fff" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(110deg, rgba(8,18,20,0.88) 0%, rgba(8,18,20,0.65) 40%, rgba(8,18,20,0.20) 75%, rgba(8,18,20,0.05) 100%)", pointerEvents: "none" }} />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.35)", color: "#f5c875", fontSize: 11.5, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase" }}><Dot tone="amber" size={6} />Beta · Gratis att använda</div>
        </div>
        <h1 style={{ fontSize: "clamp(54px, 7.4vw, 108px)", fontWeight: 900, lineHeight: 1.0, letterSpacing: -3, color: "#fff", marginBottom: 28 }}>
          Rätt&nbsp;<span style={{ color: "var(--amber)", display: "inline-block", minWidth: "3.2ch", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(8px)", transition: "opacity .25s ease, transform .25s ease" }}>{ROTATE[idx]}</span>&nbsp;<span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 300 }}>Direkt.</span>
        </h1>
        <p style={{ fontSize: 19, lineHeight: 1.6, color: "rgba(255,255,255,0.78)", fontWeight: 500, marginBottom: 32, maxWidth: 580 }}>Sveriges matchningsplattform för yrkesförare och transportföretag. Inga mellanhänder. Inga avgifter. Inga generiska CV — bara körkort, certifikat och tillgänglighet.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 72 }}>
          <button style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 24px", height: 50, background: "var(--amber)", color: "var(--ink-900)", border: "1px solid var(--amber-deep)", borderRadius: 10, fontWeight: 700, fontSize: 15, boxShadow: "0 1px 0 var(--amber-deep), 0 4px 12px rgba(242,164,28,0.30)", cursor: "pointer", fontFamily: "var(--font)" }}>Se lediga jobb<Icon name="arrow" size={15} stroke={2.2} /></button>
          <button style={{ padding: "14px 24px", height: 50, background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 10, fontWeight: 600, fontSize: 15, backdropFilter: "blur(6px)", cursor: "pointer", fontFamily: "var(--font)" }}>Jag är ett åkeri</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, borderTop: "1px solid rgba(255,255,255,0.14)", paddingTop: 28 }}>
          {[{ v: "4 080", l: "Lediga tjänster", mono: true }, { v: "5 662", l: "Anställda i år", mono: true }, { v: "36 %", l: "Åkerier saknar förare", mono: true }, { v: "Gratis", l: "För föraren — alltid", accent: true }].map((s, i) => (
            <div key={s.l} style={{ padding: i === 0 ? "0 28px 0 0" : "0 28px", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.10)" : "none" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: s.accent ? "var(--amber)" : "#fff", letterSpacing: -0.8, lineHeight: 1.1, marginBottom: 8, fontFamily: s.mono ? "var(--mono)" : "var(--font)" }}>{s.v}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 700, letterSpacing: 1.3, textTransform: "uppercase" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const LiveBand = () => {
  const matches = [{ name: "Erik Lindström", loc: "Malmö · Skåne", lic: "CE · YKB", pct: 94 }, { name: "Sara Johansson", loc: "Stockholm · Uppland", lic: "C · ADR", pct: 81 }, { name: "Mikael Berg", loc: "Göteborg · VG", lic: "CE · CE95", pct: 76 }];
  return (
    <section style={{ background: "var(--paper)", padding: "40px 32px 60px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}><Pill tone="success" size="sm" icon={<Dot tone="success" size={6} />}>Live</Pill><span style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1.4, textTransform: "uppercase" }}>Nya matchningar senaste timmen</span></div>
          <a href="#" style={{ fontSize: 13, fontWeight: 700, color: "var(--green)", display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>Se alla →</a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr) 1.1fr", gap: 14 }} className="lb-grid">
          <style>{`@media(max-width:860px){.lb-grid{grid-template-columns:1fr!important}}`}</style>
          {matches.map((d) => {
            const color = d.pct >= 90 ? "var(--success)" : d.pct >= 80 ? "var(--green)" : "var(--amber-deep)";
            return (
              <Card key={d.name} padding="18px 20px" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar initials={d.name.split(" ").map((n) => n[0]).join("")} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>{d.name}</div><div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 2 }}>{d.loc}</div><div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 6, fontFamily: "var(--mono)", fontWeight: 600 }}>{d.lic}</div></div>
                <div style={{ fontSize: 19, fontWeight: 800, color, flexShrink: 0, fontFamily: "var(--mono)" }}>{d.pct}%</div>
              </Card>
            );
          })}
          <div style={{ background: "var(--amber)", borderRadius: "var(--r-lg)", padding: "18px 22px", display: "flex", flexDirection: "column", justifyContent: "center", color: "#fff", boxShadow: "0 4px 14px rgba(242,164,28,0.22)" }}>
            <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, letterSpacing: -1, marginBottom: 6 }}>5 662</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.45, fontWeight: 500, opacity: 0.95 }}>Förare nyanställda<br />senaste 12 månaderna</div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Marquee = () => {
  const items = ["4 080 nya tjänster att tillsätta", "Inga mellanhänder", "Inga avgifter", "Matchning baserat på körkort & kompetens", "Verifierade åkerier", "Välkomnad av Transportföretagen & SÅ", "Gratis för alla förare", "Beta-plattform i aktiv utveckling"];
  const all = [...items, ...items];
  return (
    <div style={{ background: "var(--ink-900)", borderTop: "1px solid #000", borderBottom: "1px solid #000", padding: "18px 0", overflow: "hidden" }}>
      <style>{`@keyframes mq{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <div style={{ display: "flex", animation: "mq 38s linear infinite", width: "max-content" }}>
        {all.map((it, i) => <span key={i} style={{ flexShrink: 0, padding: "0 36px", fontSize: 13, fontWeight: 600, color: "rgba(232,237,237,0.75)", display: "inline-flex", alignItems: "center", gap: 36 }}>{it}<span style={{ color: "var(--amber)", fontSize: 8 }}>●</span></span>)}
      </div>
    </div>
  );
};

const Section = ({ bg, children }) => <section style={{ background: bg, padding: "110px 32px" }}><div style={{ maxWidth: 1200, margin: "0 auto" }}>{children}</div></section>;
const Eyebrow = ({ children }) => <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--green-text)", background: "var(--green-tint)", marginBottom: 18 }}>{children}</span>;
const H2 = ({ children, style }) => <h2 style={{ fontSize: "clamp(34px, 4vw, 54px)", fontWeight: 900, letterSpacing: -1.8, lineHeight: 1.05, color: "var(--ink-900)", textWrap: "balance", ...style }}>{children}</h2>;
const Lead = ({ children, style }) => <p style={{ fontSize: 18, lineHeight: 1.7, color: "var(--ink-500)", fontWeight: 500, textWrap: "pretty", ...style }}>{children}</p>;

const Problem = () => (
  <Section bg="var(--paper)">
    <div style={{ maxWidth: 620, marginBottom: 64 }}><Eyebrow>Bakgrund</Eyebrow><H2 style={{ marginBottom: 20 }}>Branschen förtjänar bättre.</H2><Lead>Idag matchas förare och åkerier via Facebook-grupper, generiska jobbsajter och bemanningsbolag som tar en del av lönen. Det behöver inte vara så.</Lead></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }} className="p3">
      <style>{`@media(max-width:860px){.p3{grid-template-columns:1fr!important}}`}</style>
      {[{ no: "01", title: "Ingen struktur", body: "Körkort, erfarenhet och tillgänglighet begrävs i fritext och kommentarsfält. Ingen vet vem som är seriös." }, { no: "02", title: "Mellanhänder äter lönen", body: "Bemanningsbolag tar mellan 25–40 % av lönen. Föraren förlorar. Åkeriet betalar mer. Ingen vinner." }, { no: "03", title: "Bra kandidater försvinner", body: "En jobbannons lever 24 timmar på sociala medier. Rätt förare ser den aldrig. Åkeriet upprepar processen." }].map((p) => (
        <Card key={p.no} padding="36px 32px">
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--green)", letterSpacing: 2, marginBottom: 22, fontFamily: "var(--mono)" }}>{p.no}</div>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink-900)", marginBottom: 14, letterSpacing: -0.5, lineHeight: 1.2 }}>{p.title}</h3>
          <p style={{ fontSize: 14.5, color: "var(--ink-500)", lineHeight: 1.7, textWrap: "pretty" }}>{p.body}</p>
        </Card>
      ))}
    </div>
  </Section>
);

const HowItWorks = () => {
  const [tab, setTab] = useState("driver");
  const steps = {
    driver: [{ n: 1, title: "Skapa konto", body: "Registrera dig som förare på 2 minuter. Välj körkort, region och vad du söker." }, { n: 2, title: "Bygg din profil", body: "Fyll i körkort, certifikat, erfarenhet och tillgänglighet. Välj om du är synlig för åkerier." }, { n: 3, title: "Bli matchad", body: "Åkerier hittar dig automatiskt. Du kan också söka jobb direkt." }],
    company: [{ n: 1, title: "Registrera åkeri", body: "Verifiera ditt företag mot Bolagsverket. Snabbt, säkert och gratis under beta." }, { n: 2, title: "Publicera eller sök", body: "Lägg upp en jobbannons eller bläddra bland förare med rätt behörigheter." }, { n: 3, title: "Kontakta direkt", body: "Ta kontakt utan mellanhänder. Ingen provision. Ingen avgift per kontakt." }],
  };
  return (
    <section id="hur" style={{ background: "var(--paper-2)", padding: "110px 32px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}><Eyebrow>Kom igång</Eyebrow><H2 style={{ marginBottom: 16 }}>Tre steg. Det är allt.</H2><Lead style={{ maxWidth: 500, margin: "0 auto" }}>Kom igång på tre steg — oavsett om du är förare eller åkeri.</Lead></div>
        <div style={{ display: "flex", padding: 5, gap: 4, background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 12, width: "fit-content", margin: "0 auto 40px", boxShadow: "var(--sh-sm)" }}>
          {[["driver", "Jag är förare"], ["company", "Jag är ett åkeri"]].map(([k, label]) => <button key={k} onClick={() => setTab(k)} style={{ padding: "10px 24px", borderRadius: 8, background: tab === k ? "var(--green)" : "transparent", color: tab === k ? "#fff" : "var(--ink-700)", fontWeight: 600, fontSize: 13.5 }}>{label}</button>)}
        </div>
        <div style={{ marginBottom: 36, height: 340, borderRadius: "var(--r-lg)", overflow: "hidden", boxShadow: "var(--sh-md)", position: "relative", background: "var(--ink-900)" }}>
          <img key={tab} src={tab === "driver" ? "/hero-driver.webp" : "/hero-company.webp"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: tab === "driver" ? "center 62%" : "center 48%", display: "block" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "22px 26px 18px", background: "linear-gradient(to top, rgba(10,26,26,0.85) 0%, rgba(10,26,26,0) 100%)", color: "rgba(255,255,255,0.92)" }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>{tab === "driver" ? "För förare" : "För åkerier"}</div>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: "#fff" }}>{tab === "driver" ? "Hitta ditt nästa jobb — utan att jaga annonser i grupper." : "Bemanna kontoret med förare som faktiskt finns och söker."}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }} className="hw3">
          <style>{`@media(max-width:760px){.hw3{grid-template-columns:1fr!important}}`}</style>
          {steps[tab].map((s) => (
            <Card key={s.n} padding="32px 28px" style={{ position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 12, right: 22, fontSize: 80, fontWeight: 900, color: "var(--green-tint-2)", lineHeight: 1, letterSpacing: -4, fontFamily: "var(--mono)" }}>{s.n}</div>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22, fontWeight: 900, fontSize: 15, boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.2)", position: "relative", zIndex: 1 }}>{s.n}</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-900)", marginBottom: 10, letterSpacing: -0.3, position: "relative", zIndex: 1 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: "var(--ink-500)", lineHeight: 1.7, textWrap: "pretty", position: "relative", zIndex: 1 }}>{s.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQS = [
  { q: "Är STP ett bemanningsbolag?", a: "Nej. STP är inte ett bemanningsbolag. Vi möjliggör direktkontakt mellan förare och åkerier — utan mellanhänder som tar en del av lönen." },
  { q: "Kostar det något?", a: "STP är helt gratis under betafasen för alla förare och åkerier. Vi meddelar tydligt innan vi introducerar betalda funktioner." },
  { q: "Hur fungerar verifiering?", a: "Åkerier verifieras mot Bolagsverket. Förares körkort och certifikat byggs ut löpande i samarbete med branschen." },
  { q: "Vem äger min profil?", a: "Du äger din profil och styr vad som är synligt. Du kan stänga av synligheten eller radera kontot när som helst." },
  { q: "Vad skiljer STP från vanliga jobbsajter?", a: "STP är byggt specifikt för transportbranschen. Profilen utgår från körkort, segment och tillgänglighet — inte ett generiskt CV." },
];
const FAQSection = () => {
  const [open, setOpen] = useState(0);
  return (
    <section style={{ background: "var(--paper-2)", padding: "110px 32px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 64, alignItems: "start" }} className="faq2">
        <style>{`@media(max-width:760px){.faq2{grid-template-columns:1fr!important}}`}</style>
        <div style={{ position: "sticky", top: 100 }}><Eyebrow>FAQ</Eyebrow><H2 style={{ fontSize: "clamp(28px,3vw,44px)", marginBottom: 16 }}>Vanliga frågor</H2><Lead style={{ fontSize: 16, marginBottom: 26 }}>Saknar du något? Hör av dig direkt.</Lead><a href="mailto:hello@transportplattformen.se" style={{ fontSize: 14, fontWeight: 700, color: "var(--green)", textDecoration: "none" }}>hello@transportplattformen.se →</a></div>
        <div style={{ background: "var(--card)", borderRadius: "var(--r-lg)", border: "1px solid var(--line)", boxShadow: "var(--sh-sm)", overflow: "hidden" }}>
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? "1px solid var(--line)" : "none" }}>
                <button onClick={() => setOpen(isOpen ? -1 : i)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 24px", gap: 16 }}>
                  <span style={{ fontSize: 15.5, fontWeight: 700, color: "var(--ink-900)", textAlign: "left", lineHeight: 1.4 }}>{f.q}</span>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: isOpen ? "var(--green)" : "var(--paper-2)", color: isOpen ? "#fff" : "var(--ink-700)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16, fontWeight: 700 }}>{isOpen ? "−" : "+"}</span>
                </button>
                <div style={{ maxHeight: isOpen ? 240 : 0, overflow: "hidden", transition: "max-height .3s ease" }}><p style={{ fontSize: 14.5, color: "var(--ink-500)", lineHeight: 1.7, padding: "0 24px 22px", textWrap: "pretty" }}>{f.a}</p></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const CTA = () => (
  <section style={{ background: "var(--green)", padding: "100px 32px", color: "#fff" }}>
    <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 60, alignItems: "center" }} className="cta2">
      <style>{`@media(max-width:860px){.cta2{grid-template-columns:1fr!important}}`}</style>
      <div>
        <h2 style={{ fontSize: "clamp(36px, 4.5vw, 60px)", fontWeight: 900, letterSpacing: -2, lineHeight: 1.05, marginBottom: 20, color: "#fff", textWrap: "balance" }}>Sluta leta i Facebook-grupper.<br />Börja matcha rätt.</h2>
        <p style={{ fontSize: 17, lineHeight: 1.7, marginBottom: 36, color: "rgba(255,255,255,0.82)", maxWidth: 540 }}>Skapa din profil eller registrera ditt åkeri på två minuter. Helt gratis under betafasen.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Button variant="amber" size="lg" iconRight={<Icon name="arrow" size={15} stroke={2.2} />}>Skapa förarprofil</Button>
          <Button size="lg" style={{ background: "rgba(255,255,255,0.10)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", boxShadow: "none" }}>Jag är ett åkeri</Button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {[["Gratis", "Under beta"], ["Inga avgifter", "Aldrig provision"], ["2 min", "Att komma igång"], ["Verifierat", "Mot Bolagsverket"]].map(([big, sub]) => (
          <div key={big} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "var(--r-lg)", padding: "20px 22px" }}><div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.5, marginBottom: 4 }}>{big}</div><div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{sub}</div></div>
        ))}
      </div>
    </div>
  </section>
);

const Footer = () => {
  const cols = [{ title: "Plattformen", links: ["Lediga jobb", "För förare", "För åkerier", "Så fungerar STP", "Nyheter"] }, { title: "Om STP", links: ["Om oss", "Vision & roadmap", "Branschinsikter", "Blogg", "Kontakt"] }, { title: "Juridik", links: ["Användarvillkor", "Integritetspolicy"] }];
  return (
    <footer style={{ background: "var(--ink-900)", color: "rgba(255,255,255,0.6)", padding: "80px 32px 36px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 56, marginBottom: 56 }} className="ft4">
          <style>{`@media(max-width:760px){.ft4{grid-template-columns:1fr 1fr!important}}`}</style>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}><div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13 }}>S</div><span style={{ fontWeight: 800, fontSize: 17, color: "#fff", letterSpacing: 0.5 }}>STP</span></div>
            <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 280, color: "rgba(255,255,255,0.55)", marginBottom: 18 }}>Sveriges matchningsplattform för yrkesförare och transportföretag. Direkt kontakt utan mellanhänder.</p>
            <a href="mailto:hello@transportplattformen.se" style={{ fontSize: 13.5, color: "rgba(255,255,255,0.7)" }}>hello@transportplattformen.se</a>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 18 }}>{col.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>{col.links.map((l) => <a key={l} href="#" style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", textDecoration: "none" }}>{l}</a>)}</div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>© 2026 Sveriges Transportplattform AB</span>
          <div style={{ display: "flex", gap: 22 }}>{["Integritetspolicy", "Villkor", "v0.9.0"].map((l) => <a key={l} href="#" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>{l}</a>)}</div>
        </div>
      </div>
    </footer>
  );
};

export default function LandingPreview() {
  return (
    <div style={{ background: "var(--paper)", overflowX: "hidden" }}>
      <Nav />
      <Hero />
      <LiveBand />
      <Marquee />
      <Problem />
      <HowItWorks />
      <FAQSection />
      <CTA />
      <Footer />
    </div>
  );
}
