export default function Kontakt() {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Kontakt</h1>
      <p className="mt-4 text-slate-700">
        För frågor om Sveriges Transportplattform (STP), samverkan eller genomgång – kontakta oss.
      </p>
      <div className="mt-8 space-y-4">
        <a
          href="mailto:info@transportplattformen.se"
          className="inline-flex items-center justify-center min-h-[44px] px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-light)] transition-colors"
        >
          Mejla oss
        </a>
        <p className="text-sm text-slate-600">info@transportplattformen.se</p>
      </div>
    </main>
  );
}
