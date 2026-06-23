// Driver — Jobb (search jobs + browse åkerier). Ported from STP Mobil Förare
// JobbScreen. Job mode is fully wired to real jobs + match + saved + filter.
// Åkerier mode is wired to the companies API; the mock-only category chips are
// dropped (real companies have no `cat` field) — search + rating sort kept.
import React, { useState, useEffect } from "react";
import { Header, ScrollArea, Card, Pill, Segment, Empty, Icon, Stars, Button, SkeletonRow } from "../../ui";
import JobCard from "../JobCard";

function CompanyCard({ c, ctx }) {
  const n = ctx.companyActiveJobs(c.name).length;
  return (
    <Card className="press" onClick={() => ctx.setSheet({ type: "company", name: c.name, companyId: c.id })} style={{ padding: "15px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <div style={{ width: 50, height: 50, borderRadius: 14, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "var(--green-text)", flexShrink: 0 }}>{c.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
            {c.verified && <Icon name="check" size={14} color="#fff" stroke={3} style={{ background: "var(--success)", borderRadius: 7, padding: 2, flexShrink: 0 }} />}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-500)", marginTop: 2 }}>{[c.location, c.region].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", ")}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 7, flexWrap: "wrap" }}>
            {c.rating != null && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 700, color: "var(--ink-700)" }}><Icon name="star" size={13} color="var(--amber)" stroke={0} style={{ fill: "var(--amber)" }} />{Number(c.rating).toFixed(1)}</span>}
            <span style={{ fontSize: 12.5, color: n > 0 ? "var(--green)" : "var(--ink-400)", fontWeight: 600 }}>{n > 0 ? `${n} aktiva jobb` : "Inga aktiva jobb"}</span>
            {c.verified
              ? <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11.5, fontWeight: 700, color: "var(--success)", background: "var(--success-tint)", padding: "2px 8px", borderRadius: 7 }}><Icon name="check" size={11} stroke={3} />Verifierad</span>
              : <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-400)", background: "var(--paper-2)", padding: "2px 8px", borderRadius: 7 }}>Ej verifierad</span>}
          </div>
        </div>
        <Icon name="chevRight" size={18} color="var(--ink-300)" stroke={2.2} />
      </div>
    </Card>
  );
}

export default function JobbScreen({ ctx }) {
  const [sy, setSy] = useState(0);
  const [mode, setMode] = useState("jobb");
  const [seg, setSeg] = useState("alla");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(15);
  const [hidden, setHidden] = useState(null); // senast dolda jobbet (för Ångra-bannern)
  const savedCount = ctx.saved.size;
  const f = ctx.filter;
  const fActive = f.type !== "alla" || f.lic.length > 0 || f.cert.length > 0;
  const searchOrFilterActive = q.trim() !== "" || fActive || seg !== "alla";

  // Svep-höger döljer jobbet (lokalt, denna vy) — visa en transient Ångra-banner i ~4s.
  const onHide = (job) => {
    setHidden(job);
    setTimeout(() => setHidden((h) => (h && h.id === job.id ? null : h)), 4000);
  };
  const undoHide = () => setHidden(null);
  const clearFilters = () => { setQ(""); setSeg("alla"); ctx.setFilter({ type: "alla", lic: [], cert: [] }); };

  let list = ctx.jobs;
  if (seg === "match") list = list.filter((j) => j.match != null && j.match >= 85);
  if (seg === "sparat") list = list.filter((j) => ctx.saved.has(j.id));
  if (f.type !== "alla") list = list.filter((j) => String(j.type).toLowerCase().includes(f.type));
  if (f.lic.length) list = list.filter((j) => f.lic.some((l) => j.licenses.includes(l)));
  if (f.cert.length) list = list.filter((j) => f.cert.every((c) => (j.certificates || []).includes(c)));
  if (q) list = list.filter((j) => (j.title + j.company + j.location).toLowerCase().includes(q.toLowerCase()));
  if (hidden) list = list.filter((j) => j.id !== hidden.id);

  let comps = ctx.companies.slice().sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
  if (q) comps = comps.filter((c) => (c.name + (c.location || "") + (c.region || "")).toLowerCase().includes(q.toLowerCase()));

  const isJobb = mode === "jobb";
  const total = isJobb ? list.length : comps.length;
  useEffect(() => { setShown(15); }, [mode, seg, q, f]);
  const onScrollMore = (e) => { setSy(e.target.scrollTop); const el = e.target; if (el.scrollHeight - el.scrollTop - el.clientHeight < 340) setShown((s) => (s < total ? s + 12 : s)); };
  const remaining = total - shown;

  const filterBtn = isJobb ? (
    <button onClick={() => ctx.setSheet({ type: "filter" })} className="press" style={{ position: "relative", width: 38, height: 38, borderRadius: 11, background: fActive ? "var(--green-tint)" : "var(--card)", border: `1px solid ${fActive ? "var(--green)" : "var(--line-2)"}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--sh-sm)" }}>
      <Icon name="sliders" size={18} color={fActive ? "var(--green)" : "var(--ink-700)"} stroke={2} />
      {fActive && <span style={{ position: "absolute", top: -3, right: -3, width: 10, height: 10, borderRadius: 5, background: "var(--amber)", border: "1.5px solid var(--paper)" }} />}
    </button>
  ) : null;

  return (
    <>
      <Header title={isJobb ? "Jobb" : "Åkerier"} scrollY={sy} big={isJobb ? "Hitta jobb" : "Hitta åkerier"} sub={isJobb ? `${list.length} jobb` : `${comps.length} åkerier`} right={filterBtn} />
      <div style={{ padding: "12px 16px 12px", display: "flex", flexDirection: "column", gap: 11, flexShrink: 0, background: "var(--paper)", position: "relative", zIndex: 4, boxShadow: sy > 4 ? "0 6px 16px -8px rgba(15,22,22,0.22)" : "none", transition: "box-shadow .2s" }}>
        <Segment value={mode} onChange={setMode} items={[{ id: "jobb", label: "Jobb" }, { id: "akerier", label: "Åkerier" }]} />
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 13px", height: 44, background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 12, boxShadow: "var(--sh-sm)" }}>
          <Icon name="search" size={18} color="var(--ink-400)" stroke={2} />
          <input aria-label="Sök jobb" value={q} onChange={(e) => setQ(e.target.value)} placeholder={isJobb ? "Sök titel, åkeri, ort…" : "Sök åkeri eller ort…"} style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14.5, color: "var(--ink-900)" }} />
          {q && <button onClick={() => setQ("")}><Icon name="x" size={16} color="var(--ink-400)" stroke={2.2} /></button>}
        </div>
        {isJobb && <Segment value={seg} onChange={setSeg} items={[{ id: "alla", label: "Alla" }, { id: "match", label: "Matchande" }, { id: "sparat", label: "Sparade", badge: savedCount || null }]} />}
      </div>
      <ScrollArea onScroll={onScrollMore} onRefresh={(done) => setTimeout(done, 700)}>
        <div style={{ padding: "6px 16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          {isJobb ? (
            <>
              {list.length === 0 ? (
                ctx.jobsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : (
                  <Empty
                    icon={seg === "sparat" ? "bookmark" : "search"}
                    title={seg === "sparat" ? "Inga sparade jobb än" : "Inga träffar"}
                    text={seg === "sparat" ? "Svep ett jobbkort åt vänster eller tryck på bokmärket för att spara det till senare." : "Justera din sökning eller filtren för att se fler jobb."}
                    action={searchOrFilterActive ? <Button variant="secondary" size="sm" onClick={clearFilters}>Rensa filter</Button> : null}
                  />
                )
              ) : (
                list.slice(0, shown).map((j, i) => <JobCard key={j.id} job={j} ctx={ctx} idx={i} onHide={onHide} />)
              )}
              {remaining > 0 ? (
                <button onClick={() => setShown((s) => s + 12)} className="press" style={{ padding: "13px 0", borderRadius: 13, background: "var(--card)", border: "1px solid var(--line-2)", boxShadow: "var(--sh-sm)", fontSize: 14.5, fontWeight: 700, color: "var(--ink-800)", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>Visa fler<span style={{ fontSize: 12.5, color: "var(--ink-400)", fontWeight: 600 }}>· {remaining} kvar</span></button>
              ) : list.length > 0 && <p style={{ textAlign: "center", fontSize: 12, color: "var(--ink-400)", padding: "8px 0" }}>Svep ett kort åt vänster för att spara · höger för att dölja</p>}
            </>
          ) : (
            <>
              {comps.length === 0 ? (
                <Empty icon="building" title="Inga åkerier" text="Pröva en annan ort eller sökning." />
              ) : (
                comps.slice(0, shown).map((c) => <CompanyCard key={c.id || c.name} c={c} ctx={ctx} />)
              )}
              {remaining > 0 ? (
                <button onClick={() => setShown((s) => s + 12)} className="press" style={{ padding: "13px 0", borderRadius: 13, background: "var(--card)", border: "1px solid var(--line-2)", boxShadow: "var(--sh-sm)", fontSize: 14.5, fontWeight: 700, color: "var(--ink-800)", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>Visa fler<span style={{ fontSize: 12.5, color: "var(--ink-400)", fontWeight: 600 }}>· {remaining} kvar</span></button>
              ) : comps.length > 0 && <p style={{ textAlign: "center", fontSize: 12, color: "var(--ink-400)", padding: "8px 0", lineHeight: 1.5 }}>Alla åkerier anslutna till STP – även de utan lediga jobb just nu</p>}
            </>
          )}
        </div>
      </ScrollArea>
      {hidden && (
        <div style={{ position: "fixed", left: 16, right: 16, bottom: "calc(64px + var(--stpm-safe-bottom) + 12px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 16px", background: "var(--ink-900)", color: "#fff", borderRadius: 14, boxShadow: "0 8px 24px -8px rgba(15,22,22,0.45)", animation: "stpm-fade-up .26s both" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600 }}>
            <Icon name="x" size={15} stroke={2.2} color="rgba(255,255,255,0.7)" />Jobb dolt
          </span>
          <button onClick={undoHide} className="press" style={{ flexShrink: 0, fontSize: 13.5, fontWeight: 800, color: "var(--amber)", background: "transparent", border: "none", padding: "4px 4px" }}>Ångra</button>
        </div>
      )}
    </>
  );
}
