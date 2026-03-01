import { Link } from "react-router-dom";
import Breadcrumbs from "./Breadcrumbs";

/**
 * Enhetlig sidhuvud för verktygssidor: brödsmulor (valfritt), tillbaka-länk (valfritt), titel, beskrivning.
 */
export default function PageHeader({
  breadcrumbs,
  backTo,
  backLabel = "Tillbaka",
  title,
  description,
  action,
  className = "",
}) {
  return (
    <header className={`mb-6 sm:mb-8 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} className="mb-3" />
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {backTo && (
            <Link
              to={backTo}
              className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[var(--color-primary)] mb-2"
            >
              ← {backLabel}
            </Link>
          )}
          {title && (
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {title}
            </h1>
          )}
          {description && (
            <p className="mt-2 text-slate-600">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
