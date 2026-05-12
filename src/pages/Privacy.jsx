import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";

export default function Privacy() {
  usePageTitle("Integritetspolicy");
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Link to="/" className="inline-block text-sm text-slate-600 hover:text-[var(--color-primary)] mb-8">
        ← Tillbaka
      </Link>
      <h1 className="text-3xl font-bold text-slate-900">Integritetspolicy</h1>
      <p className="mt-2 text-slate-500">Senast uppdaterad: 7 april 2026</p>

      <div className="mt-10 space-y-8 text-slate-700">
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Personuppgiftsansvarig</h2>
          <p>
            Sveriges Transportplattform är personuppgiftsansvarig för den behandling av personuppgifter
            som sker inom ramen för tjänsten.
          </p>
          <p className="mt-2">
            <strong>Kontakt:</strong>{" "}
            <a href="mailto:support@transportplattformen.se" className="text-[var(--color-primary)] hover:underline">
              support@transportplattformen.se
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Vilka uppgifter vi samlar in</h2>
          <p>Vi behandlar uppgifter du anger vid registrering och i din profil:</p>
          <ul className="mt-2 list-disc list-inside space-y-1 text-slate-600">
            <li>Namn och e-postadress</li>
            <li>Telefonnummer (frivilligt)</li>
            <li>Region och bostadsort</li>
            <li>Körkortsbehörigheter och certifikat (för förare)</li>
            <li>Arbetslivserfarenhet och profilinformation (för förare)</li>
            <li>Företagsnamn och organisationsnummer (för företag)</li>
            <li>Meddelanden som skickas via plattformen</li>
            <li>Tekniska uppgifter: IP-adress (för anonym statistik), inloggningstidpunkt</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Ändamål och rättslig grund</h2>
          <div className="space-y-3">
            <p><strong>Tillhandahålla tjänsten</strong> (avtal) — matchning, meddelanden, profiler och jobbpublicering.</p>
            <p><strong>Säkerhet och förbättring</strong> (berättigat intresse) — felövervakning, skydd mot missbruk och förbättring av plattformen.</p>
            <p><strong>Kommunikation</strong> (avtal) — notiser om nya meddelanden, ansökningar och kontouppgifter. Vi skickar inte marknadsföringsmail utan ditt samtycke.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Delning av uppgifter</h2>
          <p>
            Din profildata delas enligt dina egna inställningar — t.ex. syns din förarprofil för företag
            bara om du aktiverat synligheten. Vi delar aldrig dina uppgifter med tredje part för
            marknadsföring.
          </p>
          <p className="mt-3">Vi använder följande underleverantörer (databehandlare) som behandlar data på våra vägnar:</p>
          <ul className="mt-2 list-disc list-inside space-y-1 text-slate-600">
            <li><strong>Vercel</strong> — hosting av frontend (USA/EU, Standard Contractual Clauses)</li>
            <li><strong>Railway</strong> — databashosting (USA, SCC)</li>
            <li><strong>Resend</strong> — e-postutskick (USA, SCC)</li>
            <li><strong>Sentry</strong> — felövervakning, anonymiserad (USA, SCC)</li>
          </ul>
          <p className="mt-3 text-sm text-slate-500">
            Vi har ingått databehandlaravtal (DPA) med samtliga ovanstående leverantörer i enlighet med GDPR artikel 28.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Lagring och radering</h2>
          <p>
            Vi lagrar dina uppgifter så länge ditt konto är aktivt. Du kan när som helst radera ditt
            konto via inställningar i tjänsten — all persondata raderas då omedelbart och permanent.
          </p>
          <p className="mt-2">
            Meddelanden i konversationer kan innehålla uppgifter om motparten och bevaras i 12 månader
            efter kontots radering för att motparten ska ha tillgång till sin kommunikationshistorik,
            varefter de raderas automatiskt.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Dina rättigheter (GDPR)</h2>
          <p>Du har rätt att:</p>
          <ul className="mt-2 list-disc list-inside space-y-1 text-slate-600">
            <li><strong>Få tillgång</strong> till dina personuppgifter</li>
            <li><strong>Rätta</strong> felaktiga uppgifter (direkt via din profil)</li>
            <li><strong>Radera</strong> ditt konto och all tillhörande data (direkt via tjänsten)</li>
            <li><strong>Begränsa</strong> behandling av dina uppgifter</li>
            <li><strong>Dataportabilitet</strong> — begär ut dina uppgifter i maskinläsbart format</li>
            <li><strong>Invända</strong> mot behandling baserad på berättigat intresse</li>
          </ul>
          <p className="mt-3">
            För att utöva dina rättigheter, kontakta oss på{" "}
            <a href="mailto:support@transportplattformen.se" className="text-[var(--color-primary)] hover:underline">
              support@transportplattformen.se
            </a>
            . Vi svarar inom 30 dagar. Du har även rätt att lämna klagomål till{" "}
            <a href="https://www.imy.se" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">
              Integritetsskyddsmyndigheten (IMY)
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3" id="cookies">7. Cookies</h2>
          <p>
            Vi använder <strong>endast nödvändiga cookies</strong> för att tjänsten ska fungera —
            t.ex. för inloggning och sessionshantering. Vi använder inga marknadsförings-,
            spårnings- eller analyskakor från tredje part. Inga cookies kräver ditt samtycke
            eftersom de är tekniskt nödvändiga.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Säkerhet</h2>
          <p>
            Vi skyddar dina uppgifter med krypterad dataöverföring (HTTPS), hashade lösenord,
            JWT-baserad autentisering med kort giltighetstid, och löpande säkerhetsövervakning.
            Åtkomst till persondata begränsas till personal med dokumenterat behov.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Ändringar i policyn</h2>
          <p>
            Vid väsentliga ändringar informerar vi dig via e-post eller tydligt meddelande i tjänsten.
            Senaste versionen finns alltid på denna sida.
          </p>
        </section>
      </div>
    </main>
  );
}
