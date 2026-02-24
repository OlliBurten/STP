import { useProfile } from "../context/ProfileContext";
import { LocationIcon } from "./Icons";

export default function ProfilePreview({ compact = false }) {
  const { profile } = useProfile();

  const formatYearRange = (exp) => {
    if (exp.current) return `${exp.startYear || "?"} – nu`;
    return `${exp.startYear || "?"} – ${exp.endYear || "?"}`;
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        <span className="font-medium text-slate-900">{profile.name}</span>
        <span className="text-slate-600">
          {profile.licenses?.join(", ")} • {profile.certificates?.join(", ")}
        </span>
        <span className="text-slate-600">{profile.region}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{profile.name}</h2>
          <p className="text-slate-600 flex items-center gap-1"><LocationIcon className="w-4 h-4 shrink-0" /> {profile.location}, {profile.region}</p>
                <p className="text-slate-600">{profile.email}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {profile.licenses?.map((l) => (
            <span
              key={l}
              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
            >
              {l}
            </span>
          ))}
          {profile.certificates?.map((c) => (
            <span
              key={c}
              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
            >
              {c}
            </span>
          ))}
        </div>

        {profile.summary && (
          <p className="text-sm text-slate-700">{profile.summary}</p>
        )}

        {profile.experience?.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-900 mb-2">Erfarenhet</h3>
            <ul className="space-y-2">
              {profile.experience.map((exp) => (
                <li key={exp.id} className="text-sm">
                  <span className="font-medium">{exp.role}</span> @ {exp.company}{" "}
                  <span className="text-slate-600">({formatYearRange(exp)})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
