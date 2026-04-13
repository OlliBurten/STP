import { releaseNotes } from "../lib/releaseNotes";
import { usePageTitle } from "../hooks/usePageTitle";

export default function PatchNotes() {
  usePageTitle("Uppdateringar & nyheter");
  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--color-primary)] ring-1 ring-slate-200">
            Produktuppdateringar
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900">
            Vad är nytt
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Här visar vi bara ändringar som är viktiga för förare och företag.
          </p>
        </div>

        <div className="mt-10 space-y-6">
          {releaseNotes.map((note) => (
            <article key={note.version} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-primary)]">{note.version}</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">{note.title}</h2>
                </div>
                <p className="text-sm text-slate-500">{note.date}</p>
              </div>
              <ul className="mt-5 space-y-3 text-sm sm:text-base text-slate-700">
                {note.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
