// STP Mobile — company (Åkeri) app data layer. Wires the ported screens to the
// real company-side APIs with defensive mapping + honest empty fallbacks.
//   • company  → fetchMyCompanyProfile (+ user fields)
//   • kpis      → fetchJobViewStats
//   • jobs      → fetchMyJobs (+ applicants → pipeline stages)
//   • drivers   → fetchMatchingDrivers / fetchDrivers
//   • threads   → ChatContext company conversations
//   • orgs/team → fetchMyOrganizations / listInvites
// Prototype-only: the 5-stage hiring pipeline (ny→anställd) has no backend stage
// model, so candidate stages are tracked locally (flagged).
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { fetchMyCompanyProfile, updateMyCompanyProfile, fetchJobViewStats, fetchMatchingDrivers, listInvites, createInvite, revokeInvite } from "../../api/companies";
import { fetchMyJobs, createJob, updateJob, fetchJobApplicants } from "../../api/jobs";
import { fetchDrivers } from "../../api/drivers";
import { setConversationStage } from "../../api/conversations";
import { fetchMyOrganizations } from "../../api/organizations";
import { initialsFor, timeAgo } from "../driver/jobAdapter";

const Ctx = createContext(null);
export const useCompanyData = () => useContext(Ctx);

const STATUS_MAP = { ACTIVE: "aktiv", HIDDEN: "pausad", DRAFT: "utkast", REMOVED: "pausad" };
const EMPTY_STAGES = { ny: 0, kontaktad: 0, intervjuad: 0, anstalld: 0, avslag: 0 };

export function CompanyDataProvider({ children }) {
  const { user, hasApi, logout } = useAuth();
  const chat = useChat();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [apiCompany, setApiCompany] = useState(null);
  const [kpis, setKpis] = useState({ newApps: 0, unread: 0, activeJobs: 0, views: 0 });
  const [rawJobs, setRawJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [invites, setInvites] = useState([]);

  // ── Company profile ──────────────────────────────────────────────
  const company = useMemo(() => {
    const c = apiCompany || {};
    const name = c.name || c.companyName || user?.companyName || "Ditt åkeri";
    return {
      name,
      initials: initialsFor(name),
      orgnr: c.orgNumber || c.orgnr || user?.companyOrgNumber || "",
      city: c.location || c.city || "",
      region: c.region || "",
      industry: (Array.isArray(c.bransch) ? c.bransch.join(", ") : c.bransch) || c.industry || "Transport",
      verified: (c.status || user?.companyStatus) === "VERIFIED",
      founded: c.foundedYear || c.founded || null,
      employees: c.employeeCount || c.employees || null,
      fleet: c.fleet || null,
      rating: c.rating ?? null,
      reviewCount: c.reviewCount || 0,
      segments: Array.isArray(c.segmentDefaults) && c.segmentDefaults.length ? c.segmentDefaults.map((s) => String(s).toLowerCase()) : (Array.isArray(c.segments) ? c.segments : ["heltid"]),
      plan: c.plan || "Bas",
      about: c.description || c.about || "",
      perks: Array.isArray(c.perks) ? c.perks : [],
      contact: c.contact || { name: user?.name || "", email: user?.email || "" },
      myRole: c.myRole || "Admin",
      members: Array.isArray(c.members) ? c.members : [],
      website: c.website || "",
    };
  }, [apiCompany, user]);

  const verified = company.verified;

  // ── Fetch everything ─────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!hasApi) { setLoading(false); return; }
    setLoading(true);
    setError(false);
    // Spåra om en KRITISK hämtning (profil/jobb/förare) faller — då ska skärmen
    // visa ett felläge med "Försök igen", inte ett "du har inga annonser"-tomläge.
    let failed = false;
    const [prof, stats, jobs, drv, organizations, inv] = await Promise.all([
      fetchMyCompanyProfile().catch(() => { failed = true; return null; }),
      fetchJobViewStats().catch(() => null),
      fetchMyJobs().catch(() => { failed = true; return null; }),
      fetchMatchingDrivers().catch(() => fetchDrivers().catch(() => { failed = true; return []; })),
      fetchMyOrganizations().catch(() => []),
      listInvites().catch(() => []),
    ]);
    setError(failed);
    if (prof) setApiCompany(prof);
    if (Array.isArray(organizations)) setOrgs(organizations);
    if (Array.isArray(inv)) setInvites(inv);

    const jobList = Array.isArray(jobs) ? jobs : [];
    // Applicants per job → candidates + pipeline stage counts
    const apps = await Promise.all(jobList.map((j) => fetchJobApplicants(j.id).then((a) => ({ jobId: j.id, applicants: Array.isArray(a) ? a : [] })).catch(() => ({ jobId: j.id, applicants: [] }))));
    const cands = [];
    const stageByJob = {};
    for (const { jobId, applicants } of apps) {
      const stages = { ...EMPTY_STAGES };
      for (const a of applicants) {
        const stage = a.pipelineStage || (a.rejectedByCompanyAt ? "avslag" : a.selectedByCompanyAt ? "anstalld" : a.reviewedByCompanyAt ? "intervjuad" : a.readByCompanyAt ? "kontaktad" : "ny");
        stages[stage] = (stages[stage] || 0) + 1;
        cands.push({
          id: a.conversationId || a.id || `${jobId}-${cands.length}`,
          name: a.driverName || a.name || "Förare",
          initials: initialsFor(a.driverName || a.name),
          jobId, stage,
          match: a.matchPct ?? a.match ?? null,
          licenses: a.licenses || [], certs: a.certificates || a.certs || [],
          exp: a.yearsExperience ?? a.exp ?? null,
          location: a.location || "",
          when: a.createdAt ? "Ny" : "",
          new: !a.readByCompanyAt,
          note: a.coverLetter || a.note || a.message || a.firstMessage || "",
          conv: { id: a.conversationId || a.id },
        });
      }
      stageByJob[jobId] = stages;
    }
    setCandidates(cands);
    setRawJobs(jobList.map((j) => ({ ...j, _stages: stageByJob[j.id] || { ...EMPTY_STAGES } })));

    const activeJobs = jobList.filter((j) => (j.status || "ACTIVE") === "ACTIVE").length;
    setKpis({
      newApps: cands.filter((c) => c.new).length,
      unread: chat.companyUnreadConversationCount || 0,
      activeJobs,
      views: stats?.totalViews ?? stats?.views ?? 0,
    });
    if (Array.isArray(drv)) {
      setDrivers(drv.map((d) => ({
        id: d.id, name: d.name, initials: initialsFor(d.name),
        licenses: d.licenses || [], certs: d.certificates || d.certs || [],
        exp: d.yearsExperience ?? d.exp ?? null, location: d.location || "", region: d.region || "",
        segment: (d.primarySegment || "heltid").toLowerCase().includes("flex") ? "vikariepool" : "heltid",
        available: d.openToWork ?? d.available ?? false, match: d.matchPct ?? d.match ?? null,
        lastActive: d.lastActive || "",
      })));
    }
    setLoading(false);
  }, [hasApi, chat.companyUnreadConversationCount]);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Derived jobs (prototype shape) ───────────────────────────────
  const jobs = useMemo(() => rawJobs.map((j) => ({
    id: j.id, title: j.title, segment: (j.segment || "FULLTIME").toLowerCase().includes("flex") ? "vikariepool" : (j.segment === "INTERNSHIP" ? "praktik" : "heltid"),
    location: j.location, type: j.employment === "vikariat" ? "Vikariat" : j.employment === "tim" ? "Timanställd" : "Heltid",
    posted: j.status === "DRAFT" ? "Utkast" : "", status: STATUS_MAP[j.status] || "aktiv", views: j.views || 0,
    stages: j._stages || { ...EMPTY_STAGES }, raw: j,
  })), [rawJobs]);

  // ── Saved drivers + driver filter (local) ────────────────────────
  const [savedDrivers, setSavedDrivers] = useState(() => new Set());
  const toggleSaveDriver = useCallback((id) => setSavedDrivers((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);
  const [driverFilter, setDriverFilter] = useState({ seg: "alla", lic: [], onlyAvail: false });

  // ── Candidate pipeline move → persists via PATCH /conversations/:id/stage ─
  // Pausa (HIDDEN) / återpublicera (ACTIVE) / ta bort (REMOVED) en annons.
  // Backend: PATCH /api/jobs/:id (ägarkontrollerad). Optimistisk + revert vid fel.
  const setJobStatus = useCallback(async (id, status) => {
    // REMOVED → ta bort ur listan direkt; annars uppdatera statusen optimistiskt.
    setRawJobs((js) => status === "REMOVED" ? js.filter((j) => j.id !== id) : js.map((j) => (j.id === id ? { ...j, status } : j)));
    if (!hasApi) return;
    try {
      await updateJob(id, { status });
      refresh();
    } catch (e) {
      refresh(); // återställ från servern vid fel
      throw e;
    }
  }, [hasApi, refresh]);

  const moveCandidate = useCallback((id, stage) => {
    let prev;
    setCandidates((cs) => cs.map((c) => { if (c.id === id) { prev = c.stage; return { ...c, stage }; } return c; })); // optimistic
    if (hasApi) setConversationStage(id, stage).catch(() => {
      // Återställ optimistisk ändring vid fel så listan inte ljuger om ett steg som inte sparades.
      setCandidates((cs) => cs.map((c) => (c.id === id ? { ...c, stage: prev } : c)));
    });
  }, [hasApi]);

  // ── Publish a job ────────────────────────────────────────────────
  const publishJob = useCallback(async (d) => {
    if (!hasApi) return;
    // Låt fel bubbla upp till anroparen (PublishSheet) så den kan visa fel +
    // behålla wizard-inputen i st f att fejka "publicerad".
    await createJob({
      title: d.title, location: d.location, region: "",
      segment: d.segment === "vikariepool" ? "FLEX" : d.segment === "praktik" ? "INTERNSHIP" : "FULLTIME",
      employment: d.type === "Vikariat" ? "vikariat" : d.type === "Timanställd" ? "tim" : "fast",
      license: d.lic, certificates: d.certs, jobType: "fjärrkörning",
      description: d.tasks || "", tasks: d.tasks ? [d.tasks] : [], offers: d.perks || [],
      experience: d.minExp ? `${d.minExp}+` : "0-1", contact: user?.email || "",
    });
    refresh();
  }, [hasApi, user, refresh]);

  // ── Contact a driver → conversation ──────────────────────────────
  const contactDriver = useCallback(async ({ driverId, jobId, jobTitle, message }) => {
    if (!hasApi) return;
    // Propagera fel → ContactDriverSheet kan visa "kunde inte skicka".
    await chat.createConversation?.({ driverId, companyId: user?.id, companyName: company.name, jobId, jobTitle, initialMessage: message, sender: "company" });
  }, [hasApi, chat, user, company.name]);

  // Returnerar promisen och sväljer INTE fel → EditCompanySheet kan await:a + fånga.
  const updateCompany = useCallback((patch) => updateMyCompanyProfile(patch).then(refresh), [refresh]);

  // ── Threads (company conversations) ──────────────────────────────
  const threads = useMemo(() => {
    const list = company.name ? (chat.getCompanyConversations?.(company.name) || chat.conversations || []) : (chat.conversations || []);
    // Koppla kandidatens pipeline-steg (ny/kontaktad/…) till tråden via konversations-id.
    const stageByConv = new Map(candidates.map((cand) => [cand.id, cand.stage]));
    return (Array.isArray(list) ? list : []).map((c) => {
      const msgs = Array.isArray(c.messages) ? c.messages : [];
      const last = msgs[msgs.length - 1];
      return { id: c.id, name: c.driverName || "Förare", initials: initialsFor(c.driverName), jobTitle: c.jobTitle || "", stage: stageByConv.get(c.id) || null, last: last ? (last.sender === "company" ? "Du: " : "") + last.content : "", when: last?.timestamp ? timeAgo(last.timestamp) : "", unread: chat.isConversationUnread ? chat.isConversationUnread(c) : (!!last && last.sender === "driver"), conv: c };
    });
  }, [chat, company.name, candidates]);

  const value = {
    loading, error, company, verified, kpis, jobs, candidates, drivers, orgs, invites,
    savedDrivers, toggleSaveDriver, driverFilter, setDriverFilter,
    moveCandidate, publishJob, contactDriver, updateCompany, setJobStatus, refresh,
    threads, chat, createInvite, revokeInvite,
    user, hasApi, logout,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
