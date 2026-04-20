import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyCompanyProfile, updateMyCompanyProfile, updateCompanyNotificationSettings } from "../api/companies.js";
import { listCompanyInvites, createCompanyInvite, revokeCompanyInvite } from "../api/invites.js";
import { changePassword } from "../api/auth.js";
import { useAuth } from "../context/AuthContext";
import { segmentOptions } from "../data/segments";
import { branschValues } from "../data/bransch.js";
import BranschSearch from "../components/BranschSearch.jsx";
import { regions } from "../data/mockJobs.js";
import LoadingBlock from "../components/LoadingBlock";
import { useToast } from "../context/ToastContext";
import { ChevronDownIcon, EyeIcon, EyeOffIcon } from "../components/Icons";

export default function CompanyProfile() {
  const { hasApi, user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isOwner = !user?.companyOwnerId;

  // Team invites (owners only)
  const [invites, setInvites] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [lastDevInviteLink, setLastDevInviteLink] = useState("");
  const [notifSettings, setNotifSettings] = useState(null);
  const [notifSaving, setNotifSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNext, setShowPwNext] = useState(false);

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
        if (data?.emailNotificationSettings) setNotifSettings(data.emailNotificationSettings);
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
        fSkattsedel: Boolean(draft.fSkattsedel),
        industryOrgMember: Boolean(draft.industryOrgMember),
        industryOrgName: draft.industryOrgName || null,
        policyAgreedAt: draft.policyAgreedAt || null,
        companyContactEmail: draft.companyContactEmail || null,
        companyContactPhone: draft.companyContactPhone || null,
      });
      setProfile(updated);
      setDraft(updated);
      toast.success("Företagsprofilen är sparad!");
    } catch (_) {
      toast.error("Kunde inte spara profilen. Försök igen.");
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
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-28 space-y-6">
      {/* Floating save bar */}
      {changed && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-4 shadow-lg">
          <p className="text-sm text-amber-700 font-medium">Osparade ändringar</p>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving ? "Sparar..." : "Spara ändringar"}
          </button>
        </div>
      )}
      <Link to="/foretag" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[var(--color-primary)]">
        ← Tillbaka till företagsöversikten
      </Link>
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Företagsprofil</h1>
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
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Kontaktperson</label>
          <input
            value={draft?.name || ""}
            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ort</label>
          <input
            value={draft?.companyLocation || ""}
            onChange={(e) => setDraft((p) => ({ ...p, companyLocation: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Region (för sök "Hitta åkerier")</label>
          <div className="relative">
            <select
              value={draft?.companyRegion || ""}
              onChange={(e) => setDraft((p) => ({ ...p, companyRegion: e.target.value }))}
              className="w-full appearance-none pl-3 pr-9 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white text-sm"
            >
              <option value="">Välj region</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
              <ChevronDownIcon className="w-4 h-4" />
            </span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Transportsegment (för sök &quot;Hitta åkerier&quot;)</label>
          <p className="text-xs text-slate-500 mb-1">
            Välj <strong>1–2 primära segment</strong> (viktigast), sedan valfria tillägg. Förare hittar er under Åkerier.
          </p>
          <BranschSearch
            value={draft?.companyBransch || []}
            onChange={(v) => setDraft((prev) => ({ ...prev, companyBransch: v }))}
            placeholder="Sök bransch, t.ex. tankbil, timmerbil..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Webbplats (valfritt)</label>
          <input
            value={draft?.companyWebsite || ""}
            onChange={(e) => setDraft((p) => ({ ...p, companyWebsite: e.target.value }))}
            placeholder="https://..."
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Om företaget</label>
          <textarea
            value={draft?.companyDescription || ""}
            onChange={(e) => setDraft((p) => ({ ...p, companyDescription: e.target.value }))}
            rows={5}
            placeholder="Beskriv ert åkeri, uppdrag och vad ni erbjuder förare."
            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
          />
        </div>
        <div className="border-t border-slate-100 pt-5">
          <h2 className="text-base font-semibold text-slate-900 mb-1">Kontaktuppgifter</h2>
          <p className="text-xs text-slate-500 mb-4">
            Visas för inloggade förare i åkeridatabasen — en direktväg för spontankontakt, även utan aktiv annons.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kontakt-e-post</label>
              <input
                type="email"
                value={draft?.companyContactEmail || ""}
                onChange={(e) => setDraft((p) => ({ ...p, companyContactEmail: e.target.value || null }))}
                placeholder="rekrytering@ert-akeri.se"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefon (valfritt)</label>
              <input
                type="tel"
                value={draft?.companyContactPhone || ""}
                onChange={(e) => setDraft((p) => ({ ...p, companyContactPhone: e.target.value || null }))}
                placeholder="070-000 00 00"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-sm"
              />
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-5">
          <h2 className="text-base font-semibold text-slate-900 mb-1">Certifieringar &amp; trovärdighet</h2>
          <p className="text-xs text-slate-500 mb-4">
            Dessa uppgifter visas som badges på er offentliga profil och hjälper förare att snabbt bedöma hur seriöst ert åkeri är. Ni intygar på heder att uppgifterna stämmer.
          </p>
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(draft?.fSkattsedel)}
                onChange={(e) => {
                  setDraft((p) => ({ ...p, fSkattsedel: e.target.checked }));
                }}
                className="mt-0.5 w-4 h-4 rounded accent-[var(--color-primary)]"
              />
              <div>
                <p className="text-sm font-medium text-slate-800">Vi innehar F-skattsedel</p>
                <p className="text-xs text-slate-500">Intygar att ni betalar arbetsgivaravgifter och följer Skatteverkets regler.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(draft?.industryOrgMember)}
                onChange={(e) => {
                  setDraft((p) => ({ ...p, industryOrgMember: e.target.checked }));
                }}
                className="mt-0.5 w-4 h-4 rounded accent-[var(--color-primary)]"
              />
              <div>
                <p className="text-sm font-medium text-slate-800">Medlem i branschorganisation</p>
                <p className="text-xs text-slate-500">T.ex. Transportföretagen, Sveriges Åkeriföretag (SÅ), TYA eller liknande.</p>
              </div>
            </label>
            {draft?.industryOrgMember && (
              <div className="ml-7">
                <label className="block text-xs font-medium text-slate-700 mb-1">Namn på organisation (valfritt)</label>
                <input
                  value={draft?.industryOrgName || ""}
                  onChange={(e) => setDraft((p) => ({ ...p, industryOrgName: e.target.value }))}
                  placeholder="t.ex. Sveriges Åkeriföretag"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
                />
              </div>
            )}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(draft?.policyAgreedAt)}
                onChange={(e) => {
                  setDraft((p) => ({ ...p, policyAgreedAt: e.target.checked ? new Date().toISOString() : null }));
                }}
                className="mt-0.5 w-4 h-4 rounded accent-[var(--color-primary)]"
              />
              <div>
                <p className="text-sm font-medium text-slate-800">Vi förbinder oss att följa STP:s uppförandekod</p>
                <p className="text-xs text-slate-500">Intygar att ni inte diskriminerar, villfarar eller missbrukar plattformen.</p>
              </div>
            </label>
          </div>
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
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {segment.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {isOwner && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-5">
          <h2 className="text-xl font-bold text-slate-900">Bjud in teammedlemmar</h2>
          <p className="text-sm text-slate-600">
            Bjud in kollegor som ska kunna logga in, publicera jobb och söka förare tillsammans med er. De behöver bara skapa ett konto, ingen företags-onboarding krävs.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!inviteEmail.trim()) return;
              setInviteError("");
              setInviteLoading(true);
              try {
                const result = await createCompanyInvite(inviteEmail.trim());
                setInviteEmail("");
                setInvites(await listCompanyInvites());
                setLastDevInviteLink(result.devInviteLink || "");
                if (result.emailSent) {
                  toast.success("Inbjudan skickad till mottagarens e-post.");
                } else if (result.devInviteLink) {
                  toast.success(
                    "Inbjudan skapad. E-post skickades inte (saknar RESEND på servern). Kopiera länken nedan och skicka den manuellt."
                  );
                } else {
                  toast.success(
                    "Inbjudan skapad, men e-post skickades inte. Sätt RESEND_API_KEY och FRONTEND_URL på servern."
                  );
                }
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
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
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
          {lastDevInviteLink ? (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm space-y-2">
              <p className="font-medium text-amber-950">Länk att dela manuellt (endast utveckling)</p>
              <code className="block break-all text-xs bg-white p-2 rounded border border-amber-100 text-slate-800">
                {lastDevInviteLink}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(lastDevInviteLink).then(
                    () => toast.success("Länk kopierad"),
                    () => toast.error("Kunde inte kopiera")
                  );
                }}
                className="text-sm font-medium text-amber-900 underline hover:no-underline"
              >
                Kopiera länk
              </button>
            </div>
          ) : null}
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

      {/* Email notification preferences */}
      <section className="mt-6 bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">E-postnotiser</h2>
        <p className="text-sm text-slate-500 mb-5">Välj vilka påminnelser ni vill få via e-post. Allt är aktiverat som standard.</p>
        {[
          { key: "profileReminder", label: "Profilpåminnelser", desc: "Påminnelse när er företagsprofil inte är komplett." },
          { key: "jobMatch", label: "Förarrekommendationer", desc: "När nya förare matchar era krav publiceras." },
          { key: "messageReminder", label: "Obesvarade meddelanden", desc: "Påminnelse när ett meddelande väntar på svar." },
          { key: "inactivity", label: "Inaktivitetspåminnelse", desc: "Om ni inte loggat in på 30 dagar." },
        ].map(({ key, label, desc }) => {
          const enabled = notifSettings ? notifSettings[key] !== false : true;
          return (
            <label key={key} className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0 cursor-pointer">
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  checked={enabled}
                  disabled={notifSaving}
                  onChange={async (e) => {
                    const next = { ...(notifSettings || {}), [key]: e.target.checked };
                    setNotifSettings(next);
                    setNotifSaving(true);
                    try {
                      await updateCompanyNotificationSettings(next);
                    } catch {
                      setNotifSettings((prev) => ({ ...prev, [key]: !e.target.checked }));
                    } finally {
                      setNotifSaving(false);
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
      </section>

      {/* Change password */}
      <section className="mt-6 bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Ändra lösenord</h2>
        <p className="text-sm text-slate-500 mb-5">Välj ett nytt lösenord på minst 8 tecken.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setPwError("");
            setPwSuccess("");
            if (pwForm.next.length < 8) { setPwError("Lösenordet måste vara minst 8 tecken."); return; }
            if (pwForm.next !== pwForm.confirm) { setPwError("Lösenorden matchar inte."); return; }
            setPwLoading(true);
            try {
              await changePassword(pwForm.current, pwForm.next);
              setPwSuccess("Lösenordet har uppdaterats.");
              setPwForm({ current: "", next: "", confirm: "" });
            } catch (err) {
              setPwError(err.message || "Kunde inte uppdatera lösenordet.");
            } finally {
              setPwLoading(false);
            }
          }}
          className="space-y-4 max-w-sm"
        >
          {pwError && <p className="text-sm text-red-600">{pwError}</p>}
          {pwSuccess && <p className="text-sm text-green-700">{pwSuccess}</p>}
          <div>
            <label htmlFor="cp-current" className="block text-sm font-medium text-slate-700 mb-1">Nuvarande lösenord</label>
            <div className="relative">
              <input id="cp-current" type={showPwCurrent ? "text" : "password"} value={pwForm.current} onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))} required className="w-full px-4 py-3 pr-12 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-sm" />
              <button type="button" onClick={() => setShowPwCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showPwCurrent ? "Dölj" : "Visa"}>
                {showPwCurrent ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="cp-next" className="block text-sm font-medium text-slate-700 mb-1">Nytt lösenord</label>
            <div className="relative">
              <input id="cp-next" type={showPwNext ? "text" : "password"} value={pwForm.next} onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))} required minLength={8} placeholder="Minst 8 tecken" className="w-full px-4 py-3 pr-12 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-sm" />
              <button type="button" onClick={() => setShowPwNext((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showPwNext ? "Dölj" : "Visa"}>
                {showPwNext ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="cp-confirm" className="block text-sm font-medium text-slate-700 mb-1">Bekräfta nytt lösenord</label>
            <input id="cp-confirm" type={showPwNext ? "text" : "password"} value={pwForm.confirm} onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} required className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-sm" />
          </div>
          <button type="submit" disabled={pwLoading} className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-light)] disabled:opacity-50">
            {pwLoading ? "Sparar…" : "Spara nytt lösenord"}
          </button>
        </form>
      </section>
    </main>
  );
}
