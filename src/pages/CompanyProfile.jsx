import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyCompanyProfile, updateMyCompanyProfile } from "../api/companies.js";
import { listCompanyInvites, createCompanyInvite, revokeCompanyInvite } from "../api/invites.js";
import { useAuth } from "../context/AuthContext";
import { segmentOptions } from "../data/segments";
import { transportSegmentGroups, branschValues } from "../data/bransch.js";
import { regions } from "../data/mockJobs.js";
import LoadingBlock from "../components/LoadingBlock";

export default function CompanyProfile() {
  const { hasApi, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const isOwner = !user?.companyOwnerId;

  // Team invites (owners only)
  const [invites, setInvites] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    if (!hasApi) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchMyCompanyProfile()
      .then((data) => {
        setProfile(data);
        setDraft(data);
      })
      .finally(() => setLoading(false));
  }, [hasApi]);

  useEffect(() => {
    if (!hasApi || !isOwner) return;
    listCompanyInvites()
      .then(setInvites)
      .catch(() => setInvites([]));
  }, [hasApi, isOwner]);

  const changed = useMemo(
    () => JSON.stringify(profile || {}) !== JSON.stringify(draft || {}),
    [profile, draft]
  );

  const save = async () => {
    if (!draft || !changed) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await updateMyCompanyProfile({
        name: draft.name || "",
        companyName: draft.companyName || "",
        companyDescription: draft.companyDescription || "",
        companyWebsite: draft.companyWebsite || "",
        companyLocation: draft.companyLocation || "",
        companySegmentDefaults: Array.isArray(draft.companySegmentDefaults)
          ? draft.companySegmentDefaults
          : [],
        companyBransch: (Array.isArray(draft.companyBransch) ? draft.companyBransch : []).filter((b) => branschValues.includes(b)),
        companyRegion: draft.companyRegion !== undefined ? draft.companyRegion : "",
      });
      setProfile(updated);
      setDraft(updated);
      setMessage("Företagsprofilen är sparad.");
      setTimeout(() => setMessage(""), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <LoadingBlock message="Hämtar företagsprofil..." />
      </main>
    );
  }

  if (!hasApi) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-slate-600">Företagsprofil kräver API-läge.</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <Link to="/foretag" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[var(--color-primary)]">
        ← Tillbaka till företagsöversikten
      </Link>
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Företagsprofil</h1>
          {message ? <span className="text-sm text-green-700">{message}</span> : null}
        </div>
        {draft && (!Array.isArray(draft.companyBransch) || draft.companyBransch.length === 0 || !draft.companyRegion) && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <p className="text-sm font-medium">Syns inte i Hitta åkerier ännu</p>
            <p className="mt-1 text-sm">
              Fyll i <strong>bransch</strong> och <strong>region</strong> nedan så att förare kan hitta er när de söker efter åkerier i ert område.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Företagsnamn</label>
          <input
            value={draft?.companyName || ""}
            onChange={(e) => setDraft((p) => ({ ...p, companyName: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg border border-slate-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Kontaktperson</label>
          <input
            value={draft?.name || ""}
            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg border border-slate-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ort</label>
          <input
            value={draft?.companyLocation || ""}
            onChange={(e) => setDraft((p) => ({ ...p, companyLocation: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg border border-slate-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Region (för sök "Hitta åkerier")</label>
          <select
            value={draft?.companyRegion || ""}
            onChange={(e) => setDraft((p) => ({ ...p, companyRegion: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg border border-slate-300"
          >
            <option value="">Välj region</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Transportsegment (för sök &quot;Hitta åkerier&quot;)</label>
          <p className="text-xs text-slate-500 mb-1">
            Välj <strong>1–2 primära segment</strong> (viktigast), sedan valfria tillägg. Förare hittar er under Åkerier.
          </p>
          <div className="space-y-4">
            {transportSegmentGroups.map((group) => (
              <div key={group.id}>
                <p className="text-xs font-medium text-slate-500 mb-2">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((b) => {
                    const active = (draft?.companyBransch || []).includes(b.value);
                    return (
                      <button
                        key={b.value}
                        type="button"
                        onClick={() =>
                          setDraft((prev) => {
                            const current = prev?.companyBransch || [];
                            const next = current.includes(b.value)
                              ? current.filter((x) => x !== b.value)
                              : [...current, b.value];
                            return { ...prev, companyBransch: next };
                          })
                        }
                        className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                          active
                            ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {b.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Webbplats (valfritt)</label>
          <input
            value={draft?.companyWebsite || ""}
            onChange={(e) => setDraft((p) => ({ ...p, companyWebsite: e.target.value }))}
            placeholder="https://..."
            className="w-full px-4 py-2 rounded-lg border border-slate-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Om företaget</label>
          <textarea
            value={draft?.companyDescription || ""}
            onChange={(e) => setDraft((p) => ({ ...p, companyDescription: e.target.value }))}
            rows={5}
            placeholder="Beskriv ert åkeri, uppdrag och vad ni erbjuder förare."
            className="w-full px-4 py-3 rounded-lg border border-slate-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Standardsegment för nya annonser
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Används som förval i publiceringsflödet. Segment väljs fortfarande per annons.
          </p>
          <div className="flex flex-wrap gap-2">
            {segmentOptions.map((segment) => {
              const active = (draft?.companySegmentDefaults || []).includes(segment.value);
              return (
                <button
                  key={segment.value}
                  type="button"
                  onClick={() =>
                    setDraft((prev) => {
                      const current = prev?.companySegmentDefaults || [];
                      const next = current.includes(segment.value)
                        ? current.filter((s) => s !== segment.value)
                        : [...current, segment.value];
                      return { ...prev, companySegmentDefaults: next };
                    })
                  }
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                    active
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {segment.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={save}
            disabled={saving || !changed}
            className="inline-flex w-full sm:w-auto items-center justify-center px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold disabled:opacity-50 min-h-[44px]"
          >
            {saving ? "Sparar..." : "Spara företagsprofil"}
          </button>
        </div>
      </section>

      {isOwner && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-5">
          <h2 className="text-xl font-bold text-slate-900">Bjud in teammedlemmar</h2>
          <p className="text-sm text-slate-600">
            Bjud in kollegor som ska kunna logga in, publicera jobb och söka förare tillsammans med er. De behöver bara skapa ett konto – ingen företags-onboarding krävs.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!inviteEmail.trim()) return;
              setInviteError("");
              setInviteLoading(true);
              try {
                await createCompanyInvite(inviteEmail.trim());
                setInviteEmail("");
                setInvites(await listCompanyInvites());
                setMessage("Inbjudan skickad.");
                setTimeout(() => setMessage(""), 2500);
              } catch (err) {
                setInviteError(err.message || "Kunde inte skicka inbjudan");
              } finally {
                setInviteLoading(false);
              }
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="kollega@foretag.se"
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
              disabled={inviteLoading}
            />
            <button
              type="submit"
              disabled={inviteLoading || !inviteEmail.trim()}
              className="px-6 py-2 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-light)] disabled:opacity-50 whitespace-nowrap"
            >
              {inviteLoading ? "Skickar..." : "Skicka inbjudan"}
            </button>
          </form>
          {inviteError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-800 text-sm">{inviteError}</div>
          )}
          {invites.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Skickade inbjudan</h3>
              <ul className="space-y-2">
                {invites.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <span className="text-slate-700">
                      {inv.email}
                      <span className="ml-2 text-xs text-slate-500">
                        {inv.status === "PENDING" ? "Väntar" : inv.status === "ACCEPTED" ? "Accepterad" : "Återkallad"}
                      </span>
                    </span>
                    {inv.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await revokeCompanyInvite(inv.id);
                            setInvites(await listCompanyInvites());
                          } catch (err) {
                            setInviteError(err.message);
                          }
                        }}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Återkalla
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
