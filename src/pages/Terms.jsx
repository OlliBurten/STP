import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Link to="/" className="inline-block text-sm text-slate-600 hover:text-[var(--color-primary)] mb-8">
        ← Tillbaka
      </Link>
      <h1 className="text-3xl font-bold text-slate-900">Användarvillkor</h1>
      <p className="mt-2 text-slate-500">Senast uppdaterad: 2025</p>

      <div className="mt-10 prose prose-slate max-w-none space-y-6 text-slate-700">
        <section>
          <h2 className="text-xl font-semibold text-slate-900">1. Tillämpning</h2>
          <p>
            Dessa villkor gäller för användning av Sveriges Transportplattform (&quot;tjänsten&quot;). Genom att
            registrera dig eller använda tjänsten godkänner du dessa villkor.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">2. Tjänstens innehåll</h2>
          <p>
            Sveriges Transportplattform är en plattform som kopplar yrkesförare (chaufförer) och transportföretag.
            Vi tillhandahåller verktyg för att söka jobb, publicera annonser, hantera profiler och
            kommunicera mellan parter. Vi är inte arbetsgivare eller bemanningsföretag – användare
            ansvarar själva för anställningsavtal och uppdrag.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">3. Bransch, kollektivavtal och anställning</h2>
          <p>
            Tjänsten riktar sig till transportbranschen. Angivelser på plattformen om kollektivavtal,
            anställningstyp eller branschsegment (t.ex. tank, distribution) kommer från användare.
            STP verifierar inte anställningsvillkor, kollektivavtal eller arbetsrättsliga förhållanden
            – företag och sökande ansvarar själva för att uppfylla gällande lag och avtal. Vi ger inte
            juridisk rådgivning; vid tvister gäller avtal mellan arbetsgivare och arbetstagare.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">4. Användarkonto</h2>
          <p>
            Du ansvarar för att dina uppgifter är korrekta och att ditt lösenord hålls konfidentiellt.
            Du ska inte låta andra använda ditt konto. Vid misstänkt obehörig användning ska du
            omedelbart meddela oss.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">5. Användning och ansvar</h2>
          <p>
            Du ska använda tjänsten i enlighet med gällande lag och inte publicera innehåll som är
            vilseledande, olagligt eller kränkande. Vi förbehåller oss rätten att ta bort innehåll
            och avsluta konton som strider mot dessa villkor.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">6. Personuppgifter</h2>
          <p>
            Hantering av personuppgifter beskrivs i vår{" "}
            <Link to="/integritet" className="text-[var(--color-primary)] hover:underline">
              Integritetspolicy
            </Link>
            .
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">7. Ändringar</h2>
          <p>
            Vi kan uppdatera dessa villkor. Väsentliga ändringar meddelas via tjänsten eller
            e-post. Fortsatt användning efter ändring innebär godkännande.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-slate-900">7. Kontakt</h2>
          <p>
            Vid frågor om användarvillkoren, kontakta oss via informationen på webbplatsen.
          </p>
        </section>
      </div>
    </main>
  );
}
