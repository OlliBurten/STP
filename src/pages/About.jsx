import { Link } from "react-router-dom";

export default function About() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Om Sveriges Transportplattform</h1>
      <p className="mt-6 text-lg text-slate-600">
        Sveriges Transportplattform är en marknadsplats för yrkesförare i Sverige. Vi vill göra det enklare att
        hitta jobb och att hitta chaufförer – utan att förlita sig på ostrukturerade Facebook-grupper
        eller generiska jobbsajter.
      </p>
      <p className="mt-4 text-slate-600">
        Plattformen är byggd med fokus på transportbranschens behov: körkort (CE, C), YKB,
        fjärrkörning, lokalt, timjobb. Allt på svenska.
      </p>
      <p className="mt-4 text-slate-600">
        Vi är i utveckling. Design och funktion först – backend kommer när vi är nöjda med
        upplevelsen.
      </p>
      <div className="mt-10 flex gap-4">
        <Link
          to="/jobb"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-light)] transition-colors"
        >
          Sök jobb
        </Link>
        <Link
          to="/foretag"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
        >
          För företag
        </Link>
      </div>
    </main>
  );
}
