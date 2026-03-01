import { SpinnerIcon } from "./Icons";

/**
 * Konsistent laddningsindikator för verktygskänsla – använd på listor, formulär och detaljsidor.
 */
export default function LoadingBlock({ message = "Laddar...", className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 text-slate-500 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <SpinnerIcon className="w-8 h-8" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
