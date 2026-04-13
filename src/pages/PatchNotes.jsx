import { releaseNotes, CURRENT_VERSION } from "../lib/releaseNotes";
import { usePageTitle } from "../hooks/usePageTitle";

export default function PatchNotes() {
  usePageTitle("Uppdateringar & nyheter");
  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--color-primary)] ring-1 ring-slate-200">
            Senaste version: {CURRENT_VERSION}
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900">
            Vad är nytt
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Vi uppdaterar STP löpande. Här samlar vi de förändringar som märks för dig som förare eller åkeri.
          </p>
        </div>

        <div className="mt-10 space-y-6">
          {releaseNotes.map((note, index) => (
            <article key={note.version} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className={`px-6 pt-6 pb-5 border-b border-slate-100 ${index === 0 ? "bg-[var(--color-primary)]/[0.03]" : ""}`}>
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${index === 0 ? "bg-[var(--color-primary)] text-white" : "bg-slate-100 text-slate-600"}`}>
                      {note.version}
                    </span>
                    {index === 0 && (
                      <span className="inline-flex rounded-full bg-green-100 text-green-700 px-2.5 py-1 text-xs font-medium">
                        Senaste
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">{note.date}</p>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-slate-900">{note.title}</h2>
              </div>
              <ul className="px-6 py-5 space-y-3">
                {note.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-slate-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" aria-hidden="true" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-slate-400">
          Har du feedback eller hittade något som inte stämmer?{" "}
          <a href="mailto:hej@transportplattformen.se" className="text-[var(--color-primary)] hover:underline">
            Hör av dig
          </a>
        </p>
      </section>
    </main>
  );
}
