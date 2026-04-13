import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ChevronDownIcon } from "./Icons";

export default function OrgSwitcher({ className = "" }) {
  const { userOrgs, activeOrg, switchOrg } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!userOrgs.length) return null;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
      >
        <span className="max-w-[160px] truncate">{activeOrg?.name || "Välj åkeri"}</span>
        {activeOrg?.status === "PENDING" && (
          <span className="text-amber-600 text-xs">• Väntar</span>
        )}
        <ChevronDownIcon className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 min-w-[220px] rounded-xl border border-slate-200 bg-white shadow-lg z-50 py-1">
          {userOrgs.map((org) => (
            <button
              key={org.id}
              type="button"
              onClick={() => { switchOrg(org.id); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors ${
                org.id === activeOrg?.id ? "font-semibold text-[var(--color-primary)]" : "text-slate-700"
              }`}
            >
              <span className="truncate">{org.name}</span>
              {org.id === activeOrg?.id && (
                <span className="ml-2 text-xs text-[var(--color-primary)] shrink-0">Aktiv</span>
              )}
              {org.status === "PENDING" && org.id !== activeOrg?.id && (
                <span className="ml-2 text-xs text-amber-600 shrink-0">Väntar</span>
              )}
            </button>
          ))}
          <div className="border-t border-slate-100 mt-1 pt-1">
            <Link
              to="/foretag/lagg-till-akeri"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[var(--color-primary)] hover:bg-slate-50 transition-colors font-medium"
            >
              + Lägg till åkeri
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
