import { useEffect, useState } from "react";
import { updateNotificationSettings } from "../../api/profile.js";

const SETTINGS = [
  { key: "profileReminder", label: "Profilpåminnelser", desc: "Påminnelse när din profil inte är komplett." },
  { key: "jobMatch", label: "Jobbmatchningar", desc: "När nya jobb som matchar din profil publiceras." },
  { key: "messageReminder", label: "Obesvarade meddelanden", desc: "Påminnelse när du har ett meddelande som väntar på svar." },
  { key: "inactivity", label: "Inaktivitetspåminnelse", desc: "Om du inte loggat in på 30 dagar." },
];

export default function NotificationSettings({ initialSettings }) {
  const [settings, setSettings] = useState(initialSettings || null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialSettings && settings === null) setSettings(initialSettings);
  }, [initialSettings, settings]);

  return (
    <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">E-postnotiser</h2>
      <p className="text-sm text-slate-500 mb-5">Välj vilka påminnelser du vill få via e-post. Allt är aktiverat som standard.</p>
      {SETTINGS.map(({ key, label, desc }) => {
        const enabled = settings ? settings[key] !== false : true;
        return (
          <label key={key} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0 cursor-pointer">
            <div className="mt-0.5">
              <input
                type="checkbox"
                checked={enabled}
                disabled={saving}
                onChange={async (e) => {
                  const next = { ...(settings || {}), [key]: e.target.checked };
                  setSettings(next);
                  setSaving(true);
                  try {
                    await updateNotificationSettings(next);
                  } catch {
                    setSettings((prev) => ({ ...prev, [key]: !e.target.checked }));
                  } finally {
                    setSaving(false);
                  }
                }}
                className="w-4 h-4 rounded accent-[var(--color-primary)]"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">{label}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          </label>
        );
      })}
    </div>
  );
}
