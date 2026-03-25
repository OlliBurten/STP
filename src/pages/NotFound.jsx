import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <section className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
        <p className="text-sm font-semibold text-slate-500">404</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Sidan kunde inte hittas
        </h1>
        <p className="text-slate-600">
          Länken du öppnade finns inte eller har flyttats.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-light)] transition-colors"
          >
            Till startsidan
          </Link>
          <Link
            to="/jobb"
            className="inline-flex items-center justify-center px-5 py-3 rounded-lg border border-slate-300 text-slate-700 font-medium hover:border-slate-400 transition-colors"
          >
            Se lediga jobb
          </Link>
        </div>
      </section>
    </main>
  );
}
