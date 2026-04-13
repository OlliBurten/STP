import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";

export default function Kompetenslaget2025() {
  usePageTitle("Kompetensläget 2025 – Transportbranschen");
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <nav className="text-sm text-slate-600 mb-8">
        <Link to="/branschinsikter" className="hover:text-[var(--color-primary)]">← Branschinsikter</Link>
      </nav>
      <h1 className="text-3xl font-bold text-slate-900">Kompetensläget i svensk transport 2025/2026</h1>
      <p className="mt-4 text-lg text-slate-700 leading-relaxed">
        En sammanfattning av TYA Trendindikator Åkeri 2025/2026 – med fokus på rekrytering, nyanställningar och matchningsutmaningar.
      </p>
      <ul className="mt-8 space-y-2 text-slate-700 list-disc list-inside">
        <li>4 080 nya förare behövs kommande 12 månader</li>
        <li>5 662 förare nyanställdes senaste året</li>
        <li>36 % uppger rekryteringssvårigheter</li>
        <li>34 % av nyanställda har under 1 års erfarenhet</li>
      </ul>
      <p className="mt-6 text-sm text-slate-500">
        Källa: TYA Trendindikator Åkeri 2025/2026.
      </p>
      <div className="mt-10 p-6 rounded-xl bg-slate-100 border border-slate-200">
        <h2 className="font-semibold text-slate-900">Vad detta betyder för STP</h2>
        <p className="mt-2 text-slate-700 leading-relaxed">
          Det pekar på ett strukturellt behov av en gemensam digital struktur där kompetens, tillgänglighet och kvalitet blir tydliga för både förare och åkerier.
        </p>
      </div>
    </main>
  );
}
