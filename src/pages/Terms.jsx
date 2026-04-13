import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";

export default function Terms() {
  usePageTitle("Användarvillkor");
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Link to="/" className="inline-block text-sm text-slate-600 hover:text-[var(--color-primary)] mb-8">
        ← Tillbaka
      </Link>
      <h1 className="text-3xl font-bold text-slate-900">Användarvillkor</h1>
      <p className="mt-2 text-slate-500">Senast uppdaterad: 7 april 2026</p>

      <div className="mt-10 space-y-8 text-slate-700">
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Om tjänsten</h2>
          <p>
            Sveriges Transportplattform ("STP", "vi", "tjänsten") är en digital plattform som kopplar
            yrkesförare och transportföretag i Sverige. Genom att registrera dig eller använda tjänsten
            godkänner du dessa villkor i sin helhet.
          </p>
          <p className="mt-2">
            STP är inte ett bemanningsföretag eller arbetsgivare. Vi tillhandahåller verktyg för att
            söka jobb, publicera annonser, hantera profiler och kommunicera — ansvaret för
            anställningsavtal och uppdrag ligger helt på parterna.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Konton och registrering</h2>
          <p>
            Du måste vara minst 18 år och ange korrekta uppgifter vid registrering. Du ansvarar för
            att hålla ditt lösenord konfidentiellt och för all aktivitet som sker via ditt konto.
            Vid misstänkt obehörig åtkomst ska du omedelbart kontakta oss på{" "}
            <a href="mailto:support@transportplattformen.se" className="text-[var(--color-primary)] hover:underline">
              support@transportplattformen.se
            </a>
            .
          </p>
          <p className="mt-2">
            Vi förbehåller oss rätten att kräva e-postverifiering och, för företagskonton, manuell
            verifiering innan full åtkomst ges.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Förares ansvar</h2>
          <p>
            Som förare ansvarar du för att uppgifter om körkort, certifikat och erfarenhet är korrekta
            och aktuella. Felaktiga uppgifter kan leda till att ditt konto stängs. Du ansvarar för att
            du uppfyller gällande krav för de tjänster du söker.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Företags ansvar</h2>
          <p>
            Som företag ansvarar du för att jobbannonser är korrekta, lagliga och inte vilseledande.
            Angivna uppgifter om kollektivavtal, anställningsvillkor och lön är ditt ansvar — STP
            verifierar inte dessa. Du förbinder dig att följa tillämplig arbetsrätt och diskrimineringslagstiftning.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Förbjudet innehåll</h2>
          <p>Det är inte tillåtet att via tjänsten:</p>
          <ul className="mt-2 list-disc list-inside space-y-1 text-slate-600">
            <li>Publicera falsk, vilseledande eller diskriminerande information</li>
            <li>Kontakta användare i reklamerings- eller spamsyfte</li>
            <li>Dela andras personuppgifter utan tillstånd</li>
            <li>Automatiserat skrapa eller samla data från plattformen</li>
            <li>Försöka kringgå säkerhetsfunktioner eller autentisering</li>
          </ul>
          <p className="mt-2">
            Överträdelser kan leda till omedelbar kontostängning och eventuell polisanmälan.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Immateriella rättigheter</h2>
          <p>
            Plattformens design, kod och varumärke tillhör Sveriges Transportplattform. Du ger oss
            en begränsad licens att visa och förmedla det innehåll du publicerar i syfte att
            tillhandahålla tjänsten.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Ansvarsbegränsning</h2>
          <p>
            STP ansvarar inte för innehållet i jobbannonser eller förarprofiler, för avtal som ingås
            mellan förare och företag, eller för direkta eller indirekta skador som uppstår till följd
            av användningen av tjänsten. Vi garanterar inte kontinuerlig tillgänglighet av tjänsten.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Kontoavstängning och radering</h2>
          <p>
            Du kan när som helst radera ditt konto via din profil, vilket raderar all din persondata
            omedelbart. Vi förbehåller oss rätten att stänga konton som bryter mot dessa villkor,
            utan föregående varning vid allvarliga överträdelser.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Personuppgifter</h2>
          <p>
            Hantering av personuppgifter beskrivs i vår{" "}
            <Link to="/integritet" className="text-[var(--color-primary)] hover:underline">
              Integritetspolicy
            </Link>
            , som är en del av dessa villkor.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Tillämplig lag och tvist</h2>
          <p>
            Dessa villkor regleras av svensk lag. Tvister ska i första hand lösas genom dialog.
            Om vi inte kan nå en överenskommelse avgörs tvisten av allmän domstol med Stockholms
            tingsrätt som första instans.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">11. Ändringar</h2>
          <p>
            Vi kan uppdatera dessa villkor. Väsentliga ändringar meddelas via e-post minst 30 dagar
            i förväg. Fortsatt användning av tjänsten efter ikraftträdandet innebär att du godkänner
            de nya villkoren.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">12. Kontakt</h2>
          <p>
            Frågor om användarvillkoren:{" "}
            <a href="mailto:support@transportplattformen.se" className="text-[var(--color-primary)] hover:underline">
              support@transportplattformen.se
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
