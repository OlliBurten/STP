import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, isDriver, isCompany } = useAuth();

  if (user) {
    if (isCompany) {
      if (!Array.isArray(user.companySegmentDefaults) || user.companySegmentDefaults.length === 0) {
        return <Navigate to="/foretag/onboarding" replace />;
      }
      return <Navigate to="/foretag" replace />;
    }
    if (isDriver) return <Navigate to="/profil" replace />;
  }

  return (
    <main>
      {/* Hero: outcome-driven headline, pain-point subheadline, primary CTA */}
      <section
        className="relative bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-primary-light)] text-white overflow-hidden"
        aria-labelledby="hero-heading"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[var(--color-accent)] rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16 lg:py-20 min-h-[70vh] flex items-center">
          <div className="max-w-3xl space-y-5 sm:space-y-6">
            {/* Clear pathways: two entry points so visitors with a clear goal don't have to scroll */}
            <p className="text-sm font-medium text-white/90">
              Jag är{" "}
              <Link
                to="/login"
                state={{ initialMode: "register", requiredRole: "company" }}
                className="underline underline-offset-2 hover:text-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-white/50 rounded"
              >
                åkeri
              </Link>
              {" · "}
              <Link
                to="/login"
                state={{ initialMode: "register", requiredRole: "driver" }}
                className="underline underline-offset-2 hover:text-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-white/50 rounded"
              >
                jag söker jobb
              </Link>
            </p>
            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]"
            >
              Få rätt chaufför till rätt jobb – direkt, utan bemanning
            </h1>
            <p className="max-w-xl text-lg sm:text-xl text-white/90">
              Slipp generiska jobbsajter och ostrukturerade grupper. DriverMatch matchar yrkesförare och åkerier med tydliga krav, verifierade konton och direktkontakt – så ni hittar varandra snabbt.
            </p>
            <div className="dm-hero-actions pt-3 sm:pt-4 flex flex-wrap gap-3">
              <Link
                to="/login"
                state={{ initialMode: "register" }}
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-8 py-3.5 rounded-xl bg-[var(--color-accent)] text-slate-900 font-semibold shadow-sm hover:bg-[var(--color-accent-dark)] hover:text-white transition-colors text-base"
              >
                Kom igång – skapa konto
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-7 py-3.5 rounded-xl border-2 border-white/50 text-white font-semibold hover:bg-white/10 transition-colors text-base"
              >
                Logga in
              </Link>
            </div>
            <p className="pt-2 text-sm text-white/85">
              Verifierade företag · Direktkontakt · Inga mellanhänder · Tydliga krav
            </p>
          </div>
        </div>
      </section>

      {/* Trust layer: what we stand for – peeks above fold (cutoff) to encourage scroll */}
      <section className="bg-slate-50/80 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <p className="text-center text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            DriverMatch är platsen där yrkesförare och transportföretag hittar varandra – med fokus på rätt kompetens, rätt region och enkel kommunikation. Vi tar inte mellanmannens roll; vi ger er strukturen så ni kan prata direkt.
          </p>
        </div>
      </section>

      {/* Feature-to-benefit: 3 columns */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-20" aria-labelledby="benefits-heading">
        <h2 id="benefits-heading" className="text-2xl sm:text-3xl font-bold text-slate-900">
          Varför DriverMatch – fördelar för yrkesförare och åkerier
        </h2>
        <div className="mt-10 grid md:grid-cols-3 gap-6 lg:gap-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold text-lg">1</div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              Hitta jobb och åkerier som passar dig
            </h3>
            <p className="mt-3 text-slate-700 leading-relaxed">
              Sök chaufförjobb efter bransch och region. Se vilka åkerier som finns – och kontakta dem även när de inte har en aktiv annons ute.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold text-lg">2</div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              Rekrytera chaufförer med rätt kompetens
            </h3>
            <p className="mt-3 text-slate-700 leading-relaxed">
              Publicera jobb med tydliga krav (körkort, certifikat, erfarenhet). Få rekommenderade förare och ta direktkontakt – utan bemanningsföretag.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold text-lg">3</div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              Direktkontakt och tydlig kommunikation
            </h3>
            <p className="mt-3 text-slate-700 leading-relaxed">
              Meddelanden och notiser i plattformen. Verifierade företag och strukturerade profiler så ni vet vad ni går till mötes.
            </p>
          </div>
        </div>
      </section>

      {/* Two audiences: För åkerier / För förare with CTAs */}
      <section className="bg-slate-50 py-16 lg:py-20" aria-labelledby="for-who-heading">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 id="for-who-heading" className="text-2xl sm:text-3xl font-bold text-slate-900">
            För åkerier och chaufförer
          </h2>
          <div className="mt-10 grid md:grid-cols-2 gap-8 items-stretch">
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 lg:p-8 flex flex-col h-full shadow-sm hover:border-[var(--color-primary)]/30 transition-colors">
              <h3 className="text-xl font-semibold text-slate-900">För åkerier</h3>
              <p className="mt-2 text-slate-600">
                Rekrytera yrkesförare till transportjobb utan mellanhänder. Publicera jobb, få rekommenderade förare och kontakta direkt.
              </p>
              <ul className="mt-4 space-y-2 text-slate-700 flex-1">
                <li>Publicera jobb med tydliga krav.</li>
                <li>Få rekommenderade förare.</li>
                <li>Kontakta direkt – ingen bemanning.</li>
              </ul>
              <div className="mt-auto pt-6">
                <Link
                  to="/login"
                  state={{ initialMode: "register", requiredRole: "company" }}
                  className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-light)] transition-colors text-base"
                >
                  Skapa åkerikonto
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 lg:p-8 flex flex-col h-full shadow-sm hover:border-[var(--color-primary)]/30 transition-colors">
              <h3 className="text-xl font-semibold text-slate-900">För chaufförer</h3>
              <p className="mt-2 text-slate-600">
                Hitta jobb hos åkerier som söker yrkesförare. Skapa profil, sök jobb och åkerier, ansök och ta kontakt direkt.
              </p>
              <ul className="mt-4 space-y-2 text-slate-700 flex-1">
                <li>Skapa profil på 1–2 minuter.</li>
                <li>Få rekommenderade jobb och hitta åkerier.</li>
                <li>Ansök och kontakta direkt.</li>
              </ul>
              <div className="mt-auto pt-6">
                <Link
                  to="/login"
                  state={{ initialMode: "register", requiredRole: "driver" }}
                  className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-light)] transition-colors text-base"
                >
                  Skapa förarkonto
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works – SEO and clarity */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-20" id="sa-fungerar-det" aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-2xl sm:text-3xl font-bold text-slate-900">
          Så fungerar DriverMatch
        </h2>
        <div className="mt-8 grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm">
            <h3 className="font-semibold text-slate-900 text-lg">Åkeri</h3>
            <ol className="mt-3 space-y-2 text-slate-700 list-decimal list-inside">
              <li>Skapa konto och verifiera företaget.</li>
              <li>Lägg upp jobb med krav (körkort, certifikat, region).</li>
              <li>Se rekommenderade förare och ta direktkontakt.</li>
            </ol>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm">
            <h3 className="font-semibold text-slate-900 text-lg">Chaufför / yrkesförare</h3>
            <ol className="mt-3 space-y-2 text-slate-700 list-decimal list-inside">
              <li>Skapa profil med körkort och erfarenhet.</li>
              <li>Se rekommenderade jobb och sök åkerier i din region.</li>
              <li>Ansök och kontakta åkerier direkt.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Final CTA – one more conversion opportunity */}
      <section className="bg-[var(--color-primary)] text-white py-14 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">Redo att komma igång?</h2>
          <p className="mt-3 text-white/90 text-lg">
            Skapa konto på några minuter. Ingen kreditkort krävs.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              state={{ initialMode: "register" }}
              className="inline-flex items-center justify-center min-h-[44px] px-8 py-3.5 rounded-xl bg-[var(--color-accent)] text-slate-900 font-semibold shadow-sm hover:bg-[var(--color-accent-dark)] hover:text-white transition-colors"
            >
              Skapa konto
            </Link>
            <Link
              to="/jobb"
              className="inline-flex items-center justify-center min-h-[44px] px-6 py-3.5 rounded-xl border-2 border-white/50 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              Bläddra jobb
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
