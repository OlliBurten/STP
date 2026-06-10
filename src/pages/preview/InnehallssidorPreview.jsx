/* PROOF — Om / Blogg / Kontakt, från "STP Innehållssidor Ljust.html". Route: /preview/innehallssidor */
import { useState } from "react";
import { Card, Pill, Button, Icon, Avatar } from "../../components/ui";

const POSTS = [
  { id: 1, cat: "Branschinsikt", title: "Förarbristen i siffror: 5 662 nya förare på ett år", excerpt: "Transportbranschen byter generation. Vi tittar på vad datan säger om rekryteringsläget 2026.", date: "12 maj 2026", read: "4 min" },
  { id: 2, cat: "Nyheter", title: "STP välkomnas av Transportföretagen", excerpt: "Branschorganisationerna ställer sig bakom en gemensam, mellanhandsfri plattform.", date: "3 maj 2026", read: "2 min" },
  { id: 3, cat: "Guide", title: "Så bygger du en förarprofil som åkerier hittar", excerpt: "Körkort, certifikat och tillgänglighet — det här gör att du syns i sök.", date: "28 apr 2026", read: "5 min" },
];

const NavBar = ({ go, active }) => (
  <nav style={{ background: "var(--card)", borderBottom: "1px solid var(--line)", position: "sticky", top: 0, zIndex: 50 }}>
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
      <button onClick={() => go("om")} style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13 }}>S</div><span style={{ fontWeight: 800, fontSize: 17, color: "var(--ink-900)", letterSpacing: 0.5 }}>STP</span></button>
      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
        {[["om", "Om STP"], ["blogg", "Blogg"], ["kontakt", "Kontakt"]].map(([k, l]) => <button key={k} onClick={() => go(k)} style={{ fontSize: 14, fontWeight: active === k || (active === "artikel" && k === "blogg") ? 700 : 500, color: active === k || (active === "artikel" && k === "blogg") ? "var(--green)" : "var(--ink-700)" }}>{l}</button>)}
        <Button variant="primary" size="sm">Kom igång</Button>
      </div>
    </div>
  </nav>
);

const Container = ({ children, style }) => <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px", ...style }}>{children}</div>;

const Om = () => (
  <div>
    <div style={{ background: "var(--paper)", padding: "72px 0 48px" }}>
      <Container style={{ maxWidth: 720 }}>
        <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--green-text)", background: "var(--green-tint)", marginBottom: 18 }}>Om STP</span>
        <h1 style={{ fontSize: 44, fontWeight: 900, color: "var(--ink-900)", letterSpacing: -2, lineHeight: 1.05, marginBottom: 20 }}>Branschens egen plattform — byggd av branschen.</h1>
        <p style={{ fontSize: 18, color: "var(--ink-500)", lineHeight: 1.7 }}>STP grundades för att lösa ett problem alla i transport känner igen: förare och åkerier hittar inte varandra utan dyra mellanhänder. Vi bygger en plattform där de möts direkt.</p>
      </Container>
    </div>
    <Container style={{ paddingTop: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 48 }}>
        {[["2 847", "Användare"], ["629", "Åkerier"], ["0 kr", "Provision"]].map(([v, l]) => <Card key={l} padding="26px 28px"><div style={{ fontSize: 34, fontWeight: 800, color: "var(--green)", fontFamily: "var(--mono)", letterSpacing: -1 }}>{v}</div><div style={{ fontSize: 13.5, color: "var(--ink-500)", marginTop: 6, fontWeight: 600 }}>{l}</div></Card>)}
      </div>
      <div style={{ maxWidth: 680 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.6, marginBottom: 16 }}>Vår vision</h2>
        <p style={{ fontSize: 17, color: "var(--ink-700)", lineHeight: 1.75, marginBottom: 18, textWrap: "pretty" }}>Att bli branschstandarden för transport — en plats där varje yrkesförare har en levande yrkesidentitet, och varje åkeri hittar rätt folk utan att betala en mellanhand.</p>
        <p style={{ fontSize: 17, color: "var(--ink-700)", lineHeight: 1.75, textWrap: "pretty" }}>Vi tror att bra chaufförer förtjänar bra villkor, och att seriösa åkerier förtjänar att hitta dem direkt. Inga provisioner, ingen otydlighet.</p>
      </div>
    </Container>
  </div>
);

const Kontakt = () => (
  <Container style={{ paddingTop: 64 }}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }}>
      <div>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1.5, marginBottom: 14 }}>Hör av dig</h1>
        <p style={{ fontSize: 16, color: "var(--ink-500)", lineHeight: 1.7, marginBottom: 28 }}>Frågor, feedback eller vill du veta mer? Vi svarar oftast samma dag.</p>
        {[["mail", "E-post", "hello@transportplattformen.se"], ["msg", "Support", "Vardagar 08–17"], ["pin", "Kontor", "Malmö, Sverige"]].map(([ic, l, v]) => (
          <div key={l} style={{ display: "flex", gap: 13, alignItems: "center", marginBottom: 16 }}>
            <span style={{ width: 42, height: 42, borderRadius: 11, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={ic} size={18} color="var(--green-text)" stroke={2} /></span>
            <div><div style={{ fontSize: 12.5, color: "var(--ink-500)", fontWeight: 600 }}>{l}</div><div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-900)" }}>{v}</div></div>
          </div>
        ))}
      </div>
      <Card padding="28px 30px">
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)", marginBottom: 18 }}>Skicka ett meddelande</div>
        {["Namn", "E-post"].map((l) => <label key={l} style={{ display: "block", marginBottom: 16 }}><span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-700)", display: "block", marginBottom: 8 }}>{l}</span><input style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "var(--card-2)", border: "1px solid var(--line-2)", fontSize: 14.5, color: "var(--ink-900)", outline: "none", fontFamily: "var(--font)" }} /></label>)}
        <label style={{ display: "block", marginBottom: 18 }}><span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-700)", display: "block", marginBottom: 8 }}>Meddelande</span><textarea rows={4} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "var(--card-2)", border: "1px solid var(--line-2)", fontSize: 14.5, color: "var(--ink-900)", outline: "none", fontFamily: "var(--font)", lineHeight: 1.5, resize: "vertical" }} /></label>
        <Button variant="primary" size="md" full iconRight={<Icon name="arrow" size={14} stroke={2.2} />}>Skicka</Button>
      </Card>
    </div>
  </Container>
);

const Blogg = ({ go }) => (
  <Container style={{ paddingTop: 64 }}>
    <h1 style={{ fontSize: 38, fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1.5, marginBottom: 8 }}>Blogg</h1>
    <p style={{ fontSize: 16, color: "var(--ink-500)", marginBottom: 36 }}>Insikter, nyheter och guider från transportbranschen.</p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }} className="bg3">
      <style>{`@media(max-width:860px){.bg3{grid-template-columns:1fr!important}}`}</style>
      {POSTS.map((p) => (
        <button key={p.id} onClick={() => go("artikel")} style={{ textAlign: "left", display: "block" }}>
          <Card padding="0" style={{ overflow: "hidden", height: "100%" }}>
            <div style={{ height: 140, background: "linear-gradient(135deg, var(--green-tint) 0%, var(--paper-2) 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="truck" size={32} color="var(--green-soft)" stroke={1.6} /></div>
            <div style={{ padding: "18px 20px" }}>
              <Pill tone="soft" size="sm">{p.cat}</Pill>
              <h3 style={{ fontSize: 16.5, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, lineHeight: 1.3, margin: "12px 0 8px" }}>{p.title}</h3>
              <p style={{ fontSize: 13.5, color: "var(--ink-500)", lineHeight: 1.55, marginBottom: 14, textWrap: "pretty" }}>{p.excerpt}</p>
              <div style={{ fontSize: 12, color: "var(--ink-400)", fontWeight: 600 }}>{p.date} · {p.read}</div>
            </div>
          </Card>
        </button>
      ))}
    </div>
  </Container>
);

const Artikel = ({ go }) => (
  <Container style={{ paddingTop: 40 }}>
    <button onClick={() => go("blogg")} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "var(--ink-500)", marginBottom: 24 }}><Icon name="arrowLeft" size={14} stroke={2} />Tillbaka till bloggen</button>
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <Pill tone="soft" size="sm">Branschinsikt</Pill>
      <h1 style={{ fontSize: 38, fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1.2, lineHeight: 1.1, margin: "16px 0 16px" }}>Förarbristen i siffror: 5 662 nya förare på ett år</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "var(--ink-500)", marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid var(--line)" }}>
        <Avatar initials="ST" size={36} color="var(--ink-700)" /><span style={{ fontWeight: 600, color: "var(--ink-700)" }}>STP Redaktion</span><span>·</span><span>12 maj 2026</span><span>·</span><span>4 min läsning</span>
      </div>
      {[
        ["", "Transportbranschen står inför ett generationsskifte. Under de senaste tolv månaderna har 5 662 nya lastbilsförare börjat arbeta — men behovet är fortfarande större än tillgången."],
        ["En bransch i förändring", "36 % av åkerierna uppger att de inte hittar tillräckligt med förare. Samtidigt går en stor del av dagens förare i pension inom det närmaste decenniet. Matematiken går inte ihop utan nya, effektivare sätt att koppla ihop förare och arbetsgivare."],
        ["", "Det är precis det här gapet STP bygger för att stänga — genom direktmatchning, utan mellanhänder som tar en del av lönen."],
        ["Vad datan säger", "Flest nya förare återfinns i storstadsregionerna, medan bristen är som störst i Norrland. Geografin spelar roll — och det är därför vi byggt en talangkarta som visar exakt var förarna finns."],
      ].map(([h, p], i) => (
        <div key={i}>
          {h && <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.5, margin: "36px 0 14px" }}>{h}</h2>}
          <p style={{ fontSize: 17, lineHeight: 1.75, color: "var(--ink-700)", marginBottom: 20, textWrap: "pretty" }}>{p}</p>
        </div>
      ))}
    </div>
  </Container>
);

const Footer = () => (
  <footer style={{ background: "var(--ink-900)", color: "rgba(255,255,255,0.6)", padding: "48px 32px 32px", marginTop: 64 }}>
    <Container style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}><div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 11 }}>S</div><span style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>STP</span></div>
        <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 260 }}>Sveriges matchningsplattform för yrkesförare och transportföretag.</p>
      </div>
      <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
        {[["Plattform", ["Lediga jobb", "För förare", "För åkerier"]], ["Om", ["Om STP", "Blogg", "Kontakt"]], ["Juridik", ["Användarvillkor", "Integritetspolicy"]]].map(([t, links]) => <div key={t}><div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 14 }}>{t}</div>{links.map((l) => <a key={l} href="#" style={{ display: "block", fontSize: 13.5, color: "rgba(255,255,255,0.65)", marginBottom: 9, textDecoration: "none" }}>{l}</a>)}</div>)}
      </div>
    </Container>
  </footer>
);

export default function InnehallssidorPreview() {
  const [page, setPage] = useState("om");
  const go = (p) => { setPage(p); window.scrollTo(0, 0); };
  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <NavBar go={go} active={page} />
      {page === "om" && <Om />}
      {page === "kontakt" && <Kontakt />}
      {page === "blogg" && <Blogg go={go} />}
      {page === "artikel" && <Artikel go={go} />}
      <Footer />
    </div>
  );
}
