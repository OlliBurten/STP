import { Link } from "react-router-dom";

/**
 * Brödsmulor för tydlig hierarki – gör att det känns som ett verktyg.
 * items: [{ label, to? }] – sista utan to visas som nuvarande sida.
 */
export default function Breadcrumbs({ items = [], className = "" }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Brödsmulor" className={`text-sm text-slate-600 ${className}`}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-slate-400" aria-hidden>/</span>}
              {isLast || !item.to ? (
                <span className={isLast ? "font-medium text-slate-900" : "text-slate-500"}>
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className="hover:text-[var(--color-primary)] transition-colors">
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
