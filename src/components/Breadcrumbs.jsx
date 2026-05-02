import { useEffect } from "react";
import { Link } from "react-router-dom";

const BASE_URL = "https://transportplattformen.se";

/**
 * Brödsmulor för tydlig hierarki – gör att det känns som ett verktyg.
 * items: [{ label, to? }] – sista utan to visas som nuvarande sida.
 */
export default function Breadcrumbs({ items = [], className = "", dark = false }) {
  useEffect(() => {
    if (items.length === 0) return;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.label,
        ...(item.to ? { item: `${BASE_URL}${item.to}` } : {}),
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "breadcrumb-jsonld";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => {
      document.getElementById("breadcrumb-jsonld")?.remove();
    };
  }, [items]);

  if (items.length === 0) return null;
  return (
    <nav aria-label="Brödsmulor" className={`text-sm ${dark ? "text-white/40" : "text-slate-600"} ${className}`}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className={dark ? "text-white/20" : "text-slate-400"} aria-hidden>/</span>}
              {isLast || !item.to ? (
                <span className={isLast ? (dark ? "font-medium text-white/70" : "font-medium text-slate-900") : (dark ? "text-white/40" : "text-slate-500")}>
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className={dark ? "hover:text-white/70 transition-colors" : "hover:text-[var(--color-primary)] transition-colors"}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
