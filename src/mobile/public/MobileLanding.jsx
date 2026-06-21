// STP Mobile — public landing. Ported from STP Mobil Landing, wired to real
// routes. The prototype's external hero image + Sweden-map SVG assets aren't in
// the repo, so the hero uses the gradient layers and the map uses city dots.
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MobileShell from "../MobileShell";
import { Icon } from "../ui";
import { SWE_LAN_PATHS, SWE_VIEW } from "../../data/swedenGeo";
import { CITY_XY } from "../../data/swedenCityCoords";

const AMBER = "var(--amber-bright)";

function useNav() {
  const navigate = useNavigate();
  return {
    register: (role) => navigate(`/registrera${role ? `?role=${role}` : ""}`),
    login: () => navigate("/login?start=login"),
    jobs: () => navigate("/jobb"),
    jobsCity: (c) => navigate(`/jobb?stad=${encodeURIComponent(c)}`),
    jobsRegion: (r) => navigate(`/jobb?region=${encodeURIComponent(r)}`),
    home: () => navigate("/"),
  };
}

const Eyebrow = ({ children, onDark }) => (
  <span style={{ display: "inline-block", padding: "6px 13px", borderRadius: 999, fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", background: onDark ? "rgba(255,255,255,0.1)" : "var(--green-tint)", color: onDark ? "#fff" : "var(--green-text)" }}>{children}</span>
);
const Logo = ({ light }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.2)" }}>S</div>
    <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.3, color: light ? "#fff" : "var(--ink-900)" }}>STP</span>
  </div>
);
const BtnAmber = ({ children, onClick, full }) => (
  <button onClick={onClick} className="press" style={{ width: full ? "100%" : "auto", height: 58, padding: "0 24px", borderRadius: 15, background: AMBER, color: "#1a1200", fontWeight: 800, fontSize: 16.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 8px 22px rgba(242,164,28,0.3)" }}>{children}</button>
);
const BtnGreen = ({ children, onClick, full }) => (
  <button onClick={onClick} className="press" style={{ width: full ? "100%" : "auto", height: 58, padding: "0 24px", borderRadius: 15, background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: 16.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 8px 22px rgba(31,95,92,0.28)" }}>{children}</button>
);
const BtnGhost = ({ children, onClick, onDark }) => (
  <button onClick={onClick} className="press" style={{ width: "100%", height: 58, padding: "0 24px", borderRadius: 15, background: onDark ? "rgba(255,255,255,0.08)" : "var(--card)", border: `1px solid ${onDark ? "rgba(255,255,255,0.25)" : "var(--line-2)"}`, color: onDark ? "#fff" : "var(--ink-900)", fontWeight: 700, fontSize: 16.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>{children}</button>
);

const CITIES = ["Stockholm", "Göteborg", "Malmö", "Linköping", "Norrköping", "Jönköping", "Helsingborg", "Västerås", "Örebro", "Uppsala", "Sundsvall", "Umeå", "Luleå", "Gävle", "Borås"];
const REGIONS = ["Stockholm", "Skåne", "Västra Götaland", "Halland", "Östergötland", "Jönköping", "Kronoberg", "Kalmar", "Blekinge", "Södermanland", "Örebro", "Västmanland", "Dalarna", "Värmland", "Uppsala"];
const PROBLEMS = [
  ["01", "Ingen struktur", "Körkort, erfarenhet och tillgänglighet begrävs i fritext och kommentarsfält. Ingen vet vem som är seriös."],
  ["02", "Mellanhänder äter lönen", "Bemanningsbolag tar mellan 25–40 % av lönen. Föraren förlorar. Åkeriet betalar mer. Ingen vinner."],
  ["03", "Bra kandidater försvinner", "En jobbannons lever 24 timmar på sociala medier. Rätt förare ser den aldrig."],
];
const FEATURES = [
  ["user", "Smart matchning", "Matchas baserat på körkort, region, segment och tillgänglighet."],
  ["building", "Verifierade åkerier", "Åkerier verifieras mot Bolagsverket. Förare ser bara seriösa aktörer."],
  ["msg", "Direktkontakt", "Inga mellanhänder. Inga provisioner. Förare och åkeri pratar direkt."],
  ["eye", "Du styr din synlighet", "Som förare bestämmer du om du är synlig och vem som ser din profil."],
];
const SEGMENTS = [
  ["building", "FAST ANSTÄLLNING", "Heltid", "Långsiktig roll. Visa erfarenhet, behörigheter och vad du söker."],
  ["cal", "FLEXIBELT", "Vikariat / Deltid", "Hoppa in snabbt — extrapass, deltid eller kortare uppdrag."],
  ["star", "UTBILDNING", "Praktik", "Elever, nybörjare och de i start av karriären som söker seriösa aktörer."],
];
const FAQS = [
  ["Är STP ett bemanningsbolag?", "Nej. STP möjliggör direktkontakt mellan förare och åkerier — utan mellanhänder som tar en del av lönen."],
  ["Kostar det något?", "För förare är STP alltid gratis. Åkerier kommer igång gratis och betalar först för utökade funktioner."],
  ["Hur fungerar verifiering?", "Åkerier verifieras mot Bolagsverket med F-skattsedel och trafiktillstånd."],
  ["Vem äger min profil?", "Du. Din profil är din — du styr vad som visas och kan ta bort den när du vill."],
];
const STEPS = {
  forare: { label: "FÖR FÖRARE", tag: "Hitta ditt nästa jobb — utan att jaga annonser i grupper.", items: [["Skapa konto", "Registrera dig som förare på 2 minuter."], ["Bygg din profil", "Fyll i körkort, certifikat och tillgänglighet."], ["Bli matchad", "Åkerier hittar dig automatiskt. Du kan också söka jobb direkt."]] },
  akeri: { label: "FÖR ÅKERIER", tag: "Hitta rätt förare — verifierade och redo att köra.", items: [["Registrera åkeri", "Koppla ert organisationsnummer — vi hämtar uppgifterna automatiskt."], ["Publicera & sök", "Lägg upp jobb eller sök proaktivt bland verifierade förare."], ["Anställ", "Hantera ansökningar i en tydlig pipeline. Ingen provision."]] },
};

function Menu({ open, onClose, nav, openPage }) {
  if (!open) return null;
  const explore = [
    ["search", "Lediga jobb", nav.jobs], ["truck", "För förare", () => openPage("forforare")],
    ["building", "För åkerier", () => openPage("forakerier")], ["cap", "Praktik & APL", () => openPage("praktik")],
    ["heart", "Om STP", () => openPage("omstp")], ["mail", "Kontakt", () => openPage("kontakt")],
  ];
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(8,12,11,0.55)", animation: "stpm-fade-in .2s" }} />
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "86%", maxWidth: 340, background: "var(--night)", display: "flex", flexDirection: "column", animation: "stpm-menu-in .3s cubic-bezier(.32,.72,0,1)", boxShadow: "-20px 0 50px rgba(0,0,0,0.4)", paddingTop: "var(--stpm-safe-top)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px" }}>
          <Logo light />
          <button onClick={onClose} className="press" style={{ width: 42, height: 42, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff" }}><Icon name="x" size={20} /></button>
        </div>
        <div className="app-scroll" style={{ flex: 1, overflowY: "auto", padding: "14px 20px 20px" }}>
          {explore.map(([ic, t, fn]) => (
            <button key={t} onClick={() => { onClose(); fn(); }} className="press" style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", padding: "14px 4px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <Icon name={ic} size={20} color="var(--green-soft)" stroke={1.9} /><span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: "#fff" }}>{t}</span><Icon name="chevRight" size={17} color="rgba(255,255,255,0.35)" />
            </button>
          ))}
        </div>
        <div style={{ padding: "16px 20px calc(24px + var(--stpm-safe-bottom))", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button onClick={() => { onClose(); nav.register(); }} className="press" style={{ width: "100%", height: 54, borderRadius: 14, background: AMBER, color: "#1a1200", fontWeight: 800, fontSize: 16, marginBottom: 11 }}>Skapa konto</button>
          <button onClick={() => { onClose(); nav.login(); }} className="press" style={{ width: "100%", height: 54, borderRadius: 14, background: "transparent", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontWeight: 700, fontSize: 16 }}>Logga in</button>
        </div>
      </div>
    </div>
  );
}

const MAP_CITIES = [["Stockholm", true], ["Göteborg", true], ["Malmö", true], ["Sundsvall", false], ["Umeå", false], ["Luleå", false], ["Örebro", false], ["Jönköping", false]];

function PageShell({ title, children, onClose }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 80, background: "var(--paper)", display: "flex", flexDirection: "column", animation: "stpm-menu-in .3s cubic-bezier(.32,.72,0,1)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "15px 16px", borderBottom: "1px solid var(--line)", background: "var(--card)", flexShrink: 0, paddingTop: "calc(15px + var(--stpm-safe-top))" }}>
        <button onClick={onClose} className="press" style={{ width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper-2)", border: "1px solid var(--line-2)" }}><Icon name="chevLeft" size={22} color="var(--ink-800)" /></button>
        <span style={{ fontSize: 17, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3 }}>{title}</span>
      </div>
      <div className="app-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>{children}</div>
    </div>
  );
}
function PageHero({ eyebrow, title, sub, grad }) {
  return (
    <div style={{ padding: "40px 22px 38px", background: grad || "linear-gradient(160deg,#1f5f5c,#154240)", color: "#fff", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(110% 80% at 80% 10%,rgba(242,164,28,0.16),transparent 58%)" }} />
      <div style={{ position: "relative" }}>
        <Eyebrow onDark>{eyebrow}</Eyebrow>
        <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.06, margin: "16px 0 14px", textWrap: "balance" }}>{title}</h1>
        <p style={{ fontSize: 16.5, lineHeight: 1.55, color: "rgba(255,255,255,0.82)", maxWidth: 320 }}>{sub}</p>
      </div>
    </div>
  );
}
const BenefitList = ({ items }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    {items.map(([ic, t, d]) => (
      <div key={t} style={{ background: "var(--card)", borderRadius: 18, padding: "20px 18px", boxShadow: "var(--sh-sm)", border: "1px solid var(--line)", display: "flex", gap: 15 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={ic} size={21} color="var(--green)" stroke={1.9} /></div>
        <div><h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, marginBottom: 5 }}>{t}</h3><p style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--ink-500)" }}>{d}</p></div>
      </div>
    ))}
  </div>
);

const MAIL = "mailto:hello@transportplattformen.se";
const SUBPAGES = {
  forforare: { title: "För förare", hero: ["För förare", "Ditt nästa körjobb — utan mellanhänder.", "Bygg en profil som visar dina behörigheter. Bli hittad av seriösa åkerier — eller sök själv. Alltid gratis.", "linear-gradient(160deg,#3a4b40,#1B2421)"], benefits: [["star", "Alltid gratis", "STP är och förblir kostnadsfritt för dig som förare."], ["user", "Du äger din profil", "Körkort, certifikat och erfarenhet samlat på ett ställe."], ["building", "Bara verifierade åkerier", "Åkerier kontrolleras mot Bolagsverket."], ["search", "Matchning på det som räknas", "Du matchas på körkortsklass, behörigheter och region."], ["msg", "Direktkontakt", "Prata direkt med åkeriet. Inga bemanningsbolag emellan."]], cta: ["forare", "Skapa förarprofil"] },
  forakerier: { title: "För åkerier", hero: ["För åkerier", "Hitta rätt förare — verifierade och redo att köra.", "Sök proaktivt bland förare i er region eller publicera jobb. Ingen provision."], benefits: [["search", "Sök bland verifierade förare", "Filtrera på körkort, behörigheter och region."], ["doc", "Publicera jobb gratis", "Kom igång utan kostnad."], ["msg", "Ingen provision", "Ni betalar aldrig en del av lönen."], ["building", "Tydlig pipeline", "Hantera ansökningar i ett enkelt flöde."], ["shield", "Bygg ert arbetsgivarvarumärke", "En verifierad företagsprofil med omdömen."]], cta: ["akeri", "Registrera åkeri"] },
  praktik: { title: "Praktik & APL", hero: ["Praktik & APL", "För elever, skolor och blivande förare.", "STP kopplar ihop elever och praktikanter med seriösa åkerier som tar emot APL.", "linear-gradient(160deg,#7a5418,#3a2a0c)"], benefits: [["cap", "För dig som studerar", "Söker du APL-plats eller ditt första jobb? Skapa en profil."], ["building", "För åkerier som handleder", "Ta emot praktikanter och bygg upp framtidens förare."], ["star", "Seriösa aktörer", "Alla åkerier på STP är verifierade."]], cta: ["forare", "Skapa profil"] },
  omstp: { title: "Om STP", hero: ["Om STP", "Transportbranschen förtjänar en ärlig plattform.", "STP byggs för att förare och åkerier ska hitta varandra direkt — utan mellanhänder som tar en del av lönen."], benefits: [["heart", "Förarens sida", "Föraren ska aldrig betala för att bli sedd. Gratis, alltid."], ["shield", "Kvalitet före kvantitet", "Vi släpper hellre in färre, verifierade åkerier."], ["msg", "Transparens", "Direkt kontakt, tydliga villkor och inga dolda avgifter."]], cta: ["forare", "Kom igång gratis"] },
  kontakt: { title: "Kontakt", hero: ["Kontakt", "Hör av dig direkt.", "STP drivs av en liten oberoende grund – du når oss direkt.", "linear-gradient(160deg,#154240,#0d2a28)"], benefits: [["mail", "E-post", "hello@transportplattformen.se — vi svarar oftast inom ett dygn."]], cta: ["forare", "Skapa konto"] },
};

function SubPage({ id, onClose, nav }) {
  const p = SUBPAGES[id];
  if (!p) return null;
  return (
    <PageShell title={p.title} onClose={onClose}>
      <PageHero eyebrow={p.hero[0]} title={p.hero[1]} sub={p.hero[2]} grad={p.hero[3]} />
      <div style={{ padding: "32px 22px 40px" }}>
        <BenefitList items={p.benefits} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 30 }}>
          <BtnGreen full onClick={() => (id === "kontakt" ? (window.location.href = MAIL) : nav.register(p.cta[0]))}>{p.cta[1]} <Icon name="arrow" size={19} color="#fff" stroke={2.4} /></BtnGreen>
          <BtnGhost onClick={nav.jobs}>Se lediga jobb</BtnGhost>
        </div>
      </div>
    </PageShell>
  );
}

export default function MobileLanding() {
  const nav = useNav();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [page, setPage] = useState(null);
  const [who, setWho] = useState("forare");
  const [faq, setFaq] = useState(0);
  const scRef = useRef(null);
  const stepsRef = useRef(null);
  const s = STEPS[who];

  return (
    <MobileShell>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", paddingTop: "calc(16px + var(--stpm-safe-top))", background: scrolled ? "rgba(245,242,236,0.92)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none", borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent", transition: "background .25s,border-color .25s" }}>
        <Logo light={!scrolled} />
        <button onClick={() => setMenu(true)} className="press" style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", color: scrolled ? "var(--ink-800)" : "#fff", filter: scrolled ? "none" : "drop-shadow(0 1px 3px rgba(0,0,0,0.45))" }}><Icon name="menu" size={24} stroke={2.2} /></button>
      </div>

      <div ref={scRef} className="app-scroll" onScroll={(e) => setScrolled(e.target.scrollTop > 30)} style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {/* HERO */}
        <section style={{ position: "relative", minHeight: 660, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 22px 40px", overflow: "hidden", background: "linear-gradient(160deg,#2a3a37 0%,var(--asphalt) 45%,var(--night) 100%)" }}>
          <img src="/hero.webp" alt="Lastbil på svensk landsväg" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(15,21,19,0.15)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(15,21,19,0.94) 0%,rgba(15,21,19,0.45) 42%,rgba(15,21,19,0.25) 70%,rgba(15,21,19,0.5) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 70% at 80% 12%,rgba(242,164,28,0.18) 0%,transparent 55%)" }} />
          <div style={{ position: "relative" }}>
            <h1 style={{ fontSize: 56, fontWeight: 800, letterSpacing: -2, lineHeight: 0.98, marginBottom: 22, textShadow: "0 2px 30px rgba(0,0,0,0.4)" }}>
              <span style={{ color: "#fff", display: "block" }}>Rätt jobb.</span>
              <span style={{ color: AMBER, display: "block" }}>Rätt förare.</span>
              <span style={{ color: "rgba(255,255,255,0.6)", display: "block" }}>Direkt.</span>
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.5, color: "rgba(255,255,255,0.85)", marginBottom: 28, maxWidth: 330 }}>Sveriges matchningsplattform för yrkesförare och åkerier. Inga mellanhänder, inga avgifter.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <BtnAmber full onClick={nav.jobs}>Se lediga jobb <Icon name="arrow" size={19} color="#1a1200" stroke={2.4} /></BtnAmber>
              <BtnGhost onDark onClick={() => nav.register("akeri")}>Jag är ett åkeri</BtnGhost>
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section style={{ background: "var(--paper)", padding: "54px 22px 56px" }}>
          <Eyebrow>Bakgrund</Eyebrow>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.05, margin: "18px 0 16px" }}>Branschen förtjänar bättre.</h2>
          <p style={{ fontSize: 17, lineHeight: 1.55, color: "var(--ink-500)", marginBottom: 36 }}>Idag matchas förare och åkerier via Facebook-grupper och bemanningsbolag som tar en del av lönen. Det behöver inte vara så.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {PROBLEMS.map(([n, t, d]) => (
              <div key={n} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 20, padding: "26px 22px", boxShadow: "var(--sh-sm)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--mono)", color: "var(--green)", letterSpacing: 2, marginBottom: 16 }}>{n}</div>
                <h3 style={{ fontSize: 23, fontWeight: 800, letterSpacing: -0.5, marginBottom: 11 }}>{t}</h3>
                <p style={{ fontSize: 15.5, lineHeight: 1.55, color: "var(--ink-500)" }}>{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SOLUTION */}
        <section style={{ background: "var(--paper-2)", padding: "54px 22px 56px", borderTop: "1px solid var(--line)" }}>
          <Eyebrow>Lösningen</Eyebrow>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.05, margin: "18px 0 16px" }}>En samlande plattform för hela branschen.</h2>
          <p style={{ fontSize: 17, lineHeight: 1.55, color: "var(--ink-600)", marginBottom: 28 }}>STP samlar förare och åkerier i en transparent och kvalitetssäkrad plattform. Direkt kontakt. Inga avgifter.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
            <BtnGreen full onClick={() => nav.register("forare")}>Skapa förarprofil <Icon name="arrow" size={19} color="#fff" stroke={2.4} /></BtnGreen>
            <BtnGhost onClick={() => nav.register("akeri")}>Registrera åkeri</BtnGhost>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {FEATURES.map(([ic, t, d]) => (
              <div key={t} style={{ background: "var(--card)", borderRadius: 20, padding: "22px 20px", boxShadow: "var(--sh-sm)", display: "flex", gap: 16 }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={ic} size={22} color="var(--green)" stroke={1.9} /></div>
                <div><h3 style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.3, marginBottom: 6 }}>{t}</h3><p style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--ink-500)" }}>{d}</p></div>
              </div>
            ))}
          </div>
        </section>

        {/* STEPS */}
        <section ref={stepsRef} style={{ background: "var(--paper)", padding: "54px 22px 56px" }}>
          <div style={{ textAlign: "center", marginBottom: 26 }}>
            <Eyebrow>Kom igång</Eyebrow>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.05, margin: "16px 0 12px" }}>Tre steg. Det är allt.</h2>
          </div>
          <div style={{ display: "flex", gap: 5, padding: 5, background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 14, maxWidth: 330, margin: "0 auto 30px" }}>
            {[["forare", "Jag är förare"], ["akeri", "Jag är ett åkeri"]].map(([id, l]) => (
              <button key={id} onClick={() => setWho(id)} className="press" style={{ flex: 1, height: 44, borderRadius: 10, fontSize: 14.5, fontWeight: 700, background: who === id ? "var(--green)" : "transparent", color: who === id ? "#fff" : "var(--ink-500)" }}>{l}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {s.items.map(([t, d], i) => (
              <div key={i} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, padding: "18px 20px", boxShadow: "var(--sh-sm)" }}>
                <h3 style={{ fontSize: 18.5, fontWeight: 800, letterSpacing: -0.4, marginBottom: 6 }}>{t}</h3><p style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--ink-500)" }}>{d}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 30 }}>
            <p style={{ fontSize: 15.5, lineHeight: 1.5, color: "var(--ink-600)", maxWidth: 300, margin: "0 auto 18px" }}>{s.tag}</p>
            <button className="press" onClick={() => nav.register(who)} style={{ height: 52, padding: "0 30px", borderRadius: 14, background: "var(--green)", color: "#fff", fontSize: 16, fontWeight: 700, boxShadow: "var(--sh-md)" }}>Kom igång gratis</button>
          </div>
        </section>

        {/* MAP */}
        <section style={{ background: "var(--night)", padding: "54px 22px 58px", color: "#fff" }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase", color: "#7fc0bb", marginBottom: 13 }}>I hela landet</div>
          <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1.1, lineHeight: 1.06, marginBottom: 12, maxWidth: 300 }}>Förare behövs överallt</h2>
          <p style={{ fontSize: 16.5, lineHeight: 1.5, color: "rgba(255,255,255,0.7)", marginBottom: 22, maxWidth: 310 }}>Från Skåne till Norrbotten dyker det upp nya uppdrag hos verifierade åkerier.</p>
          <div style={{ display: "flex", justifyContent: "center", margin: "6px 0 26px" }}>
            <svg viewBox={`${SWE_VIEW.x} ${SWE_VIEW.y} ${SWE_VIEW.w} ${SWE_VIEW.h}`} preserveAspectRatio="xMidYMid meet" style={{ width: 232, height: "auto", overflow: "visible" }}>
              {Object.keys(SWE_LAN_PATHS).map((code) => (
                <path key={code} d={SWE_LAN_PATHS[code]} fill="rgba(122,205,184,0.09)" stroke="rgba(150,220,200,0.22)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
              ))}
              {MAP_CITIES.filter(([n]) => CITY_XY[n]).map(([n, big], i) => {
                const { x, y } = CITY_XY[n];
                const col = big ? AMBER : "var(--green-soft)";
                const r = big ? 8 : 5.5;
                return (
                  <g key={n} onClick={() => nav.jobsCity(n)} style={{ cursor: "pointer" }}>
                    <circle cx={x} cy={y} r={r} fill={col} opacity="0.18">
                      <animate attributeName="r" values={`${r};${r + 16};${r + 16}`} dur="2.8s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.55;0;0" dur="2.8s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
                    </circle>
                    <circle cx={x} cy={y} r={r} fill={col} stroke="var(--night)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
                  </g>
                );
              })}
              {MAP_CITIES.filter(([n, big]) => big && CITY_XY[n]).map(([n]) => {
                const { x, y } = CITY_XY[n];
                const right = x > SWE_VIEW.w / 2;
                return (
                  <text key={n + "-l"} x={x + (right ? -16 : 16)} y={y + 2} textAnchor={right ? "end" : "start"} dominantBaseline="middle" fill="#fff" fontWeight="800" fontSize="22" fontFamily="var(--font)" style={{ paintOrder: "stroke" }} stroke="var(--night)" strokeWidth="5">{n}</text>
                );
              })}
            </svg>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button onClick={nav.jobs} className="press" style={{ display: "inline-flex", alignItems: "center", gap: 10, height: 56, padding: "0 26px", borderRadius: 15, background: "rgba(242,164,28,0.08)", border: `1px solid ${AMBER}`, color: AMBER, fontWeight: 700, fontSize: 16 }}>Se lediga jobb i din region <Icon name="arrow" size={18} color={AMBER} stroke={2.2} /></button>
          </div>
        </section>

        {/* SEGMENTS */}
        <section style={{ background: "var(--paper-2)", padding: "54px 22px 56px", borderTop: "1px solid var(--line)" }}>
          <Eyebrow>Tre vägar in</Eyebrow>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.05, margin: "18px 0 16px" }}>Alla förare söker inte samma sak.</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
            {SEGMENTS.map(([ic, tag, t, d]) => (
              <div key={t} style={{ background: "var(--card)", borderRadius: 20, padding: "24px 22px", boxShadow: "var(--sh-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={ic} size={20} color="var(--green)" stroke={1.9} /></div>
                  <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.2, color: "var(--ink-400)" }}>{tag}</span>
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, marginBottom: 9 }}>{t}</h3>
                <p style={{ fontSize: 15.5, lineHeight: 1.55, color: "var(--ink-500)" }}>{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section style={{ background: "var(--paper)", padding: "54px 22px 56px" }}>
          <Eyebrow>FAQ</Eyebrow>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.05, margin: "18px 0 18px" }}>Vanliga frågor</h2>
          <div style={{ background: "var(--card)", borderRadius: 20, boxShadow: "var(--sh-sm)", overflow: "hidden" }}>
            {FAQS.map(([q, a], i) => {
              const on = faq === i;
              return (
                <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <button onClick={() => setFaq(on ? -1 : i)} className="press" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, width: "100%", textAlign: "left", padding: "20px 20px" }}>
                    <span style={{ fontSize: 16.5, fontWeight: 700, color: "var(--ink-900)", lineHeight: 1.3 }}>{q}</span>
                    <span style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: on ? "var(--green)" : "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={on ? "minus" : "plus"} size={16} color={on ? "#fff" : "var(--ink-600)"} stroke={2.4} /></span>
                  </button>
                  {on && <div style={{ padding: "0 20px 20px" }}><p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-500)" }}>{a}</p></div>}
                </div>
              );
            })}
          </div>
        </section>

        {/* FINAL CTA */}
        <section style={{ background: "var(--green)", padding: "56px 22px 60px", color: "#fff" }}>
          <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1.4, lineHeight: 1.05, marginBottom: 18 }}>Sluta leta i Facebook-grupper. Börja matcha rätt.</h2>
          <p style={{ fontSize: 17, lineHeight: 1.5, color: "rgba(255,255,255,0.8)", marginBottom: 28 }}>Skapa din profil eller registrera ditt åkeri på två minuter.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <BtnAmber full onClick={() => nav.register("forare")}>Skapa förarprofil <Icon name="arrow" size={19} color="#1a1200" stroke={2.4} /></BtnAmber>
            <BtnGhost onDark onClick={() => nav.register("akeri")}>Jag är ett åkeri</BtnGhost>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background: "var(--night)", padding: "44px 22px calc(34px + var(--stpm-safe-bottom))", color: "#fff" }}>
          <Logo light />
          <p style={{ fontSize: 15, lineHeight: 1.55, color: "rgba(255,255,255,0.65)", margin: "16px 0 24px", maxWidth: 320 }}>Sveriges matchningsplattform för yrkesförare och transportföretag.</p>
          <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.5, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>JOBB PER STAD</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 16px", marginBottom: 24 }}>{CITIES.map((c) => <a key={c} onClick={() => nav.jobsCity(c)} className="press" style={{ fontSize: 14.5, color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>{c}</a>)}</div>
          <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.5, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>JOBB PER REGION</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 16px", marginBottom: 24 }}>{REGIONS.map((r) => <a key={r} onClick={() => nav.jobsRegion(r)} className="press" style={{ fontSize: 14.5, color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>{r}</a>)}</div>
          <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "6px 0 22px" }} />
          <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)" }}>© 2026 Sveriges Transportplattform</p>
        </footer>
      </div>

      <Menu open={menu} onClose={() => setMenu(false)} nav={nav} openPage={(id) => { setMenu(false); setPage(id); }} />
      {page && <SubPage id={page} onClose={() => setPage(null)} nav={nav} />}
    </MobileShell>
  );
}
