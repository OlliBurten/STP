// STP Mobile — public (logged-out) job list. Ported from STP Mobil Jobb,
// wired to the real jobs API. Saving/applying opens a sign-up gate.
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchJobs } from "../../api/jobs";
import { mockJobs } from "../../data/mockJobs";
import { useApi } from "../../api/client";
import { toJobView } from "../driver/jobAdapter";
import MobileShell from "../MobileShell";
import { Icon, Sheet, Pill, Card, Button } from "../ui";

const LICENSES = ["C1", "C1E", "C", "CE"];
const TYPES = ["Heltid", "Vikariat", "Praktik"];
const PAGE = 8;

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>S</span></div>
      <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.6, color: "var(--ink-900)" }}>STP</span>
    </div>
  );
}

function JobCard({ job, onOpen }) {
  return (
    <Card onClick={onOpen} className="press" style={{ padding: "15px 16px" }}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800, fontSize: 14, color: "var(--green-text)" }}>{job.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.2, lineHeight: 1.25 }}>{job.title}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-500)", marginTop: 2, marginBottom: 9 }}>
            <span>{job.company}</span>{job.verified && <Icon name="check2" size={14} color="var(--green)" stroke={2.2} />}<span>· {job.location}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            {job.licenses.map((l) => <Pill key={l} tone="outline" size="sm">{l}</Pill>)}
            <Pill tone="neutral" size="sm">{job.type}</Pill>
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
  const [params] = useSearchParams();
  const hasApi = useApi();
  const stad = params.get("stad") || "";
  const initRegion = params.get("region") || "";
  const initLic = params.get("lic") || "";

  const [rawJobs, setRawJobs] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState({ region: initRegion ? [initRegion] : [], lic: initLic ? [initLic] : [], type: [] });
  const [filterOpen, setFilterOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [gate, setGate] = useState(null);
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => {
    let alive = true;
    (async () => {
      try { const d = hasApi ? await fetchJobs() : mockJobs; if (alive) setRawJobs(Array.isArray(d) && d.length ? d : mockJobs); }
      catch { if (alive) setRawJobs(mockJobs); }
    })();
    return () => { alive = false; };
  }, [hasApi]);

  const jobs = useMemo(() => rawJobs.map((j) => toJobView(j)), [rawJobs]);
  const regions = useMemo(() => [...new Set(jobs.map((j) => j.region).filter(Boolean))], [jobs]);

  let list = jobs;
  if (stad) list = list.filter((j) => (j.location || "").toLowerCase() === stad.toLowerCase());
  if (filter.region.length) list = list.filter((j) => filter.region.includes(j.region));
  if (filter.lic.length) list = list.filter((j) => filter.lic.some((l) => j.licenses.includes(l)));
  if (filter.type.length) list = list.filter((j) => filter.type.some((t) => String(j.type).toLowerCase().includes(t.toLowerCase())));
  if (q.trim()) { const Q = q.toLowerCase(); list = list.filter((j) => (j.title + j.company + j.location + j.region).toLowerCase().includes(Q)); }

  const activeCount = filter.region.length + filter.lic.length + filter.type.length;
  const shown = list.slice(0, limit);
  const remaining = list.length - shown.length;

  let heading = "Lediga jobb", sub = "Alla verifierade åkerier på ett ställe";
  if (stad) { heading = `Förarjobb i ${stad}`; sub = `${list.length} lediga ${list.length === 1 ? "tjänst" : "tjänster"}`; }
  else if (filter.region.length === 1) { heading = `Förarjobb i ${filter.region[0]}`; sub = `${list.length} lediga tjänster`; }
  else if (initLic) { heading = `${initLic}-jobb i Sverige`; sub = `${list.length} lediga tjänster`; }

  const onScroll = (e) => { const el = e.target; setScrolled(el.scrollTop > 10); if (el.scrollHeight - el.scrollTop - el.clientHeight < 240 && remaining > 0) setLimit((l) => l + PAGE); };

  return (
    <MobileShell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", flexShrink: 0, borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent", background: "rgba(245,242,236,0.92)", backdropFilter: "blur(12px)" }}>
        <button onClick={() => navigate("/")} className="press"><Logo /></button>
        <button onClick={() => navigate("/login?start=login")} className="press" style={{ height: 38, padding: "0 16px", borderRadius: 11, background: "var(--green)", color: "#fff", fontWeight: 700, fontSize: 14 }}>Logga in</button>
      </div>
      <div className="app-scroll" onScroll={onScroll} style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "16px 20px 14px" }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1, lineHeight: 1.08, marginBottom: 6 }}>{heading}</h1>
          <p style={{ fontSize: 15.5, color: "var(--ink-500)", marginBottom: 18 }}>{sub}</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, height: 50, padding: "0 15px", background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 14 }}>
              <Icon name="search" size={19} color="var(--ink-400)" stroke={2} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Yrke, ort eller åkeri" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15, color: "var(--ink-900)" }} />
              {q && <button onClick={() => setQ("")} className="press"><Icon name="x" size={17} color="var(--ink-400)" stroke={2.2} /></button>}
            </div>
            <button onClick={() => setFilterOpen(true)} className="press" style={{ width: 50, height: 50, borderRadius: 14, background: activeCount ? "var(--green)" : "var(--card)", border: activeCount ? "none" : "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <Icon name="sliders" size={20} color={activeCount ? "#fff" : "var(--ink-600)"} stroke={2} />
              {activeCount > 0 && <span style={{ position: "absolute", top: -5, right: -5, minWidth: 19, height: 19, padding: "0 5px", borderRadius: 10, background: "var(--amber-bright)", color: "#1a1200", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{activeCount}</span>}
            </button>
          </div>
        </div>
        <div style={{ padding: "0 20px 30px", display: "flex", flexDirection: "column", gap: 12 }}>
          {shown.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Icon name="search" size={26} color="var(--ink-300)" stroke={1.8} /></div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Inga jobb matchar</h3>
              <p style={{ fontSize: 14.5, color: "var(--ink-500)", lineHeight: 1.5 }}>Prova att rensa filtren eller söka bredare.</p>
            </div>
          )}
          {shown.map((job) => <JobCard key={job.id} job={job} onOpen={() => setDetail(job)} />)}
          {remaining > 0 && (
            <button onClick={() => setLimit((l) => l + PAGE)} className="press" style={{ height: 50, borderRadius: 13, background: "var(--card)", border: "1px solid var(--line-2)", color: "var(--ink-700)", fontWeight: 700, fontSize: 14.5, marginTop: 2 }}>Visa fler · {remaining} kvar</button>
          )}
          {shown.length > 0 && remaining <= 0 && (
            <div style={{ marginTop: 14, background: "var(--night)", borderRadius: 20, padding: "24px 22px", color: "#fff" }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2, marginBottom: 8 }}>Få nya jobb först</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "rgba(255,255,255,0.7)", marginBottom: 18 }}>Skapa en gratis profil så matchar vi dig med rätt åkerier och meddelar dig när nya tjänster dyker upp.</p>
              <button onClick={() => navigate("/registrera?role=forare")} className="press" style={{ width: "100%", height: 52, borderRadius: 13, background: "var(--amber-bright)", color: "#1a1200", fontWeight: 800, fontSize: 15.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>Skapa förarprofil <Icon name="arrow" size={18} color="#1a1200" stroke={2.4} /></button>
            </div>
          )}
        </div>
      </div>

      {/* filter sheet */}
      <Sheet open={filterOpen} onClose={() => { setFilterOpen(false); setLimit(PAGE); }} title="Filtrera">
        <div style={{ padding: "20px 22px 26px" }}>
          {[["Körkort", LICENSES, "lic"], ["Anställning", TYPES, "type"], ["Region", regions, "region"]].map(([label, opts, key]) => (
            <div key={key} style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 11 }}>{label}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                {opts.map((o) => {
                  const on = filter[key].includes(o);
                  return <button key={o} onClick={() => setFilter((f) => ({ ...f, [key]: on ? f[key].filter((x) => x !== o) : [...f[key], o] }))} className="press" style={{ padding: "9px 15px", borderRadius: 11, fontSize: 14, fontWeight: 700, border: on ? "1px solid var(--green)" : "1px solid var(--line-2)", background: on ? "var(--green-tint)" : "var(--card)", color: on ? "var(--green-text)" : "var(--ink-600)" }}>{o}</button>;
                })}
              </div>
            </div>
          ))}
          <Button variant="primary" size="lg" full onClick={() => { setFilterOpen(false); setLimit(PAGE); }}>Visa jobb</Button>
        </div>
      </Sheet>

      {/* job detail */}
      {detail && (
        <div style={{ position: "absolute", inset: 0, zIndex: 60, background: "var(--paper)", display: "flex", flexDirection: "column", animation: "stpm-sheet-in .3s cubic-bezier(.32,.72,0,1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: "1px solid var(--line)", background: "rgba(245,242,236,0.95)", backdropFilter: "blur(10px)", flexShrink: 0, paddingTop: "calc(13px + var(--stpm-safe-top))" }}>
            <button onClick={() => setDetail(null)} className="press" style={{ width: 40, height: 40, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--card)", border: "1px solid var(--line-2)" }}><Icon name="arrowLeft" size={20} stroke={2} /></button>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{detail.title}</span>
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
                <Icon name="shield" size={19} color="var(--green)" stroke={1.9} /><span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--green-text)" }}>Verifierat åkeri</span>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginBottom: 22 }}>
              {[["money", "Lön", detail.pay], ["pin", "Ort", detail.location], ["clock", "Omfattning", detail.type], ["building", "Körkort", detail.licenses.join(" · ")]].map(([ic, l, v]) => (
                <div key={l} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 13, padding: "13px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}><Icon name={ic} size={15} color="var(--ink-400)" stroke={1.9} /><span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--ink-400)" }}>{l}</span></div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)", lineHeight: 1.3 }}>{v}</div>
                </div>
              ))}
            </div>
            {detail.desc && <><h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 9 }}>Om tjänsten</h2><p style={{ fontSize: 15, lineHeight: 1.62, color: "var(--ink-700)", marginBottom: 24 }}>{detail.desc}</p></>}
            {detail.reqs.length > 0 && <><h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 11 }}>Krav & meriter</h2><div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{detail.reqs.map((r, i) => <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 11 }}><div style={{ width: 22, height: 22, borderRadius: 7, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}><Icon name="check" size={13} color="var(--green)" stroke={2.6} /></div><span style={{ fontSize: 14.5, lineHeight: 1.45, color: "var(--ink-700)" }}>{r}</span></div>)}</div></>}
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 20px calc(22px + var(--stpm-safe-bottom))", background: "rgba(245,242,236,0.96)", backdropFilter: "blur(10px)", borderTop: "1px solid var(--line)", display: "flex", gap: 11 }}>
            <button onClick={() => setGate({ action: "save" })} className="press" style={{ height: 54, padding: "0 20px", borderRadius: 14, background: "var(--card)", border: "1px solid var(--line-2)", color: "var(--ink-800)", fontWeight: 700, fontSize: 15.5, display: "flex", alignItems: "center", gap: 8 }}><Icon name="bookmark" size={18} color="var(--ink-500)" stroke={2} />Spara</button>
            <button onClick={() => setGate({ action: "apply" })} className="press" style={{ flex: 1, height: 54, borderRadius: 14, background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>Ansök <Icon name="arrow" size={19} color="#fff" stroke={2.4} /></button>
          </div>
        </div>
      )}

      {/* gate */}
      <Sheet open={!!gate} onClose={() => setGate(null)}>
        <div style={{ padding: "4px 22px 30px" }}>
          <div style={{ width: 54, height: 54, borderRadius: 15, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}><Icon name="lock" size={24} color="var(--green)" stroke={1.9} /></div>
          <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8, lineHeight: 1.15 }}>{gate?.action === "apply" ? "Skapa profil för att ansöka" : "Skapa profil för att spara"}</h3>
          <p style={{ fontSize: 15.5, lineHeight: 1.55, color: "var(--ink-600)", marginBottom: 22 }}>Det är gratis för förare och tar två minuter. Med en profil kan du ansöka direkt, spara jobb och få nya matchningar.</p>
          <button onClick={() => navigate("/registrera?role=forare")} className="press" style={{ width: "100%", height: 54, borderRadius: 14, background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: 16, marginBottom: 11, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>Skapa förarprofil <Icon name="arrow" size={19} color="#fff" stroke={2.4} /></button>
          <button onClick={() => navigate("/login?start=login")} className="press" style={{ width: "100%", height: 54, borderRadius: 14, background: "var(--card)", border: "1px solid var(--line-2)", color: "var(--ink-800)", fontWeight: 700, fontSize: 16 }}>Jag har redan ett konto</button>
        </div>
      </Sheet>
    </MobileShell>
  );
}
