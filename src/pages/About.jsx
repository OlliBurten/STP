import { Link } from "react-router-dom";

export default function About() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Om Sveriges Transportplattform</h1>
      <p className="mt-6 text-lg text-slate-600">
        Sveriges Transportplattform finns för att göra matchningen mellan förare och åkerier snabbare,
        tydligare och mer relevant.
      </p>
      <p className="mt-4 text-slate-600">
        I stället för ostrukturerade Facebook-trådar och generiska jobbsajter samlar vi jobb,
        kompetens, behörigheter och tillgänglighet i ett format som passar transportbranschen.
      </p>
      <p className="mt-4 text-slate-600">
        Vårt fokus i launchfasen är enkelt: hjälpa seriösa åkerier att hitta rätt förare och hjälpa
        förare att hitta relevanta jobb med mindre brus och bättre träffsäkerhet.
      </p>
      <div className="mt-10 flex gap-4">
        <Link
          to="/jobb"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-light)] transition-colors"
        >
          Se lediga jobb
        </Link>
        <Link
          to="/for-akerier"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
        >
          För åkerier
        </Link>
      </div>
    </main>
  );
}
