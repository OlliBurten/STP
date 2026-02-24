import { Link } from "react-router-dom";

export default function Branschinsikter() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Branschinsikter</h1>
      <p className="mt-4 text-lg text-slate-700">
        Sammanställningar och statistik kring kompetensläget i svensk transport. Innehåll byggs ut utifrån tillgängliga källor som TYA Trendindikator Åkeri.
      </p>
      <ul className="mt-8 space-y-4">
        <li>
          <Link
            to="/branschinsikter/kompetenslaget-2025"
            className="text-[var(--color-primary)] font-medium hover:underline"
          >
            Kompetensläget 2025/2026
          </Link>
          <p className="text-sm text-slate-600 mt-1">Nyckeltal om rekryteringsbehov och matchningsutmaningar.</p>
        </li>
      </ul>
    </main>
  );
}
