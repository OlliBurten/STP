// STP Mobile — driver app data layer.
// Assembles everything the ported driver screens consume (mirrors the
// prototype's `ctx`) from the real contexts/APIs, with honest fallbacks:
//   • jobs       → fetchJobs() (mockJobs fallback in dev/no-backend)
//   • saved      → fetchSavedJobs() + save/unsave
//   • seeking    → profile.visibleToCompanies (real, persisted)
//   • completion → shared DRIVER_ITEMS
//   • threads    → ChatContext driver conversations
//   • activity   → NotificationContext (empty-state when none)
// Prototype-only concepts with no backend (inhopp/shifts) are flagged below.
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/ProfileContext";
import { useChat } from "../../context/ChatContext";
import { useNotifications } from "../../context/NotificationContext";
import { fetchJobs, fetchSavedJobs, saveJob, unsaveJob, fetchSavedCompanies, saveCompany, unsaveCompany } from "../../api/jobs";
import { fetchCompaniesSearch } from "../../api/companies";
import { fetchDriverProfileStats, fetchDriverReviews } from "../../api/drivers";
import { submitApplication, fetchMyApplications } from "../../api/applications";
import { updateNotificationSettings, fetchDriverActivity } from "../../api/profile";
import { fetchAvailableShifts, acceptShift as apiAcceptShift } from "../../api/shifts";
import { mockJobs } from "../../data/mockJobs";
import { initialsFor, timeAgo } from "./jobAdapter";
import { getProfileCompletion } from "../../utils/driverCompletion";
import { toJobView } from "./jobAdapter";
import { toThread, toApplication } from "./chatAdapter";
import { buildDocuments } from "./documentUtils";

const Ctx = createContext(null);
export const useDriverData = () => useContext(Ctx);

export function DriverDataProvider({ children }) {
  const { user, hasApi, logout } = useAuth();
  const { profile: rawProfile, profileLoaded, updateProfile } = useProfile();
  const chat = useChat();
  const notifications = useNotifications();

  const profile = useMemo(() => ({ ...(rawProfile || {}), name: rawProfile?.name || user?.name || "" }), [rawProfile, user]);

  const [rawJobs, setRawJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState(false);
  const [savedIds, setSavedIds] = useState(() => new Set());

  // ── Jobs ──────────────────────────────────────────────────────────
  const refreshJobs = useCallback(async () => {
    try {
      const data = hasApi ? await fetchJobs() : mockJobs;
      setRawJobs(Array.isArray(data) && data.length ? data : mockJobs);
      setJobsError(false);
    } catch {
      if (hasApi) setJobsError(true); else setRawJobs(mockJobs); // dev / no-backend fallback
    }
  }, [hasApi]);
  useEffect(() => {
    let alive = true;
    (async () => {
      setJobsLoading(true);
      setJobsError(false);
      try {
        const data = hasApi ? await fetchJobs() : mockJobs;
        if (alive) { setRawJobs(Array.isArray(data) && data.length ? data : mockJobs); }
      } catch {
        // Prod: flagga fel (UI visar "kunde inte ladda" i st f "inga jobb").
        // Dev/utan backend: behåll mock-fallback.
        if (alive) { if (hasApi) setJobsError(true); else setRawJobs(mockJobs); }
      } finally {
        if (alive) setJobsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [hasApi]);

  // ── Saved jobs ────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasApi) return;
    let alive = true;
    (async () => {
      try {
        const saved = await fetchSavedJobs();
        if (alive && Array.isArray(saved)) setSavedIds(new Set(saved.map((j) => j.id)));
      } catch { /* ignore */ }
    })();
    return () => { alive = false; };
  }, [hasApi]);

  const toggleSave = useCallback((id) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      const willSave = !next.has(id);
      willSave ? next.add(id) : next.delete(id);
      if (hasApi) {
        (willSave ? saveJob(id) : unsaveJob(id)).catch(() => {
          // revert on failure
          setSavedIds((p) => {
            const r = new Set(p);
            willSave ? r.delete(id) : r.add(id);
            return r;
          });
        });
      }
      return next;
    });
  }, [hasApi]);

  // ── Companies ─────────────────────────────────────────────────────
  const [apiCompanies, setApiCompanies] = useState(null);
  const [savedCompanyIds, setSavedCompanyIds] = useState(() => new Set());
  useEffect(() => {
    if (!hasApi) return;
    let alive = true;
    fetchCompaniesSearch({})
      .then((list) => { if (alive && Array.isArray(list)) setApiCompanies(list); })
      .catch(() => {});
    fetchSavedCompanies()
      .then((list) => { if (alive && Array.isArray(list)) setSavedCompanyIds(new Set(list.map((c) => c.id))); })
      .catch(() => {});
    return () => { alive = false; };
  }, [hasApi]);

  // Fallback: derive a minimal company list from the jobs (no backend / dev).
  const derivedCompanies = useMemo(() => {
    const seen = new Map();
    for (const j of rawJobs) {
      if (!j.company || seen.has(j.company)) continue;
      seen.set(j.company, {
        id: j.companyId || j.company,
        name: j.company,
        initials: initialsFor(j.company),
        location: j.location,
        region: j.region,
        verified: Boolean(j.companyVerified),
        rating: null,
      });
    }
    return [...seen.values()];
  }, [rawJobs]);

  const companies = useMemo(() => {
    const base = apiCompanies && apiCompanies.length ? apiCompanies : derivedCompanies;
    return base.map((c) => ({ ...c, initials: c.initials || initialsFor(c.name) }));
  }, [apiCompanies, derivedCompanies]);

  const toggleSaveCompany = useCallback((id) => {
    setSavedCompanyIds((prev) => {
      const next = new Set(prev);
      const willSave = !next.has(id);
      willSave ? next.add(id) : next.delete(id);
      if (hasApi) (willSave ? saveCompany(id) : unsaveCompany(id)).catch(() => {});
      return next;
    });
  }, [hasApi]);

  // ── Derived job views (with match %) ─────────────────────────────
  // Match-% beror BARA på matchningsrelevanta profilfält. Beräkna en stabil
  // signatur (innehåll, inte referens) så att 381 jobb inte ommatchas varje
  // gång ett orelaterat fält ändras — t.ex. när man togglar "Söker aktivt jobb"
  // eller sparar namn. Annars blev varje toggle en 381×matchScore-omräkning som
  // hackar på riktiga enheter.
  const matchSig = useMemo(() => JSON.stringify([
    profile.licenses, profile.region, profile.regionsWilling, profile.primarySegment,
    profile.certificates, (profile.experience || []).length, profile.privateMatchNotes,
  ]), [profile.licenses, profile.region, profile.regionsWilling, profile.primarySegment, profile.certificates, profile.experience, profile.privateMatchNotes]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const jobs = useMemo(() => rawJobs.map((j) => toJobView(j, profile)), [rawJobs, matchSig]);
  const companyActiveJobs = useCallback(
    (name) => jobs.filter((j) => j.company === name && !j.imported),
    [jobs]
  );
  const matchedJobs = useMemo(
    () => jobs.filter((j) => j.match != null).sort((a, b) => b.match - a.match),
    [jobs]
  );
  const jobById = useCallback((id) => jobs.find((j) => j.id === id), [jobs]);

  // ── Completion ────────────────────────────────────────────────────
  const completion = useMemo(() => getProfileCompletion(profile), [profile]);

  // ── Derived profile bits + profile actions ───────────────────────
  // Years of experience, derived from experience entries (no stored field).
  const expYears = useMemo(() => {
    const list = Array.isArray(profile.experience) ? profile.experience : [];
    const now = new Date().getFullYear();
    let months = 0;
    for (const e of list) {
      const start = Number(e.startYear || e.fromY) || now;
      const end = e.current ? now : Number(e.endYear || e.toY) || start;
      months += Math.max(0, (end - start) * 12);
    }
    return Math.round(months / 12);
  }, [profile.experience]);

  // Documents view: real certificates + per-cert expiry (status computed).
  const documents = useMemo(() => buildDocuments(profile), [profile]);

  const saveExperience = useCallback((list) => updateProfile({ experience: list }), [updateProfile]);
  const addDocument = useCallback((cert, expiry) => {
    const cur = Array.isArray(profile.certificates) ? profile.certificates : [];
    const certs = cur.includes(cert) ? cur : [...cur, cert];
    const certExpiry = { ...(profile.certExpiry || {}) };
    if (expiry) certExpiry[cert] = expiry;
    updateProfile({ certificates: certs, certExpiry });
  }, [profile.certificates, profile.certExpiry, updateProfile]);
  const removeDocument = useCallback((cert) => {
    const cur = Array.isArray(profile.certificates) ? profile.certificates : [];
    const certExpiry = { ...(profile.certExpiry || {}) };
    delete certExpiry[cert];
    updateProfile({ certificates: cur.filter((c) => c !== cert), certExpiry });
  }, [profile.certificates, profile.certExpiry, updateProfile]);
  const renewDocument = useCallback((cert, newExpiry) => {
    updateProfile({ certExpiry: { ...(profile.certExpiry || {}), [cert]: newExpiry } });
  }, [profile.certExpiry, updateProfile]);
  const savePrefs = useCallback((cities) => updateProfile({ regionsWilling: cities }), [updateProfile]);

  // ── Notification prefs (User.emailNotificationSettings) ──────────
  const [notif, setNotif] = useState({ match: true, msg: true, weekly: false });
  useEffect(() => {
    const s = profile?.emailNotificationSettings;
    if (s && typeof s === "object") {
      setNotif({ match: s.jobMatch !== false, msg: s.messageReminder !== false, weekly: !!s.weekly });
    }
  }, [profile?.emailNotificationSettings]);
  const saveNotif = useCallback((next) => {
    setNotif(next);
    if (hasApi) updateNotificationSettings({ jobMatch: next.match, messageReminder: next.msg, weekly: next.weekly }).catch(() => {});
  }, [hasApi]);

  // ── Seeking ("Söker aktivt jobb" / SÖKER JOBB ring → openToWork) ──
  const seeking = profile.openToWork === true;
  const setSeeking = useCallback((val) => {
    const next = typeof val === "function" ? val(seeking) : val;
    updateProfile({ openToWork: next });
  }, [seeking, updateProfile]);

  // ── Searchable (visibleToCompanies — privacy toggle) ─────────────
  const searchable = profile.visibleToCompanies === true;
  const setSearchable = useCallback((val) => {
    const next = typeof val === "function" ? val(searchable) : val;
    updateProfile({ visibleToCompanies: next });
  }, [searchable, updateProfile]);

  // ── Inhopp / vikariepool availability (real field) ───────────────
  const available = profile.availableForShifts === true;
  const setAvailable = useCallback((val) => {
    const next = typeof val === "function" ? val(available) : val;
    updateProfile({ availableForShifts: next });
  }, [available, updateProfile]);

  // ── Stats + reviews (real endpoints) ─────────────────────────────
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    if (!hasApi) return;
    let alive = true;
    fetchDriverProfileStats().then((s) => { if (alive && s) setStats({ views30: s.views30, views7: s.views7, contacted: s.conversationCount }); }).catch(() => {});
    if (user?.id) fetchDriverReviews(user.id).then((r) => { if (alive && Array.isArray(r)) setReviews(r); }).catch(() => {});
    return () => { alive = false; };
  }, [hasApi, user?.id]);
  const rating = reviews.length ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length) : null;

  // ── Activity feed (real: profile views + notifications) ──────────
  const [activity, setActivity] = useState([]);
  const refreshActivity = useCallback(() => {
    if (!hasApi) return;
    fetchDriverActivity().then((a) => { if (Array.isArray(a)) setActivity(a); }).catch(() => {});
  }, [hasApi]);
  useEffect(() => { refreshActivity(); }, [refreshActivity]);

  // ── Inhopp / vikariepool shifts (real) ───────────────────────────
  const [shifts, setShifts] = useState([]);
  const [acceptedShifts, setAcceptedShifts] = useState(() => new Set());
  const refreshShifts = useCallback(() => {
    if (!hasApi || !available) { setShifts([]); return; }
    fetchAvailableShifts().then((list) => { if (Array.isArray(list)) setShifts(list); }).catch(() => setShifts([]));
  }, [hasApi, available]);
  useEffect(() => { refreshShifts(); }, [refreshShifts]);
  const acceptShift = useCallback(async (id) => {
    setAcceptedShifts((s) => new Set(s).add(id)); // optimistic
    if (hasApi) { try { await apiAcceptShift(id); refreshShifts(); } catch { /* keep optimistic */ } }
  }, [hasApi, refreshShifts]);

  // ── Applications (aggregated) + applied set + apply() ────────────
  // Aggregerade/importerade ansökningar = egna Application-rader (ingen
  // konversation, eftersom företaget inte är på STP). Hämta HELA listan, inte
  // bara jobId:n — annars syns de aldrig på Ansökt-sidan.
  const [aggApps, setAggApps] = useState([]);
  const [appliedLocal, setAppliedLocal] = useState(() => new Set());
  const [appsLoading, setAppsLoading] = useState(true);
  const [appsError, setAppsError] = useState(false);
  const refreshApplications = useCallback(() => {
    if (!hasApi) { setAppsLoading(false); return; }
    setAppsError(false);
    return fetchMyApplications()
      .then((apps) => { if (Array.isArray(apps)) setAggApps(apps); })
      .catch(() => setAppsError(true))
      .finally(() => setAppsLoading(false));
  }, [hasApi]);
  useEffect(() => { refreshApplications(); }, [refreshApplications]);
  const aggApplied = useMemo(() => new Set(aggApps.map((a) => a.jobId).filter(Boolean)), [aggApps]);
  const [filter, setFilter] = useState({ type: "alla", lic: [], cert: [], hideBemanning: false });

  // ── Conversations → threads (Inkorg) + applications (Ansökt) ─────
  const convs = useMemo(() => {
    const list = user?.id ? (chat.getDriverConversations?.(user.id) || []) : (chat.conversations || []);
    return Array.isArray(list) ? list : [];
  }, [chat, user]);
  const threads = useMemo(() => convs.map(toThread), [convs]);
  const convApplications = useMemo(() => convs.filter((c) => c.jobId).map(toApplication), [convs]);

  // Aggregerade ansökningar → samma kort-shape som konversations-ansökningar.
  // Ärlig status per ansökan i st f generiskt "Skickad":
  //   • af_external → föraren sökte direkt via Arbetsförmedlingen
  //   • forwarded   → STP har faktiskt mejlat företaget (claim-länk)
  //   • annars      → mottagen av STP, ännu inte vidarebefordrad
  const aggApplications = useMemo(() => aggApps.map((a) => {
    const stage = a.appliedVia === "af_external"
      ? { id: "applied", label: "Sökt via AF", tone: "info", step: 1 }
      : a.forwarded
        ? { id: "applied", label: "Vidarebefordrad", tone: "soft", step: 1 }
        : { id: "applied", label: "Mottagen", tone: "neutral", step: 1 };
    return {
      id: a.id,
      jobId: a.jobId,
      title: a.job?.title || "Ansökan",
      company: a.job?.company || "Företag",
      stage,
      when: timeAgo(a.createdAt),
      note: null,
      imported: a.job?.source === "AGGREGATED",
      conv: null,
    };
  }), [aggApps]);

  // Ansökt-listan = konversations-ansökningar + aggregerade, deduppade på jobId
  // (föredra konversationen — den är rikare/har stage).
  const applications = useMemo(() => {
    const byJob = new Set(convApplications.map((a) => a.jobId));
    return [...convApplications, ...aggApplications.filter((a) => !byJob.has(a.jobId))];
  }, [convApplications, aggApplications]);

  // applied = on-platform conversations + aggregated applications + optimistic
  const applied = useMemo(() => {
    const s = new Set(appliedLocal);
    convs.forEach((c) => c.jobId && s.add(c.jobId));
    aggApplied.forEach((id) => s.add(id));
    return s;
  }, [appliedLocal, convs, aggApplied]);

  // Real submission: aggregated/unclaimed → submitApplication; on-platform → conversation.
  const apply = useCallback(async (job, { message = "", consent = false } = {}) => {
    const jobId = typeof job === "string" ? job : job?.id;
    setAppliedLocal((s) => new Set(s).add(jobId)); // optimistic
    if (!hasApi || typeof job === "string") return;
    try {
      const aggregated = job.imported && !job.claimed;
      if (aggregated) {
        await submitApplication({ jobId: job.id, messageFromDriver: message, consentToShare: consent });
        refreshApplications(); // ladda om så ansökan syns direkt på Ansökt
      } else if (job.userId || job.companyUserId) {
        await chat.createConversation?.({
          driverId: user?.id, companyId: job.userId || job.companyUserId,
          driverName: profile.name, companyName: job.company,
          jobId: job.id, jobTitle: job.title, initialMessage: message, sender: "driver",
        });
        chat.refreshConversations?.();
      }
    } catch { /* keep optimistic state; surfaced via Ansökt refresh */ }
  }, [hasApi, chat, user, profile.name, refreshApplications]);

  // Föraren sökte direkt via AF:s länk → registrera leaden i STP (utan
  // profildelning/samtycke) så vi fångar konto + data, sen öppnas AF-länken.
  const applyExternal = useCallback((job) => {
    const jobId = typeof job === "string" ? job : job?.id;
    if (!jobId) return;
    setAppliedLocal((s) => new Set(s).add(jobId)); // optimistic
    if (hasApi) {
      submitApplication({ jobId, appliedVia: "af_external", consentToShare: false })
        .then(refreshApplications)
        .catch(() => {});
    }
  }, [hasApi, refreshApplications]);

  const sendMessage = useCallback((convId, text) => chat.sendMessage?.(convId, text, "driver"), [chat]);
  const markChatSeen = useCallback((convId) => chat.markConversationSeen?.(convId), [chat]);
  const getConversation = useCallback((id) => chat.getConversation?.(id) || convs.find((c) => c.id === id) || null, [chat, convs]);

  const value = {
    profile, profileLoaded,
    completion,
    jobs, matchedJobs, jobsLoading, jobsError, jobById,
    savedIds, toggleSave, saved: savedIds,
    companies, companyActiveJobs, savedCompanyIds, toggleSaveCompany,
    seeking, setSeeking,
    searchable, setSearchable,
    available, setAvailable,
    shifts, acceptedShifts, acceptShift, refreshShifts,
    activity, refreshActivity,
    refreshJobs,
    applied, apply, applyExternal, refreshApplications, appsLoading, appsError,
    filter, setFilter,
    threads, applications, sendMessage, markChatSeen, getConversation,
    chat,
    notifications,
    updateProfile, saveExperience, addDocument, removeDocument, renewDocument, savePrefs,
    documents, expYears, stats, reviews, rating,
    notif, setNotif: saveNotif,
    logout,
    user, hasApi,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
