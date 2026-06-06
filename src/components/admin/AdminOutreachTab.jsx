import React from "react";
import { T, INP, Btn, SectionCard } from "./adminShared.jsx";
import { runAgent } from "../../api/outreach.js";
import { useConfirm } from "../ConfirmDialog";

export default function AdminOutreachTab({
  outreachStats,
  outreachProspects,
  outreachTotal,
  outreachSubTab,
  setOutreachSubTab,
  outreachFilters,
  setOutreachFilters,
  scrapeRegionVal,
  setScrapeRegionVal,
  scrapeQuery,
  setScrapeQuery,
  scrapeResults,
  scrapeSelected,
  setScrapeSelected,
  scrapeLoading,
  prospectLoading,
  expandedProspect,
  setExpandedProspect,
  manualForm,
  setManualForm,
  manualLoading,
  handleScrape,
  handleImportSelected,
  handleOutreachAction,
  handleAddManual,
  loading,
  isMobile,
  setLoading,
  setError,
  setSuccess,
  loadOutreach,
}) {
  const confirm = useConfirm();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: T.text, margin: 0 }}>Outreach</p>
          <p style={{ fontSize: "var(--text-xs)", color: T.muted, margin: "3px 0 0" }}>
            Agent kör automatiskt varje måndag 09:00 — bearbetar 7 regioner/vecka på 3-veckors rotation.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn size="md" disabled={loading} onClick={async () => {
            setLoading(true);
            try {
              await runAgent({ dryRun: true });
              setSuccess("Dry run startad — se server-loggar på Railway för resultat. Inga mail skickas.");
            } catch (e) { setError(e.message || "Kunde inte starta"); }
            finally { setLoading(false); }
          }}>
            {loading ? "..." : "Dry run"}
          </Btn>
          <Btn variant="primary" size="md" disabled={loading} onClick={async () => {
            const ok = await confirm({
              tone: "danger",
              icon: "alert",
              title: "Kör agenten på riktigt?",
              body: "Agenten skrapar Hitta.se och skickar riktiga mail till åkerier. Detta går inte att ångra.",
              confirm: "Kör agent",
              confirmVariant: "danger",
            });
            if (!ok) return;
            setLoading(true);
            try {
              const data = await runAgent({ dryRun: false });
              setSuccess(data.message);
            } catch (e) { setError(e.message || "Kunde inte starta agent"); }
            finally { setLoading(false); }
          }}>
            {loading ? "Startar..." : "▶ Kör agent nu"}
          </Btn>
        </div>
      </div>

      {/* Stats bar */}
      {outreachStats && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3,1fr)" : "repeat(6,1fr)", gap: 10 }}>
          {[
            { label: "Totalt",     value: outreachStats.total ?? 0,                         color: T.text },
            { label: "Nya",        value: outreachStats.byStatus?.NEW ?? 0,                  color: T.muted },
            { label: "Berikade",   value: outreachStats.byStatus?.ENRICHED ?? 0,             color: T.indigo },
            { label: "Redo",       value: outreachStats.byStatus?.READY ?? 0,                color: T.tealBright },
            { label: "Skickade",   value: outreachStats.byStatus?.SENT ?? 0,                 color: T.green },
            { label: "Studsade",   value: (outreachStats.byStatus?.BOUNCED ?? 0),            color: T.red },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color, margin: "4px 0 0" }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {[
          { id: "prospects", label: "Prospekt" },
          { id: "scrape",    label: "Prospektera" },
          { id: "manual",    label: "+ Manuellt" },
        ].map((t) => (
          <button key={t.id} type="button" onClick={() => setOutreachSubTab(t.id)} style={{
            padding: "7px 14px", borderRadius: 9, fontSize: "var(--text-xs)", fontWeight: 700, cursor: "pointer", border: "none",
            background: outreachSubTab === t.id ? T.amber : T.card,
            color: outreachSubTab === t.id ? "#000" : T.sub,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Prospektera (scrape) ── */}
      {outreachSubTab === "scrape" && (
        <SectionCard>
          <p style={{ fontSize: "var(--text-base)", fontWeight: 700, color: T.text, marginBottom: 4 }}>Hitta åkerier på Hitta.se</p>
          <p style={{ fontSize: "var(--text-xs)", color: T.muted, marginBottom: 20 }}>AI scraper — välj region och sökterm, importera sedan valda företag.</p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr auto", gap: 10, marginBottom: 16 }}>
            <select value={scrapeRegionVal} onChange={(e) => setScrapeRegionVal(e.target.value)} style={INP}>
              {["Stockholm","Uppsala","Södermanland","Östergötland","Jönköping","Kronoberg","Kalmar","Gotland","Blekinge","Skåne","Halland","Västra Götaland","Värmland","Örebro","Västmanland","Dalarna","Gävleborg","Västernorrland","Jämtland","Västerbotten","Norrbotten"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <input value={scrapeQuery} onChange={(e) => setScrapeQuery(e.target.value)} placeholder="Sökterm (t.ex. åkeri, transport)" style={INP} />
            <Btn variant="primary" size="md" disabled={scrapeLoading} onClick={handleScrape}>
              {scrapeLoading ? "Söker..." : "Sök"}
            </Btn>
          </div>

          {scrapeResults.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <p style={{ fontSize: "var(--text-xs)", color: T.muted, margin: 0 }}>{scrapeResults.length} hittade — {scrapeSelected.size} valda</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn size="sm" onClick={() => setScrapeSelected(new Set(scrapeResults.map((_, i) => i)))}>
                    Välj alla
                  </Btn>
                  <Btn size="sm" onClick={() => setScrapeSelected(new Set())}>Avmarkera</Btn>
                  <Btn variant="primary" size="sm" disabled={scrapeSelected.size === 0 || loading} onClick={handleImportSelected}>
                    Importera valda ({scrapeSelected.size})
                  </Btn>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {scrapeResults.map((c, i) => (
                  <div key={i} onClick={() => setScrapeSelected((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                      background: scrapeSelected.has(i) ? T.indigoBg : T.card,
                      border: `1px solid ${scrapeSelected.has(i) ? T.indigoBorder : T.border}`,
                      borderRadius: 10, cursor: "pointer",
                    }}
                  >
                    <input type="checkbox" checked={scrapeSelected.has(i)} readOnly style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, color: T.text, margin: 0, fontSize: "var(--text-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.companyName}</p>
                      <p style={{ fontSize: "var(--text-2xs)", color: T.muted, margin: "2px 0 0" }}>
                        {[c.city, c.phone, c.website].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      )}

      {/* ── Manuellt ── */}
      {outreachSubTab === "manual" && (
        <SectionCard>
          <p style={{ fontSize: "var(--text-base)", fontWeight: 700, color: T.text, marginBottom: 20 }}>Lägg till prospect manuellt</p>
          <form onSubmit={handleAddManual}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Företagsnamn *</label>
                <input required value={manualForm.companyName} onChange={(e) => setManualForm((p) => ({ ...p, companyName: e.target.value }))} placeholder="Anderssons Åkeri AB" style={INP} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Webbadress</label>
                <input type="url" value={manualForm.website} onChange={(e) => setManualForm((p) => ({ ...p, website: e.target.value }))} placeholder="https://anderssonsak.se" style={INP} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>E-post</label>
                <input type="email" value={manualForm.email} onChange={(e) => setManualForm((p) => ({ ...p, email: e.target.value }))} placeholder="info@anderssonsak.se" style={INP} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Telefon</label>
                <input value={manualForm.phone} onChange={(e) => setManualForm((p) => ({ ...p, phone: e.target.value }))} placeholder="08-123 456" style={INP} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Region</label>
                <select value={manualForm.region} onChange={(e) => setManualForm((p) => ({ ...p, region: e.target.value }))} style={INP}>
                  <option value="">Välj region</option>
                  {["Stockholm","Uppsala","Södermanland","Östergötland","Jönköping","Kronoberg","Kalmar","Gotland","Blekinge","Skåne","Halland","Västra Götaland","Värmland","Örebro","Västmanland","Dalarna","Gävleborg","Västernorrland","Jämtland","Västerbotten","Norrbotten"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "var(--text-2xs)", fontWeight: 700, color: T.muted, marginBottom: 5 }}>Stad</label>
                <input value={manualForm.city} onChange={(e) => setManualForm((p) => ({ ...p, city: e.target.value }))} placeholder="Stockholm" style={INP} />
              </div>
            </div>
            <Btn type="submit" variant="primary" size="md" disabled={manualLoading}>
              {manualLoading ? "Lägger till..." : "Lägg till prospect"}
            </Btn>
          </form>
        </SectionCard>
      )}

      {/* ── Prospects table ── */}
      {outreachSubTab === "prospects" && (
        <SectionCard>
          {/* Filters */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr auto", gap: 10, marginBottom: 16 }}>
            <input value={outreachFilters.q} onChange={(e) => setOutreachFilters((p) => ({ ...p, q: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") loadOutreach(); }}
              placeholder="Sök namn / e-post / stad" style={INP} />
            <select value={outreachFilters.status} onChange={(e) => setOutreachFilters((p) => ({ ...p, status: e.target.value }))} style={INP}>
              <option value="">Alla statusar</option>
              <option value="NEW">Nya</option>
              <option value="ENRICHED">Berikade</option>
              <option value="READY">Redo</option>
              <option value="SENT">Skickade</option>
              <option value="BOUNCED">Studsade</option>
            </select>
            <select value={outreachFilters.region} onChange={(e) => setOutreachFilters((p) => ({ ...p, region: e.target.value }))} style={INP}>
              <option value="">Alla regioner</option>
              {["Stockholm","Uppsala","Södermanland","Östergötland","Jönköping","Kronoberg","Kalmar","Gotland","Blekinge","Skåne","Halland","Västra Götaland","Värmland","Örebro","Västmanland","Dalarna","Gävleborg","Västernorrland","Jämtland","Västerbotten","Norrbotten"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <Btn variant="primary" size="md" onClick={loadOutreach} disabled={loading}>Filtrera</Btn>
          </div>

          <p style={{ fontSize: "var(--text-xs)", color: T.muted, marginBottom: 12 }}>{outreachTotal} prospects</p>

          {outreachProspects.length === 0 ? (
            <p style={{ fontSize: "var(--text-sm)", color: T.muted, padding: "24px 0", textAlign: "center" }}>
              Inga prospects ännu — börja med att scrapa eller lägg till manuellt.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {outreachProspects.map((p) => {
                const isExpanded = expandedProspect === p.id;
                const isLoading = (v) => prospectLoading === p.id + v;
                const statusColor = {
                  NEW: T.muted, ENRICHED: T.indigo, READY: T.tealBright,
                  SENT: T.green, BOUNCED: T.red, UNSUBSCRIBED: T.red,
                }[p.status] || T.muted;

                return (
                  <div key={p.id} style={{
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 12, overflow: "hidden",
                  }}>
                    {/* Row */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                      cursor: "pointer",
                    }} onClick={() => setExpandedProspect(isExpanded ? null : p.id)}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, color: T.text, margin: 0, fontSize: "var(--text-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.companyName}
                        </p>
                        <p style={{ fontSize: "var(--text-2xs)", color: T.muted, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {[p.city, p.region, p.email].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                        background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}44`,
                        flexShrink: 0,
                      }}>
                        {p.status}
                      </span>
                    </div>

                    {/* Expanded */}
                    {isExpanded && (
                      <div style={{ borderTop: `1px solid ${T.border}`, padding: "12px 14px" }}>
                        {/* Actions */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: p.generatedEmail ? 12 : 0 }}>
                          {p.website && (
                            <Btn size="sm" variant="default" disabled={!!prospectLoading} onClick={() => handleOutreachAction(p.id, "enrich")}>
                              {isLoading("enrich") ? "Berikar..." : "Berika"}
                            </Btn>
                          )}
                          <Btn size="sm" variant="default" disabled={!!prospectLoading} onClick={() => handleOutreachAction(p.id, "generate")}>
                            {isLoading("generate") ? "Genererar..." : "Generera e-post"}
                          </Btn>
                          {p.generatedEmail && p.email && p.status !== "SENT" && (
                            <Btn size="sm" variant="success" disabled={!!prospectLoading} onClick={() => handleOutreachAction(p.id, "send")}>
                              {isLoading("send") ? "Skickar..." : "Skicka"}
                            </Btn>
                          )}
                          {p.sentAt && (
                            <span style={{ fontSize: "var(--text-2xs)", color: T.green, padding: "7px 0" }}>
                              ✓ Skickad {new Date(p.sentAt).toLocaleDateString("sv-SE")}
                            </span>
                          )}
                          <Btn size="sm" variant="danger" disabled={!!prospectLoading} onClick={() => handleOutreachAction(p.id, "delete")}>
                            {isLoading("delete") ? "..." : "Ta bort"}
                          </Btn>
                        </div>

                        {/* Generated email preview */}
                        {p.generatedEmail && (
                          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                              Ämne: {p.generatedSubject || "–"}
                            </p>
                            <p style={{ fontSize: "var(--text-xs)", color: T.sub, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{p.generatedEmail}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
