import { Link } from "react-router-dom";

/**
 * Rollspecifik inline-CTA för blogginlägg — en lugn ruta mitt i artikeln,
 * ingen popup. Återanvändbar i alla blogginlägg som använder <BlogPost>.
 *
 * Props:
 *  - role: "driver" | "company" (default "driver")
 */
const VARIANTS = {
  driver: {
    eyebrow: "För dig som kör yrkesmässigt",
    title: "Se vad åkerier betalar just nu",
    body: "Skapa en gratis förarprofil så ser du lediga jobb och vad åkerier erbjuder — utan CV och utan mellanhänder.",
    buttonLabel: "Skapa gratis förarprofil",
    to: "/registrera",
  },
  company: {
    eyebrow: "För er som rekryterar",
    title: "Hitta rätt förare direkt",
    body: "Registrera ert åkeri gratis och kontakta yrkesförare direkt — inga bemanningsbolag, inga avgifter.",
    buttonLabel: "Registrera åkeri",
    to: "/registrera",
  },
};

export default function BlogInlineCta({ role = "driver" }) {
  const v = VARIANTS[role] || VARIANTS.driver;
  return (
    <aside className="my-8 rounded-xl border border-[var(--green-tint-2)] bg-[var(--green-tint)] p-6">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--green-text)] mb-2">
        {v.eyebrow}
      </p>
      <p className="text-lg font-semibold text-slate-900 mb-1">{v.title}</p>
      <p className="text-sm text-slate-600 mb-4">{v.body}</p>
      <Link
        to={v.to}
        className="inline-block bg-[var(--color-primary)] px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
        style={{ color: "#fff" }} /* inline: globala a-regeln i index.css vinner annars över .text-white */
      >
        {v.buttonLabel} →
      </Link>
    </aside>
  );
}
