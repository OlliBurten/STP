import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  jobTypes,
  employmentTypes,
  licenseTypes,
  regions,
  jobTitles,
  scheduleTypes,
  experienceLevels,
} from "../data/mockJobs";
import { certificateTypes } from "../data/profileData";
import { transportSegmentGroups } from "../data/bransch.js";
import { useAuth } from "../context/AuthContext";
import { createJob } from "../api/jobs.js";
import { fetchMyCompanyProfile } from "../api/companies.js";
import { mapEmploymentToSegment, segmentOptions } from "../data/segments";
import { trackJobPosted } from "../utils/segmentMetrics";
import { generateJobDescription as aiGenerateJobDescription } from "../api/ai.js";

export default function PostJob() {
  const { hasApi, user, isCompany } = useAuth();
  const isVerifiedCompany = !isCompany || user?.companyStatus === "VERIFIED";
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [form, setForm] = useState({
    title: "",
    company: "",
    description: "",
    location: "",
    region: "",
    license: [],
    certificates: [],
    jobType: "",
    employment: "",
    segment: "",
    bransch: "",
    schedule: "",
    experience: "",
    salary: "",
    extraRequirements: "",
    contact: "",
    physicalWorkRequired: false,
    soloWorkOk: false,
    kollektivavtal: null,
  });

  const publishChecklist = useMemo(
    () => [
      { label: "Jobbtitel vald", done: Boolean(form.title) },
      { label: "Företagsnamn ifyllt", done: Boolean(form.company.trim()) },
      { label: "Ort och region ifyllda", done: Boolean(form.location.trim()) && Boolean(form.region) },
      { label: "Minst ett körkort valt", done: form.license.length > 0 },
      { label: "Segment valt", done: Boolean(form.segment) },
      { label: "Kontaktadress ifylld", done: Boolean(form.contact.trim()) },
      { label: "Tydlig jobbtext", done: form.description.trim().length >= 80 },
      { label: "Lön eller ersättning angiven", done: Boolean(form.salary.trim()) },
      { label: "Kollektivavtal markerat", done: form.kollektivavtal === true },
    ],
    [form]
  );
  const completedChecklist = publishChecklist.filter((item) => item.done).length;

  const toggleLicense = (lic) => {
    setForm((prev) => ({
      ...prev,
      license: prev.license.includes(lic)
        ? prev.license.filter((l) => l !== lic)
        : [...prev.license, lic],
    }));
  };

  const toggleCertificate = (cert) => {
    setForm((prev) => ({
      ...prev,
      certificates: prev.certificates.includes(cert)
        ? prev.certificates.filter((c) => c !== cert)
        : [...prev.certificates, cert],
    }));
  };

  const handleGenerateDescription = async () => {
    if (!form.title) { setAiError("Välj jobbtitel först."); return; }
    setAiError("");
    setAiGenerating(true);
    try {
      const data = await aiGenerateJobDescription(form);
      if (data?.description) handleChange("description", data.description);
    } catch (e) {
      setAiError(e.message || "Kunde inte generera beskrivning.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (hasApi) {
      try {
        await createJob({
          title: form.title,
          company: form.company,
          description: form.description,
          location: form.location,
          region: form.region,
          license: form.license,
          certificates: form.certificates,
          jobType: form.jobType,
          employment: form.employment,
          segment: form.segment,
          bransch: form.bransch || null,
          schedule: form.schedule || null,
          experience: form.experience || null,
          salary: form.salary || null,
          requirements: [],
          extraRequirements: form.extraRequirements || null,
          contact: form.contact,
          physicalWorkRequired: form.physicalWorkRequired || null,
          soloWorkOk: form.soloWorkOk || null,
          kollektivavtal: form.kollektivavtal === true ? true : form.kollektivavtal === false ? false : null,
        });
        trackJobPosted(form.segment);
        setSubmitted(true);
      } catch (err) {
        setSubmitError(err.message || "Kunde inte publicera");
      }
      return;
    }
    console.log("Form submitted (mock):", form);
    setSubmitted(true);
  };

  const handleChange = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "employment" && !prev.segment) {
        next.segment = mapEmploymentToSegment(value);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!hasApi || !isCompany) return;
    fetchMyCompanyProfile()
      .then((company) => {
        const defaults = Array.isArray(company?.companySegmentDefaults)
          ? company.companySegmentDefaults
          : [];
        if (defaults.length > 0) {
          setForm((prev) => ({
            ...prev,
            segment: prev.segment || defaults[0],
            company: prev.company || company.companyName || "",
            contact: prev.contact || user?.email || "",
          }));
        } else {
          setForm((prev) => ({
            ...prev,
            company: prev.company || company.companyName || "",
            contact: prev.contact || user?.email || "",
          }));
        }
      })
      .catch(() => {});
  }, [hasApi, isCompany, user?.email]);

  if (submitted) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 sm:p-10">
          <h1 className="text-2xl font-bold text-green-900">Tack för din annons!</h1>
          <p className="mt-4 text-green-800">
            {hasApi ? "Annonsen är publicerad." : "Demo – inget jobb sparades (backend används inte)."}
          </p>
          {hasApi ? (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Link
                to="/foretag/mina-jobb"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-light)]"
              >
                Gå till Mina jobb →
              </Link>
              <Link
                to="/foretag"
                className="inline-flex items-center justify-center text-[var(--color-primary)] font-semibold hover:underline"
              >
                Tillbaka till företagsöversikten
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              För att jobbet ska sparas och synas under Mina jobb: sätt <code className="bg-white px-1 rounded">VITE_API_URL</code> (t.ex. http://localhost:3001), starta servern, och logga in med e-post innan du publicerar.
            </p>
          )}
        </div>
      </main>
    );
  }

  if (isCompany && !isVerifiedCompany) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16">
        <Link
          to="/foretag"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[var(--color-primary)] mb-8"
        >
          ← Tillbaka
        </Link>
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-6">
          <h1 className="text-xl font-bold text-amber-900">Verifiering krävs innan publicering</h1>
          <p className="mt-2 text-amber-800">
            Företagskontot är skapat men ännu inte verifierat. När verifieringen är klar kan ni publicera jobb direkt.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to="/foretag"
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-[var(--color-primary)] mb-8"
      >
        ← Tillbaka
      </Link>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">Publicera jobb</h1>
      <p className="text-slate-600 mb-6">
        Fyll i nedanstående fält. Ju mer komplett annonsen är, desto lättare för rätt förare att hitta den.
      </p>

      {/* Checklist – live progress, visas överst */}
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold text-slate-900">Annonsens status</h2>
          <span className={`shrink-0 rounded-full px-3 py-0.5 text-sm font-semibold ${
            completedChecklist === publishChecklist.length
              ? "bg-green-100 text-green-800"
              : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
          }`}>
            {completedChecklist}/{publishChecklist.length} klara
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 mb-4">
          <div
            className="h-1.5 rounded-full bg-[var(--color-primary)] transition-all duration-300"
            style={{ width: `${Math.round((completedChecklist / publishChecklist.length) * 100)}%` }}
          />
        </div>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {publishChecklist.map((item) => (
            <li
              key={item.label}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                item.done
                  ? "bg-green-50 text-green-800"
                  : "bg-slate-50 text-slate-500"
              }`}
            >
              <span className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                item.done ? "bg-green-500 text-white" : "border-2 border-slate-300"
              }`}>
                {item.done ? "✓" : ""}
              </span>
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Grundläggande */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
            Grundläggande
          </h2>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
              Jobbtitel *
            </label>
            <select
              id="title"
              required
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
            >
              <option value="">Välj jobbtitel</option>
              {jobTitles.map((t) => (
                <option key={t.value} value={t.label}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-1">
              Företagsnamn *
            </label>
            <input
              id="company"
              type="text"
              required
              value={form.company}
              onChange={(e) => handleChange("company", e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">
              Ett tydligt företagsnamn gör annonsen lättare att lita på och lättare att komma ihåg.
            </p>
          </div>
        </section>

        {/* Plats */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
            Plats
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1">
                Ort / bas *
              </label>
              <input
                id="location"
                type="text"
                required
                placeholder="t.ex. Malmö, Göteborg"
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-slate-700 mb-1">
                Region *
              </label>
              <select
                id="region"
                required
                value={form.region}
                onChange={(e) => handleChange("region", e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
              >
                <option value="">Välj region</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Krav – körkort, certifikat, erfarenhet */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
            Krav
          </h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Körkort *</label>
            <div className="flex flex-wrap gap-2">
              {licenseTypes.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => toggleLicense(l.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    form.license.includes(l.value)
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Certifikat (kryssa i vad som krävs)
            </label>
            <div className="flex flex-wrap gap-2">
              {certificateTypes.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => toggleCertificate(c.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    form.certificates.includes(c.value)
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="experience" className="block text-sm font-medium text-slate-700 mb-1">
              Min. erfarenhet
            </label>
            <select
              id="experience"
              value={form.experience}
              onChange={(e) => handleChange("experience", e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
            >
              {experienceLevels.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="extraRequirements" className="block text-sm font-medium text-slate-700 mb-1">
              Övriga krav (valfritt)
            </label>
            <input
              id="extraRequirements"
              type="text"
              placeholder="t.ex. B-kort, svenska språket"
              value={form.extraRequirements}
              onChange={(e) => handleChange("extraRequirements", e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
            />
          </div>
        </section>

        {/* Typ av jobb */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
            Typ av jobb
          </h2>
          <div>
            <label htmlFor="segment" className="block text-sm font-medium text-slate-700 mb-1">
              Segment *
            </label>
            <select
              id="segment"
              required
              value={form.segment}
              onChange={(e) => handleChange("segment", e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
            >
              <option value="">Välj segment</option>
              {segmentOptions.map((segment) => (
                <option key={segment.value} value={segment.value}>
                  {segment.label} – {segment.description}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Segmentet styr hur annonsen matchas och hittas av rätt förare.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="jobType" className="block text-sm font-medium text-slate-700 mb-1">
                Jobbtyp *
              </label>
              <select
                id="jobType"
                required
                value={form.jobType}
                onChange={(e) => handleChange("jobType", e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
              >
                <option value="">Välj</option>
                {jobTypes.map((j) => (
                  <option key={j.value} value={j.value}>
                    {j.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="employment" className="block text-sm font-medium text-slate-700 mb-1">
                Anställningstyp *
              </label>
              <select
                id="employment"
                required
                value={form.employment}
                onChange={(e) => handleChange("employment", e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
              >
                <option value="">Välj</option>
                {employmentTypes.map((emp) => (
                  <option key={emp.value} value={emp.value}>
                    {emp.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="bransch" className="block text-sm font-medium text-slate-700 mb-1">
                Transportsegment (valfritt)
              </label>
              <select
                id="bransch"
                value={form.bransch}
                onChange={(e) => handleChange("bransch", e.target.value)}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
              >
                <option value="">Välj segment</option>
                {transportSegmentGroups.map((g) => (
                  <optgroup key={g.id} label={g.label}>
                    {g.options.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                T.ex. tankbil, dagdistribution. Hjälper förare att filtrera på bransch.
              </p>
            </div>
            <div>
              <label htmlFor="schedule" className="block text-sm font-medium text-slate-700 mb-1">
                Arbetstid / schema *
              </label>
              <select
                id="schedule"
                required
                value={form.schedule}
                onChange={(e) => handleChange("schedule", e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none bg-white"
              >
                <option value="">Välj</option>
                {scheduleTypes.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="block text-sm font-medium text-slate-700 mb-2">Arbetsprofil (valfritt)</p>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.physicalWorkRequired === true}
                    onChange={(e) => setForm((p) => ({ ...p, physicalWorkRequired: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700">Fysiskt krävande arbete</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.soloWorkOk === true}
                    onChange={(e) => setForm((p) => ({ ...p, soloWorkOk: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700">Ensamarbete (t.ex. ensam i lastbil)</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Ersättning */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
            Ersättning
          </h2>
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={form.kollektivavtal === true}
                onChange={(e) => setForm((p) => ({ ...p, kollektivavtal: e.target.checked ? true : null }))}
                className="rounded"
              />
              <span className="text-sm font-medium text-slate-700">Kollektivavtal</span>
            </label>
            <p className="text-xs text-slate-500 mb-2">Kryssa i om tjänsten omfattas av kollektivavtal – många förare söker efter detta.</p>
          </div>
          <div>
            <label htmlFor="salary" className="block text-sm font-medium text-slate-700 mb-1">
              Lön / ersättning (valfritt men uppskattas)
            </label>
            <input
              id="salary"
              type="text"
              placeholder="t.ex. Enligt kollektivavtal, 290 kr/tim, 35 000 kr/mån"
              value={form.salary}
              onChange={(e) => handleChange("salary", e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
            />
          </div>
        </section>

        {/* Beskrivning */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
            Beskrivning
          </h2>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
              Om jobbet *
            </label>
            <textarea
              id="description"
              rows={4}
              required
              placeholder="Beskriv arbetsuppgifterna, fordon, rutiner, team, förmåner. Förare vill veta exakt vad som väntar."
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
            />
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={aiGenerating || !hasApi}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-[var(--color-primary)]/30 text-[var(--color-primary)] bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10 disabled:opacity-40 transition-colors"
              >
                {aiGenerating ? (
                  <>
                    <span className="inline-block w-3 h-3 rounded-full bg-[var(--color-primary)]/40 animate-pulse" />
                    Genererar...
                  </>
                ) : (
                  <>Generera annonstext</>
                )}
              </button>
              {aiError && <p className="text-xs text-red-600">{aiError}</p>}
              {!aiError && (
                <p className="text-xs text-slate-400">Baseras på vad du fyllt i ovan. Du kan redigera texten efteråt.</p>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Tydliga annonser får bättre respons. Beskriv vardagen, fordonet, upplägget och vad ni faktiskt behöver hjälp med.
            </p>
          </div>
        </section>

        {/* Kontakt */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
            Kontakt
          </h2>
          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-slate-700 mb-1">
              E-post för ansökningar *
            </label>
            <input
              id="contact"
              type="email"
              required
              value={form.contact}
              onChange={(e) => handleChange("contact", e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
            />
          </div>
        </section>

        {submitError && (
          <p className="text-red-600 text-sm">{submitError}</p>
        )}
        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary-light)] transition-colors"
        >
          Publicera annons
        </button>
      </form>
    </main>
  );
}
