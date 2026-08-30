// STP Mobile — public (logged-out) job list. Ported from STP Mobil Jobb,
// wired to the real jobs API. Saving/applying opens a sign-up gate.
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchJobs } from "../../api/jobs";
import { createJobAlert } from "../../api/jobAlerts";
import { registerGuestApplyClick, trackJobView } from "../../api/jobs";
import { track } from "../../utils/posthog.js";
import { withUtm } from "../../utils/utm.js";
import { mockJobs } from "../../data/mockJobs";
import { useApi } from "../../api/client";
import { toJobView } from "../driver/jobAdapter";
import { useSheetDismiss } from "../../hooks/useSheetDismiss";
import MobileShell from "../MobileShell";
import { Icon, Pill, Card, SkeletonRow } from "../ui";

const LICENSES = ["C1", "C1E", "C", "CE"];
const TYPES = ["Heltid", "Deltid", "Praktik"];
const PAGE = 8;

// Prototypens publika jobb-vy har bara tre anställningsformer: Heltid / Deltid /
// Praktik. Riktig data har fler (Vikariat, Timanställning) — vi buntar ihop allt
// som inte är heltid/praktik till "Deltid" så skärmen följer prototypen 1:1.
const protoType = (t) => { const s = String(t).toLowerCase(); if (s.includes("praktik")) return "Praktik"; if (s.includes("heltid") || s === "fast") return "Heltid"; return "Deltid"; };

function Logo() {
  return (
    <img src="/stp-logo.png" alt="STP – Sveriges Transportplattform" style={{ height: 28, width: "auto", display: "block" }} />
  );
}

function JobCard({ job, idx = 0, saved, onOpen, onSave }) {
  const [popKey, setPopKey] = useState(0);
  return (
    <Card onClick={onOpen} className="press" style={{ padding: "15px 16px", animation: `stpm-fade-up .3s ${Math.min(idx, 8) * 0.04}s both` }}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800, fontSize: 14, color: "var(--green-text)" }}>{job.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.2, lineHeight: 1.25 }}>{job.title}</h3>
            {/* 44×44 träffyta enligt DESIGN.md §3 — knappen var 19×26, mindre än
                halva minimimåttet. Negativa marginaler håller ikonen kvar där den
                satt så kortets höjd inte ändras. */}
            <button onClick={(e) => { e.stopPropagation(); onSave(); if (!saved) setPopKey((k) => k + 1); }} style={{ flexShrink: 0, width: 44, height: 44, margin: "-11px -12px -11px 0", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Spara jobb">
              <span key={popKey} style={{ display: "inline-block", animation: saved ? "stpm-pop .4s" : "none" }}><Icon name="bookmark" size={19} color={saved ? "var(--green)" : "var(--ink-300)"} stroke={2} style={{ fill: saved ? "var(--green)" : "none" }} /></span>
            </button>
          </div>
          {/* Raden var en flexrad utan wrap, så ett långt företagsnamn tryckte ut
              orten till en egen rad längst till höger — "· Upplands Väsby" hängde
              löst i kanten och såg trasigt ut. Som löpande text radbryts den i
              stället naturligt, precis som i förarens JobCard. */}
          <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2, marginBottom: 9, lineHeight: 1.35 }}>
            {job.company}
            {job.verified && <Icon name="check2" size={14} color="var(--green)" stroke={2.2} style={{ display: "inline-block", verticalAlign: "-2px", margin: "0 3px" }} />}
            {" · "}{job.location}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            {job.licenses.map((l) => <Pill key={l} tone="outline" size="sm">{l}</Pill>)}
            <Pill tone="neutral" size="sm">{job.type}</Pill>
            {job.bemanning && <Pill tone="amber" size="sm">Bemanning</Pill>}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 11, paddingTop: 11, borderTop: "1px solid var(--line)" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-800)" }}>{job.pay}</span>
            <span style={{ fontSize: 11.5, color: "var(--ink-400)" }}>{job.posted}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function MobileGuestJobs() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const hasApi = useApi();
  const stad = params.get("stad") || "";
  const initRegion = params.get("region") || "";
  const initLic = params.get("lic") || "";

  const [rawJobs, setRawJobs] = useState([]);
  // Laddning och fel var tidigare osynliga tillstånd: listan startade som [] och
  // tom-vyn ("Inga jobb matchar") renderades medan hämtningen pågick. Den första
  // sekunden av varje kallt besök påstod alltså att sajten saknar jobb.
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState({ region: initRegion ? [initRegion] : [], lic: initLic ? [initLic] : [], type: [], hideBemanning: false });
  const [filterOpen, setFilterOpen] = useState(false);
  const [gate, setGate] = useState(null);
  // Guests can't actually save, so bookmarks always render unfilled (honest —
  // no fake fill). Kept as an empty Set so the saved.has(...) call sites work.
  const saved = useMemo(() => new Set(), []);
  const [limit, setLimit] = useState(PAGE);
  // Jobbevakning via mejl — utan konto (dubbel opt-in via bekräftelsemejl)
  const [alertEmail, setAlertEmail] = useState("");
  const [alertStatus, setAlertStatus] = useState("idle"); // idle | sending | done | error
  const submitAlert = async (e) => {
    e.preventDefault();
    if (!alertEmail.trim() || alertStatus === "sending") return;
    setAlertStatus("sending");
    try {
      await createJobAlert({ email: alertEmail, region: filter.region[0] || null, licenses: filter.lic || [] });
      setAlertStatus("done");
    } catch {
      setAlertStatus("error");
    }
  };

  // Guests can't really save — tapping a bookmark opens the sign-up gate
  // immediately (no fake fill, so it doesn't feel like bait-and-switch).
  const toggleSave = (id) => { setGate({ action: "save", jobId: id }); };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(false);
    (async () => {
      // Utan konfigurerad API-URL (lokal utveckling utan backend) visas demodata.
      // I produktion är VITE_API_URL alltid satt, så en riktig besökare når
      // aldrig hit.
      if (!hasApi) { if (alive) { setRawJobs(mockJobs); setLoading(false); } return; }
      try {
        const d = await fetchJobs();
        if (alive) setRawJobs(Array.isArray(d) ? d : []);
      } catch {
        // Föll tidigare tillbaka på mockJobs — påhittade annonser med riktiga
        // företagsnamn, omöjliga för besökaren att skilja från äkta. En förare
        // kunde försöka söka ett jobb som inte finns. Hellre ett ärligt fel.
        if (alive) { setRawJobs([]); setLoadError(true); }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [hasApi, reloadKey]);

  const jobs = useMemo(() => rawJobs.map((j) => { const v = toJobView(j); return { ...v, type: protoType(v.type) }; }), [rawJobs]);
  const regions = useMemo(() => [...new Set(jobs.map((j) => j.region).filter(Boolean))], [jobs]);

  // Jobbdetaljen låg tidigare i lokalt state utan adress. Följderna: mobilens
  // bakåtgest lämnade sajten i stället för att stänga vyn, ett jobb gick inte
  // att dela, och besöket registrerades aldrig på annonsen. Nu styr ?open=<id>
  // vyn — samma parameter som inloggnings-gaten redan skickade tillbaka till
  // (`/jobb?open=…`), en returlänk som fram tills nu inte gjorde någonting.
  const openId = params.get("open");
  const detail = useMemo(
    () => (openId ? jobs.find((j) => String(j.id) === String(openId)) || null : null),
    [openId, jobs]
  );
  // Öppning lägger till ett historiksteg; stängning ska konsumera just det.
  // En delad länk öppnas utan eget steg — då tas parametern bort i stället, så
  // att bakåt inte kastar ut besökaren till där länken kom ifrån.
  const [pushedDetail, setPushedDetail] = useState(false);
  useEffect(() => { if (!openId) setPushedDetail(false); }, [openId]);

  const openDetail = (job) => {
    const next = new URLSearchParams(params);
    next.set("open", job.id);
    setParams(next);
    setPushedDetail(true);
  };
  const closeDetail = () => {
    if (pushedDetail) { navigate(-1); return; }
    const next = new URLSearchParams(params);
    next.delete("open");
    setParams(next, { replace: true });
  };

  // Visningen räknas en gång per jobb och besök, som på den routade annonssidan.
  const viewed = useRef(new Set());
  useEffect(() => {
    if (!detail || viewed.current.has(detail.id)) return;
    viewed.current.add(detail.id);
    trackJobView(detail.id);
    track("job_viewed", { jobId: detail.id, jobTitle: detail.title, source: "guest_mobile_sheet" });
  }, [detail]);

  let list = jobs;
  if (stad) list = list.filter((j) => (j.location || "").toLowerCase() === stad.toLowerCase());
  if (filter.region.length) list = list.filter((j) => filter.region.includes(j.region));
  if (filter.lic.length) list = list.filter((j) => filter.lic.some((l) => j.licenses.includes(l)));
  if (filter.type.length) list = list.filter((j) => filter.type.some((t) => String(j.type).toLowerCase().includes(t.toLowerCase())));
  if (filter.hideBemanning) list = list.filter((j) => !j.bemanning);
  if (q.trim()) { const Q = q.toLowerCase(); list = list.filter((j) => (j.title + j.company + j.location + j.region).toLowerCase().includes(Q)); }

  const activeCount = filter.region.length + filter.lic.length + filter.type.length + (filter.hideBemanning ? 1 : 0);
  const shown = list.slice(0, limit);
  const remaining = list.length - shown.length;

  // Filtret och gaten gick bara att stänga med overlay-klick eller knapp. Bakåt
  // lämnade sajten och Escape gjorde ingenting — samma fälla som jobbvyn hade
  // före ?open=. Jobbvyn styrs av URL:en; de här två är rena overlays och får
  // därför en historikpost var i stället.
  useSheetDismiss(filterOpen, () => { setFilterOpen(false); setLimit(PAGE); });
  useSheetDismiss(!!gate, () => setGate(null));

  // Rubriken sa tidigare "Alla verifierade åkerier på ett ställe". Listan under den
  // består av importerade Platsbanken-annonser från åkerier utan STP-konto — noll
  // av dem är verifierade, och annonssidan säger själv "ej anslutet åkeri" vid
  // nästa klick. Det som faktiskt är sant är strukturen, inte verifieringen.
  let heading = "Lediga jobb", sub = "Lastbilsjobb från hela landet — strukturerade så du kan jämföra dem";
  if (stad) { heading = `Förarjobb i ${stad}`; sub = `${list.length} lediga ${list.length === 1 ? "tjänst" : "tjänster"} i ${stad}`; }
  else if (filter.region.length === 1) { heading = `Förarjobb i ${filter.region[0]}`; sub = `${list.length} lediga tjänster`; }
  else if (initLic) { heading = `${initLic}-jobb i Sverige`; sub = `${list.length} lediga tjänster`; }

  const onScroll = (e) => { const el = e.target; setScrolled(el.scrollTop > 10); if (el.scrollHeight - el.scrollTop - el.clientHeight < 240 && remaining > 0) setLimit((l) => l + PAGE); };

  // Fångsten (skapa konto + jobbevakning) låg bakom `remaining <= 0` och syntes
  // alltså först när hela listan tagit slut. Med oändlig scroll (onScroll ovan
  // laddar nästa sida så fort man närmar sig botten) flyttar sig botten undan i
  // takt med att man scrollar — på en ofiltrerad lista med 449 jobb gick kortet i
  // praktiken inte att nå. Därav en (1) skapad jobbevakning sedan start.
  // Nu ligger det inne i listan, efter de första träffarna, där det passeras.
  const PROMO_AFTER = 6;
  const promoCard = (
              <div style={{ marginTop: 14, background: "var(--night)", borderRadius: 20, padding: "24px 22px", color: "#fff" }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2, marginBottom: 8 }}>Få nya jobb först</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "rgba(255,255,255,0.7)", marginBottom: 18 }}>Skapa en gratis profil — då hittar du jobben som matchar dina behörigheter, och får en notis när nya dyker upp.</p>
                <button onClick={() => navigate("/registrera?role=forare")} className="press" style={{ width: "100%", height: 52, borderRadius: 13, background: "var(--amber-bright)", color: "#1a1200", fontWeight: 800, fontSize: 15.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>Skapa förarprofil <Icon name="arrow" size={18} color="#1a1200" stroke={2.4} /></button>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                  {alertStatus === "done" ? (
                    <p style={{ fontSize: 13.5, lineHeight: 1.5, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>Kolla din inkorg — klicka på länken i mejlet så är bevakningen igång.</p>
                  ) : (
                    <>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 10 }}>…eller få nya jobb via mejl, utan konto:</p>
                      <form onSubmit={submitAlert} style={{ display: "flex", gap: 8 }}>
                        <input type="email" required value={alertEmail} onChange={(e) => setAlertEmail(e.target.value)} placeholder="din@mejl.se" aria-label="E-postadress för jobbevakning" style={{ flex: 1, minWidth: 0, height: 46, padding: "0 13px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 14.5, fontFamily: "inherit" }} />
                        <button type="submit" disabled={alertStatus === "sending"} className="press" style={{ height: 46, padding: "0 16px", borderRadius: 12, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700, fontSize: 14 }}>{alertStatus === "sending" ? "…" : "Bevaka"}</button>
                      </form>
                      {alertStatus === "error" && <p style={{ fontSize: 12, color: "var(--amber-bright)", marginTop: 8 }}>Något gick fel — försök igen.</p>}
                    </>
                  )}
                </div>
              </div>
  );

  return (
    <MobileShell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", flexShrink: 0, borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent", background: "rgba(245,242,236,0.92)", backdropFilter: "blur(12px)" }}>
        <button onClick={() => navigate("/")} className="press" aria-label="Till startsidan" style={{ height: 44, display: "flex", alignItems: "center" }}><Logo /></button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => navigate("/login?start=login")} className="press" style={{ height: 44, padding: "0 14px", borderRadius: 11, background: "var(--card)", border: "1px solid var(--line-2)", color: "var(--ink-800)", fontWeight: 700, fontSize: 14 }}>Logga in</button>
          <button onClick={() => navigate("/registrera?role=forare")} className="press" style={{ height: 44, padding: "0 14px", borderRadius: 11, background: "var(--green)", color: "#fff", fontWeight: 700, fontSize: 14 }}>Skapa konto</button>
        </div>
      </div>
      <div className="app-scroll" onScroll={onScroll} style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "16px 20px 14px" }}>
          {(stad || initRegion || initLic) && <button onClick={() => navigate("/jobb")} className="press" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 12, fontSize: 13.5, fontWeight: 700, color: "var(--green)" }}><Icon name="arrowLeft" size={15} stroke={2.3} />Alla jobb</button>}
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1, lineHeight: 1.08, marginBottom: 6 }}>{heading}</h1>
          <p style={{ fontSize: 15.5, color: "var(--ink-500)", marginBottom: 18 }}>{sub}</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, height: 50, padding: "0 15px", background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 14 }}>
              <Icon name="search" size={19} color="var(--ink-400)" stroke={2} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Yrke, ort eller åkeri" style={{ flex: 1, alignSelf: "stretch", minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 15, color: "var(--ink-900)" }} />
              {q && <button onClick={() => setQ("")} className="press" aria-label="Rensa sökning" style={{ width: 44, height: 44, margin: "0 -13px 0 0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="x" size={17} color="var(--ink-400)" stroke={2.2} /></button>}
            </div>
            <button onClick={() => setFilterOpen(true)} className="press" style={{ width: 50, height: 50, borderRadius: 14, background: activeCount ? "var(--green)" : "var(--card)", border: activeCount ? "none" : "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <Icon name="sliders" size={20} color={activeCount ? "#fff" : "var(--ink-600)"} stroke={2} />
              {activeCount > 0 && <span style={{ position: "absolute", top: -5, right: -5, minWidth: 19, height: 19, padding: "0 5px", borderRadius: 10, background: "var(--amber-bright)", color: "#1a1200", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{activeCount}</span>}
            </button>
          </div>
        </div>
        <div style={{ padding: "0 20px 30px", display: "flex", flexDirection: "column", gap: 12 }}>
          {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={`skel-${i}`} />)}
          {!loading && loadError && (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Icon name="info" size={26} color="var(--ink-300)" stroke={1.8} /></div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Kunde inte hämta jobben</h3>
              <p style={{ fontSize: 14.5, color: "var(--ink-500)", lineHeight: 1.5, marginBottom: 18 }}>Annonserna finns kvar — det är kontakten med servern som inte gick fram.</p>
              <button onClick={() => setReloadKey((k) => k + 1)} className="press" style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 46, padding: "0 20px", borderRadius: 13, background: "var(--green)", color: "#fff", fontWeight: 700, fontSize: 14.5 }}><Icon name="arrow" size={16} color="#fff" stroke={2.4} />Försök igen</button>
            </div>
          )}
          {!loading && !loadError && shown.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Icon name="search" size={26} color="var(--ink-300)" stroke={1.8} /></div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Inga jobb matchar</h3>
              <p style={{ fontSize: 14.5, color: "var(--ink-500)", lineHeight: 1.5, marginBottom: 18 }}>Prova att rensa filtren eller söka bredare.</p>
              {(q.trim() || activeCount > 0 || stad || initRegion || initLic) && (
                <button onClick={() => { setQ(""); setFilter({ region: [], lic: [], type: [], hideBemanning: false }); setLimit(PAGE); if (stad || initRegion || initLic) navigate("/jobb"); }} className="press" style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 46, padding: "0 20px", borderRadius: 13, background: "var(--green)", color: "#fff", fontWeight: 700, fontSize: 14.5 }}><Icon name="x" size={16} color="#fff" stroke={2.4} />Rensa filter</button>
              )}
            </div>
          )}
          {shown.map((job, i) => (
            <React.Fragment key={job.id}>
              <JobCard job={job} idx={i} saved={saved.has(job.id)} onOpen={() => openDetail(job)} onSave={() => toggleSave(job.id)} />
              {i === PROMO_AFTER - 1 && promoCard}
            </React.Fragment>
          ))}
          {/* Kortare lista än PROMO_AFTER (eller noll träffar) — då hamnar kortet sist.
              Noll träffar är dessutom det bästa läget att erbjuda en bevakning. */}
          {!loading && !loadError && shown.length < PROMO_AFTER && promoCard}
          {remaining > 0 && (
            <button onClick={() => setLimit((l) => l + PAGE)} className="press" style={{ height: 50, borderRadius: 13, background: "var(--card)", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontWeight: 700, fontSize: 14.5, marginTop: 2 }}>Visa fler · {remaining} kvar</button>
          )}
        </div>
      </div>

      {/* filter sheet — inline (matchar prototypens FilterSheet 1:1: grab-handle,
          header med Filtrera + Rensa-räknare, scroll, sticky "Visa jobb"-footer) */}
      {filterOpen && (
        <div style={{ position: "absolute", inset: 0, zIndex: 70, display: "flex", alignItems: "flex-end" }}>
          <div onClick={() => { setFilterOpen(false); setLimit(PAGE); }} style={{ position: "absolute", inset: 0, background: "rgba(8,12,11,0.5)", animation: "stpm-fade-in .2s" }} />
          <div style={{ position: "relative", width: "100%", maxHeight: "82%", background: "var(--paper)", borderRadius: "26px 26px 0 0", display: "flex", flexDirection: "column", animation: "stpm-sheet-up .3s cubic-bezier(.32,.72,0,1)" }}>
            <div style={{ padding: "10px 22px 0" }}><div style={{ width: 38, height: 5, borderRadius: 3, background: "var(--line-2)", margin: "0 auto 14px" }} /></div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px 14px", borderBottom: "1px solid var(--line)" }}>
              <h3 style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.4 }}>Filtrera</h3>
              {activeCount > 0 && <button onClick={() => setFilter({ region: [], lic: [], type: [], hideBemanning: false })} className="press" style={{ fontSize: 14, fontWeight: 700, color: "var(--green)" }}>Rensa ({activeCount})</button>}
            </div>
            <div className="app-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 22px 8px" }}>
              {[["Körkort", LICENSES, "lic"], ["Anställning", TYPES, "type"], ["Region", regions, "region"]].map(([label, opts, key]) => (
                <div key={key}>
                  <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 11 }}>{label}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 24 }}>
                    {opts.map((o) => { const on = filter[key].includes(o); return <button key={o} onClick={() => setFilter((f) => ({ ...f, [key]: on ? f[key].filter((x) => x !== o) : [...f[key], o] }))} className="press" style={{ padding: "9px 15px", borderRadius: 11, fontSize: 14, fontWeight: 700, border: on ? "1px solid var(--green)" : "1px solid var(--line-2)", background: on ? "var(--green-tint)" : "var(--card)", color: on ? "var(--green-text)" : "var(--ink-600)" }}>{o}</button>; })}
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 11 }}>Arbetsgivare</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 24 }}>
                <button onClick={() => setFilter((f) => ({ ...f, hideBemanning: !f.hideBemanning }))} className="press" style={{ padding: "9px 15px", borderRadius: 11, fontSize: 14, fontWeight: 700, border: filter.hideBemanning ? "1px solid var(--green)" : "1px solid var(--line-2)", background: filter.hideBemanning ? "var(--green-tint)" : "var(--card)", color: filter.hideBemanning ? "var(--green-text)" : "var(--ink-600)" }}>Dölj bemanning</button>
              </div>
            </div>
            <div style={{ padding: "12px 22px calc(26px + var(--stpm-safe-bottom))", borderTop: "1px solid var(--line)" }}>
              <button onClick={() => { setFilterOpen(false); setLimit(PAGE); }} className="press" style={{ width: "100%", height: 54, borderRadius: 14, background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: 16 }}>Visa jobb</button>
            </div>
          </div>
        </div>
      )}

      {/* job detail */}
      {detail && (
        <div style={{ position: "absolute", inset: 0, zIndex: 60, background: "var(--paper)", display: "flex", flexDirection: "column", animation: "stpm-sheet-in .3s cubic-bezier(.32,.72,0,1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: "1px solid var(--line)", background: "rgba(245,242,236,0.95)", backdropFilter: "blur(10px)", flexShrink: 0, paddingTop: "calc(13px + var(--stpm-safe-top))" }}>
            <button onClick={closeDetail} className="press" aria-label="Tillbaka till jobblistan" style={{ width: 44, height: 44, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--card)", border: "1px solid var(--line-2)" }}><Icon name="arrowLeft" size={20} stroke={2} /></button>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{detail.title}</span>
            <button onClick={() => toggleSave(detail.id)} className="press" aria-label="Spara jobb" style={{ width: 44, height: 44, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--card)", border: "1px solid var(--line-2)" }}><Icon name="bookmark" size={19} color={saved.has(detail.id) ? "var(--green)" : "var(--ink-400)"} stroke={2} style={{ fill: saved.has(detail.id) ? "var(--green)" : "none" }} /></button>
          </div>
          <div className="app-scroll" style={{ flex: 1, overflowY: "auto", padding: "22px 20px 120px" }}>
            <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
              <div style={{ width: 54, height: 54, borderRadius: 14, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800, fontSize: 17, color: "var(--green-text)" }}>{detail.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontSize: 23, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.15, marginBottom: 5 }}>{detail.title}</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14.5, color: "var(--ink-600)", fontWeight: 600 }}><span>{detail.company}</span>{detail.verified && <Icon name="check2" size={15} color="var(--green)" stroke={2.2} />}</div>
              </div>
            </div>
            {detail.verified && (
              <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 14px", borderRadius: 12, background: "var(--green-tint)", marginBottom: 18 }}>
                <Icon name="shield" size={19} color="var(--green)" stroke={1.9} /><span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--green-text)" }}>Verifierat åkeri · org.nr kontrollerat mot Bolagsverket</span>
              </div>
            )}
            {detail.bemanning && (
              <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 14px", borderRadius: 12, background: "var(--amber-tint)", marginBottom: 18 }}>
                <Icon name="info" size={19} color="var(--amber-text)" stroke={1.9} /><span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--amber-text)" }}>Bemanningsföretag · du anställs av bemanningsbolaget, inte åkeriet</span>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginBottom: detail.deadline ? 11 : 22 }}>
              {[["Lön", detail.pay], ["Ort", detail.location], ["Omfattning", detail.type], ["Körkort", detail.licenses.join(" · ")]].map(([l, v]) => (
                <div key={l} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 13, padding: "13px 14px" }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 6 }}>{l}</div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)", lineHeight: 1.3 }}>{v}</div>
                </div>
              ))}
            </div>
            {detail.deadline && (() => {
              const d = new Date(detail.deadline);
              if (Number.isNaN(d.getTime())) return null;
              const passed = d.getTime() < Date.now();
              const fmt = d.toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 14px", borderRadius: 12, background: passed ? "var(--danger-tint)" : "var(--amber-tint)", marginBottom: 22 }}>
                  <Icon name="clock" size={17} color={passed ? "var(--danger)" : "var(--amber-deep)"} stroke={2} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: passed ? "var(--danger)" : "var(--amber-text)" }}>{passed ? `Ansökningstiden gick ut ${fmt}` : `Sök senast ${fmt}`}</span>
                </div>
              );
            })()}
            {detail.desc && <><h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 9 }}>Om tjänsten</h2><p style={{ fontSize: 15, lineHeight: 1.62, color: "var(--ink-700)", marginBottom: 24, whiteSpace: "pre-line" }}>{detail.desc}</p></>}
            {[...(detail.credentials || []), ...detail.reqs].length > 0 && <><h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 11 }}>Krav & meriter</h2><div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[...(detail.credentials || []), ...detail.reqs].map((r, i) => <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 11 }}><div style={{ width: 22, height: 22, borderRadius: 7, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}><Icon name="check" size={13} color="var(--green)" stroke={2.6} /></div><span style={{ fontSize: 14.5, lineHeight: 1.45, color: "var(--ink-700)" }}>{r}</span></div>)}</div></>}
            {detail.company && (
              <div style={{ display: "flex", alignItems: "center", gap: 13, marginTop: 24, padding: "15px 16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16 }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--green-tint)", color: "var(--green-text)", fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{(detail.company || "?").slice(0, 2).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink-900)" }}>{detail.company}</div>{detail.region && <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 1 }}>{detail.region}</div>}</div>
                <Icon name="chevRight" size={18} color="var(--ink-300)" stroke={2.2} />
              </div>
            )}
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 20px calc(22px + var(--stpm-safe-bottom))", background: "rgba(245,242,236,0.96)", backdropFilter: "blur(10px)", borderTop: "1px solid var(--line)", display: "flex", gap: 11 }}>
            <button onClick={() => toggleSave(detail.id)} className="press" style={{ height: 54, padding: "0 20px", borderRadius: 14, background: "var(--card)", border: "1px solid var(--line-2)", color: "var(--ink-800)", fontWeight: 700, fontSize: 15.5, display: "flex", alignItems: "center", gap: 8 }}><Icon name="bookmark" size={18} color={saved.has(detail.id) ? "var(--green)" : "var(--ink-500)"} stroke={2} style={{ fill: saved.has(detail.id) ? "var(--green)" : "none" }} />Spara</button>
            {detail.imported && (detail.applyEmail || detail.externalApplyUrl) ? (
              /* Helt öppet — inga gates (2026-07-09): gäster ansöker direkt hos
                 arbetsgivaren. Mejl-jobb (2026-07-15): färdigt mejl istället för
                 AF-redirect — AF är datakälla, inte destination. */
              <a
                href={detail.applyEmail
                  ? `mailto:${detail.applyEmail}?subject=${encodeURIComponent(`Ansökan: ${detail.applicationReference || detail.title}`)}&body=${encodeURIComponent(`Hej!\n\nJag söker tjänsten "${detail.title}"${detail.applicationReference ? ` (referens: ${detail.applicationReference})` : ""} som jag hittade via Transportplattformen.\n\n[Berätta kort om dig själv, din behörighet och erfarenhet.]\n\nMed vänliga hälsningar,\n`)}`
                  : withUtm(detail.externalApplyUrl)}
                target={detail.applyEmail ? undefined : "_blank"} rel="noopener noreferrer"
                onClick={() => { track("apply_initiated", { jobId: detail.id, jobTitle: detail.title, source: detail.applyEmail ? "guest_mobile_email" : "guest_mobile_external" }); registerGuestApplyClick(detail.id); }}
                className="press" style={{ flex: 1, height: 54, borderRadius: 14, background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none" }}>
                {detail.applyEmail ? "Ansök via mejl" : "Ansök hos arbetsgivaren"} <Icon name={detail.applyEmail ? "mail" : "arrow"} size={19} color="#fff" stroke={2.4} />
              </a>
            ) : (
              <button onClick={() => setGate({ action: "apply", jobId: detail.id })} className="press" style={{ flex: 1, height: 54, borderRadius: 14, background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>Ansök <Icon name="arrow" size={19} color="#fff" stroke={2.4} /></button>
            )}
          </div>
        </div>
      )}

      {/* gate — inline bottom-sheet (zIndex 80, ovanför jobbdetaljens overlay som
          ligger på zIndex 60). Matchar prototypens GateSheet 1:1. */}
      {gate && (
        <div style={{ position: "absolute", inset: 0, zIndex: 80, display: "flex", alignItems: "flex-end" }}>
          <div onClick={() => setGate(null)} style={{ position: "absolute", inset: 0, background: "rgba(8,12,11,0.55)", animation: "stpm-fade-in .2s" }} />
          <div style={{ position: "relative", width: "100%", background: "var(--paper)", borderRadius: "26px 26px 0 0", padding: "10px 22px calc(30px + var(--stpm-safe-bottom))", animation: "stpm-sheet-up .3s cubic-bezier(.32,.72,0,1)" }}>
            <div style={{ width: 38, height: 5, borderRadius: 3, background: "var(--line-2)", margin: "0 auto 20px" }} />
            <div style={{ width: 54, height: 54, borderRadius: 15, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}><Icon name="lock" size={24} color="var(--green)" stroke={1.9} /></div>
            <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8, lineHeight: 1.15 }}>{gate?.action === "apply" ? "Skapa profil för att ansöka" : "Skapa profil för att spara"}</h3>
            <p style={{ fontSize: 15.5, lineHeight: 1.55, color: "var(--ink-600)", marginBottom: 22 }}>Det är gratis för förare och tar två minuter. Med en profil kan du ansöka direkt, spara jobb och få nya matchningar.</p>
            <button onClick={() => navigate(`/registrera?role=forare${gate?.jobId ? `&from=${encodeURIComponent(`/jobb?open=${gate.jobId}`)}` : ""}`)} className="press" style={{ width: "100%", height: 54, borderRadius: 14, background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: 16, marginBottom: 11, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>Skapa förarprofil <Icon name="arrow" size={19} color="#fff" stroke={2.4} /></button>
            <button onClick={() => navigate(`/login?start=login${gate?.jobId ? `&from=${encodeURIComponent(`/jobb?open=${gate.jobId}`)}` : ""}`)} className="press" style={{ width: "100%", height: 54, borderRadius: 14, background: "var(--card)", border: "1px solid var(--line-2)", color: "var(--ink-800)", fontWeight: 700, fontSize: 16 }}>Jag har redan ett konto</button>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
