import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Link to="/" className="inline-block text-sm text-slate-600 hover:text-[var(--color-primary)] mb-8">
        ← Tillbaka
      </Link>
      <h1 className="text-3xl font-bold text-slate-900">Integritetspolicy</h1>
      <p className="mt-2 text-slate-500">Senast uppdaterad: 2025</p>

      <div className="mt-10 prose prose-slate max-w-none space-y-6 text-slate-700">
        <section>
          <h2 className="text-xl font-semibold text-slate-900">1. Personuppgiftsansvarig</h2>
          <p>
            Sveriges Transportplattform är personuppgiftsansvarig för den behandling av personuppgifter som sker
            inom ramen för tjänsten. Kontaktuppgifter finns på webbplatsen.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">2. Vilka uppgifter vi samlar in</h2>
          <p>
            Vi behandlar uppgifter du anger vid registrering och i din profil, t.ex. namn, e-post,
            telefon, adress/region, körkort, certifikat, arbetslivserfarenhet och meddelanden du
            skickar via plattformen. För företag kan vi även behandla företagsnamn och
            kontaktuppgifter.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">3. Ändamål och rättslig grund</h2>
          <p>
            Uppgifterna används för att tillhandahålla tjänsten (matchning, meddelanden, profiler),
            för att uppfylla avtal med dig och vid behov för våra berättigade intressen (säkerhet,
            förbättring av tjänsten). Vi kan använda e-post för att skicka viktiga meddelanden om
            tjänsten (t.ex. nya meddelanden eller ansökningar).
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">4. Delning av uppgifter</h2>
          <p>
            Uppgifter i din profil delas enligt dina val (t.ex. synlighet för företag) och med
            andra användare när du ansöker eller chattar. Vi delar inte dina uppgifter med tredje
            part för marknadsföring utan ditt samtycke. Vi kan använda underleverantörer (t.ex.
            drift av servrar) som behandlar uppgifter på våra vägnar.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">5. Lagring och radering</h2>
          <p>
            Vi lagrar uppgifter så länge ditt konto är aktivt och därefter i den utsträckning lag
            eller avtal kräver. Du kan när som helst begära åtkomst, rättelse eller radering av
            dina uppgifter; kontakta oss eller använd inställningar i tjänsten där det finns.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">6. Dina rättigheter</h2>
          <p>
            Enligt GDPR har du rätt till åtkomst, rättelse, radering, begränsning av behandling
            och dataportabilitet, samt att invända mot vissa behandlingar. Du har rätt att lämna
            klagomål till tillsynsmyndigheten (Integritetsskyddsmyndigheten i Sverige).
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900" id="cookies">7. Cookies</h2>
          <p>
            Vi använder nödvändiga cookies för att tjänsten ska fungera, t.ex. för inloggning och
            sessionshantering. Dessa behövs för att du ska kunna använda plattformen och lagras
            enligt gällande lag. Vi använder inte marknadsförings- eller spårningscookies utan ditt
            uttryckliga samtycke. Du kan ställa in din webbläsare så att den begränsar eller
            avvisar cookies; vissa funktioner kan då inte fungera.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">8. Säkerhet och ändringar</h2>
          <p>
            Vi arbetar för att skydda dina uppgifter med lämpliga tekniska och organisatoriska
            åtgärder. Denna policy kan uppdateras; senaste versionen finns på denna sida.
          </p>
        </section>
      </div>
    </main>
  );
}
