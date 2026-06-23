import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";

export const DOCS = {
  terms: {
    title: "Användarvillkor",
    updated: "Senast uppdaterad 16 maj 2026",
    sections: [
      {
        id: "om", h: "1. Om tjänsten",
        p: ['Sveriges Transportplattform ("STP", "vi", "tjänsten") är en digital plattform som kopplar yrkesförare och transportföretag i Sverige. Genom att registrera dig eller använda tjänsten godkänner du dessa villkor i sin helhet.', "STP är inte ett bemanningsföretag eller arbetsgivare. Vi tillhandahåller verktyg för att söka jobb, publicera annonser, hantera profiler och kommunicera — ansvaret för anställningsavtal och uppdrag ligger helt på parterna."],
      },
      {
        id: "konton", h: "2. Konton och registrering",
        p: ["Du måste vara minst 18 år och ange korrekta uppgifter vid registrering. Du ansvarar för att hålla ditt lösenord konfidentiellt och för all aktivitet som sker via ditt konto.", "Vi förbehåller oss rätten att kräva e-postverifiering och, för företagskonton, verifiering av organisationsnummer (automatiskt mot Bolagsverket, eller manuellt vid behov) innan full åtkomst ges."],
      },
      {
        id: "forare", h: "3. Förares ansvar",
        p: ["Som förare ansvarar du för att uppgifter om körkort, certifikat och erfarenhet är korrekta och aktuella. Felaktiga uppgifter kan leda till att ditt konto stängs. Du ansvarar för att du uppfyller gällande krav för de tjänster du söker."],
      },
      {
        id: "foretag", h: "4. Företags ansvar",
        p: ["Som företag ansvarar du för att jobbannonser är korrekta, lagliga och inte vilseledande. Angivna uppgifter om kollektivavtal, anställningsvillkor och lön är ditt ansvar — STP verifierar inte dessa. Du förbinder dig att följa tillämplig arbetsrätt och diskrimineringslagstiftning."],
      },
      {
        id: "forbjudet", h: "5. Förbjudet innehåll",
        p: ["Det är inte tillåtet att via tjänsten:"],
        li: ["Publicera falsk, vilseledande eller diskriminerande information", "Kontakta användare i reklamerings- eller spamsyfte", "Dela andras personuppgifter utan tillstånd", "Automatiserat skrapa eller samla data från plattformen", "Försöka kringgå säkerhetsfunktioner eller autentisering"],
      },
      {
        id: "ansvar", h: "6. Ansvarsbegränsning",
        p: ["STP ansvarar inte för innehållet i jobbannonser eller förarprofiler, för avtal som ingås mellan förare och företag, eller för direkta eller indirekta skador som uppstår till följd av användningen av tjänsten."],
      },
      {
        id: "beta", h: "7. Beta-tjänst",
        p: ["STP befinner sig i beta-fas. Det innebär att funktioner kan förändras, läggas till eller tas bort utan föregående varning. Tjänsten tillhandahålls kostnadsfritt under beta-perioden. Vi förbehåller oss rätten att introducera betalda funktioner i framtiden, med minst 30 dagars förvarning via e-post."],
      },
      {
        id: "radering", h: "8. Kontoavstängning och radering",
        p: ["Du kan när som helst radera ditt konto via din profil, vilket raderar all din persondata omedelbart. Vi förbehåller oss rätten att stänga konton som bryter mot dessa villkor, utan föregående varning vid allvarliga överträdelser."],
      },
      {
        id: "lag", h: "9. Tillämplig lag och tvist",
        p: ["Dessa villkor regleras av svensk lag. Tvister ska i första hand lösas genom dialog. Om vi inte kan nå en överenskommelse avgörs tvisten av allmän domstol med Stockholms tingsrätt som första instans."],
      },
      {
        id: "kontakt", h: "10. Kontakt",
        p: ["Frågor om användarvillkoren: support@transportplattformen.se"],
      },
    ],
  },
  privacy: {
    title: "Integritetspolicy",
    updated: "Senast uppdaterad 16 maj 2026",
    sections: [
      {
        id: "ansvarig", h: "1. Personuppgiftsansvarig",
        p: ["Sveriges Transportplattform är personuppgiftsansvarig för den behandling av personuppgifter som sker inom ramen för tjänsten. Kontakt: dataskydd@transportplattformen.se"],
      },
      {
        id: "insamling", h: "2. Vilka uppgifter vi samlar in",
        p: ["Vi behandlar uppgifter du anger vid registrering och i din profil:"],
        li: ["Namn och e-postadress", "Telefonnummer (frivilligt)", "Region och bostadsort", "Körkortsbehörigheter och certifikat (för förare)", "Arbetslivserfarenhet och profilinformation (för förare)", "Företagsnamn och organisationsnummer (för företag)", "Meddelanden som skickas via plattformen", "Tekniska uppgifter: IP-adress (för anonym statistik), inloggningstidpunkt"],
      },
      {
        id: "andamal", h: "3. Ändamål och rättslig grund",
        p: ["Tillhandahålla tjänsten (avtal) — matchning, meddelanden, profiler och jobbpublicering.", "Säkerhet och förbättring (berättigat intresse) — felövervakning, skydd mot missbruk och förbättring av plattformen.", "Kommunikation (avtal) — notiser om nya meddelanden, ansökningar och kontouppgifter. Vi skickar inte marknadsföringsmail utan ditt samtycke."],
      },
      {
        id: "delning", h: "4. Delning av uppgifter",
        p: ["Din profildata delas enligt dina egna inställningar — t.ex. syns din förarprofil för företag bara om du aktiverat synligheten. Vi delar aldrig dina uppgifter med tredje part för marknadsföring.", "Din persondata lagras inom EU — databasen finns i Amsterdam (Nederländerna). Vi använder följande underleverantörer: Railway (hosting och databas, EU), Vercel (frontend), Resend (e-post), Sentry (felövervakning) och PostHog (produktanalys, EU — endast efter samtycke). Vi har ingått databehandlaravtal med samtliga i enlighet med GDPR artikel 28, och eventuell överföring utanför EU sker med giltiga skyddsmekanismer (standardavtalsklausuler/DPF)."],
      },
      {
        id: "lagring", h: "5. Lagring och radering",
        p: ["Vi lagrar dina uppgifter så länge ditt konto är aktivt. Du kan när som helst radera ditt konto via inställningar — all persondata raderas då omedelbart och permanent.", "Meddelanden i konversationer bevaras i 12 månader efter kontots radering, varefter de raderas automatiskt."],
      },
      {
        id: "rattigheter", h: "6. Dina rättigheter (GDPR)",
        p: ["Enligt GDPR har du rätt att:"],
        li: ["Få tillgång till dina personuppgifter", "Rätta felaktiga uppgifter (direkt via din profil)", "Radera ditt konto och all tillhörande data (direkt via tjänsten)", "Begränsa behandling av dina uppgifter", "Dataportabilitet — begär ut dina uppgifter via dataskydd@transportplattformen.se", "Invända mot behandling baserad på berättigat intresse", "Lämna klagomål till Integritetsskyddsmyndigheten (IMY)"],
      },
      {
        id: "cookies", h: "7. Cookies",
        p: ["Nödvändiga cookies — krävs för att tjänsten ska fungera (inloggning, sessionshantering). Kräver inget samtycke.", "Samtyckesbaserade — aktiveras endast om du accepterar i cookie-bannern: Sentry (felövervakning) och PostHog (produktanalys och anonymiserade sessionsinspelningar där känsliga fält som lösenord alltid maskeras). Datan lagras inom EU.", "Cookiefri besöksstatistik (Plausible) används för aggregerad trafikmätning och kräver inget samtycke."],
      },
      {
        id: "sakerhet", h: "8. Säkerhet",
        p: ["Vi skyddar dina uppgifter med krypterad dataöverföring (HTTPS), hashade lösenord, JWT-baserad autentisering med kort giltighetstid, och löpande säkerhetsövervakning."],
      },
      {
        id: "andringar", h: "9. Ändringar i policyn",
        p: ["Vid väsentliga ändringar informerar vi dig via e-post eller tydligt meddelande i tjänsten. Senaste versionen finns alltid på denna sida."],
      },
    ],
  },
};

export default function Terms({ defaultDoc = "terms" }) {
  const [doc, setDoc] = useState(defaultDoc);
  const navigate = useNavigate();
  const d = DOCS[doc];

  usePageTitle(d.title);

  const switchDoc = (key) => {
    setDoc(key);
    navigate(key === "terms" ? "/anvandarvillkor" : "/integritet", { replace: true });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      {/* Sub-nav — doc switcher (the global app header already provides the STP logo + main nav) */}
      <div style={{ background: "var(--card)", borderBottom: "1px solid var(--line)", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)" }}>Juridik</span>
          <div style={{ display: "flex", gap: 4, background: "var(--card-2)", padding: 4, borderRadius: 10, border: "1px solid var(--line-2)" }}>
            {[["terms", "Villkor"], ["privacy", "Integritet"]].map(([k, l]) => (
              <button
                key={k}
                onClick={() => switchDoc(k)}
                style={{ padding: "7px 16px", borderRadius: 7, fontSize: "var(--text-sm)", fontWeight: 600, background: doc === k ? "var(--green)" : "transparent", color: doc === k ? "#fff" : "var(--ink-700)", border: "none", cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="legal-grid">
        {/* TOC sidebar */}
        <nav className="legal-toc" style={{ position: "sticky", top: 88 }}>
          <div style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)", marginBottom: 12 }}>Innehåll</div>
          {d.sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              style={{ display: "block", fontSize: "var(--text-sm)", color: "var(--ink-600)", padding: "7px 0 7px 14px", borderLeft: "2px solid var(--line)", textDecoration: "none", lineHeight: 1.4 }}
            >
              {s.h}
            </a>
          ))}
        </nav>

        {/* Document */}
        <div>
          <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid var(--line)" }}>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: "var(--ink-900)", letterSpacing: -1.4, marginBottom: 8 }}>{d.title}</h1>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-500)" }}>{d.updated}</p>
          </div>
          <div className="doc">
            {d.sections.map((s) => (
              <section key={s.id} id={s.id}>
                <h2>{s.h}</h2>
                {s.p.map((para, i) => <p key={i}>{para}</p>)}
                {s.li && (
                  <ul style={{ paddingLeft: 22, marginBottom: 14 }}>
                    {s.li.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
