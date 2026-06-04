/* ════════════════════════════════════════════════════════════
   PROOF-SKÄRM — Mina ansökningar (förare), portad från
   "STP (4)/STP Mina Ansökningar Ljust.html", på layout-standarden (READ).
   Route: /preview/mina-ansokningar
════════════════════════════════════════════════════════════ */
import { useState } from "react";
import { Card, Pill, Button, Icon, Dot } from "../../components/ui";
import { AppPage, PageHeader, CardStack, LAYOUT } from "../../components/ui/layout.jsx";

const NOW = Date.now();
const daysAgo = (n) => NOW - n * 864e5;
const rel = (ts) => {
  if (ts == null) return null;
  const d = Math.floor((NOW - ts) / 864e5);
  if (d <= 0) return "idag";
  if (d === 1) return "igår";
  if (d < 7) return `för ${d} dgr sen`;
  if (d < 14) return "för 1 vecka sen";
  if (d < 30) return `för ${Math.floor(d / 7)} veckor sen`;
  return `för ${Math.floor(d / 30)} mån sen`;
};

const APPLICATIONS = [
  { id: 1, jobTitle: "CE-chaufför fjärrkörning", company: "Nordic Transport AB", logo: "NT", location: "Malmö", match: 94, salary: "34 000 kr/mån", appliedAt: daysAgo(2), seenAt: daysAgo(1), reviewAt: daysAgo(1), selectedAt: null, rejectedAt: null, unread: 1, lastMessage: "Hej Oliver! Vi har sett din profil och vill gärna prata vidare.", rejectReason: null },
  { id: 2, jobTitle: "C-chaufför distribution", company: "Stockholm Logistik", logo: "SL", location: "Stockholm", match: 81, salary: "29 000 kr/mån", appliedAt: daysAgo(5), seenAt: daysAgo(4), reviewAt: null, selectedAt: null, rejectedAt: null, unread: 0, lastMessage: null, rejectReason: null },
  { id: 3, jobTitle: "CE-chaufför tanktransporter", company: "PetrolTrans Nordic", logo: "PT", location: "Göteborg", match: 68, salary: "Enligt koll. + OB", appliedAt: daysAgo(7), seenAt: daysAgo(6), reviewAt: daysAgo(3), selectedAt: daysAgo(1), rejectedAt: null, unread: 0, lastMessage: "Välkommen! Vi vill erbjuda dig en intervju nästa vecka.", rejectReason: null },
  { id: 4, jobTitle: "Timjobb CE-chaufför", company: "FlexiDriv", logo: "FD", location: "Varberg", match: 62, salary: "320 kr/tim", appliedAt: daysAgo(11), seenAt: null, reviewAt: null, selectedAt: null, rejectedAt: null, unread: 0, lastMessage: null, rejectReason: null },
  { id: 5, jobTitle: "Lokalchaufför C, dagskift", company: "Svensk Cementering", logo: "SC", location: "Uppsala", match: 57, salary: "28 500 kr/mån", appliedAt: daysAgo(18), seenAt: daysAgo(16), reviewAt: daysAgo(14), selectedAt: null, rejectedAt: daysAgo(12), unread: 0, lastMessage: null, rejectReason: "Vi gick vidare med en kandidat som hade mer lokalkännedom." },
];

const stageOf = (a) => a.selectedAt ? "selected" : a.rejectedAt ? "rejected" : a.reviewAt ? "review" : a.seenAt ? "seen" : "applied";
const NAV_ITEMS = [
  { id: "jobb", label: "Jobb" }, { id: "ansokningar", label: "Mina ansökningar" },
  { id: "meddelanden", label: "Meddelanden", badge: 1 }, { id: "favoriter", label: "Favoriter" },
];
const ME = { initials: "OH", label: "Oliver Harburt" };

const STAGES = [{ key: "applied", label: "Skickad" }, { key: "seen", label: "Sedd" }, { key: "review", label: "I urval" }, { key: "decision", label: "Beslut" }];

const StageTracker = ({ app }) => {
  const reached = { applied: true, seen: !!app.seenAt, review: !!app.reviewAt, decision: !!(app.selectedAt || app.rejectedAt) };
  const isRejected = !!app.rejectedAt, isSelected = !!app.selectedAt;
  const activeColor = isRejected ? "var(--danger)" : isSelected ? "var(--success)" : "var(--amber)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 4 }}>
      {STAGES.map((s, i) => {
        const done = reached[s.key];
        const isLast = i === STAGES.length - 1;
        const isCurrent = (s.key === "decision" && reached.decision) || (!reached.decision && ((s.key === "review" && reached.review) || (s.key === "seen" && reached.seen && !reached.review) || (s.key === "applied" && !reached.seen)));
        const dotColor = !done ? "var(--ink-200)" : s.key === "decision" ? activeColor : isCurrent ? activeColor : "var(--green)";
        const label = s.key === "decision" ? (isSelected ? "Utvald" : isRejected ? "Ej aktuell" : "Beslut") : s.label;
        return (
          <div key={s.key} style={{ display: "flex", alignItems: "center", flex: isLast ? "0 0 auto" : 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <span style={{ width: 18, height: 18, borderRadius: 9, background: done ? dotColor : "var(--paper-2)", border: done ? "none" : "2px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {done && (s.key === "decision" && isRejected ? <Icon name="x" size={10} color="#fff" stroke={3} /> : <Icon name="check" size={10} color="#fff" stroke={3} />)}
              </span>
              <span style={{ fontSize: 11, fontWeight: isCurrent ? 700 : 500, color: done ? (isCurrent ? "var(--ink-900)" : "var(--ink-500)") : "var(--ink-400)", whiteSpace: "nowrap" }}>{label}</span>
            </div>
            {!isLast && <div style={{ flex: 1, height: 2, margin: "0 6px", marginBottom: 22, background: reached[STAGES[i + 1].key] ? "var(--green)" : "var(--line-2)" }} />}
          </div>
        );
      })}
    </div>
  );
};

const statusPill = (app) => {
  const s = stageOf(app);
  if (s === "selected") return <Pill tone="success" icon={<Dot tone="success" size={6} />}>Utvald</Pill>;
  if (s === "rejected") return <Pill tone="danger">Ej aktuell</Pill>;
  if (s === "review") return <Pill tone="amber" icon={<Dot tone="amber" size={6} />}>I urval</Pill>;
  if (s === "seen") return <Pill tone="info">Sedd av åkeriet</Pill>;
  return <Pill tone="neutral">Skickad</Pill>;
};

const AppCard = ({ app }) => (
  <Card padding="22px 24px" style={{ cursor: "pointer" }}>
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 18 }}>
      <div style={{ width: 48, height: 48, borderRadius: 11, flexShrink: 0, background: "var(--paper-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "var(--ink-700)" }}>{app.logo}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 16.5, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3, marginBottom: 3 }}>{app.jobTitle}</h3>
            <div style={{ fontSize: 13.5, color: "var(--ink-500)" }}><span style={{ fontWeight: 600, color: "var(--ink-700)" }}>{app.company}</span> · {app.location}</div>
          </div>
          {statusPill(app)}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-900)", fontFamily: "var(--mono)" }}>{app.salary}</span>
          <span style={{ fontSize: 12.5, color: "var(--ink-500)" }}>Ansökt {rel(app.appliedAt)}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 700, color: app.match >= 85 ? "var(--success)" : app.match >= 70 ? "var(--green)" : "var(--ink-500)", fontFamily: "var(--mono)" }}>{app.match}% match</span>
        </div>
      </div>
    </div>
    <StageTracker app={app} />
    {(app.lastMessage || app.rejectReason) && (
      <div style={{ marginTop: 18, padding: "12px 14px", borderRadius: 10, background: app.rejectReason ? "var(--card-2)" : "var(--green-tint)", border: `1px solid ${app.rejectReason ? "var(--line)" : "var(--green-tint-2)"}`, display: "flex", gap: 11, alignItems: "flex-start" }}>
        <Icon name={app.rejectReason ? "info" : "msg"} size={16} color={app.rejectReason ? "var(--ink-500)" : "var(--green-text)"} stroke={1.9} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ flex: 1, fontSize: 13, color: "var(--ink-700)", lineHeight: 1.5 }}>
          {app.rejectReason ? <><strong style={{ color: "var(--ink-900)" }}>Återkoppling:</strong> {app.rejectReason}</> : app.lastMessage}
        </div>
        {app.lastMessage && <Button variant={app.unread ? "primary" : "secondary"} size="sm" style={{ flexShrink: 0 }}>{app.unread ? "Svara" : "Visa"}</Button>}
      </div>
    )}
  </Card>
);

export default function MinaAnsokningarPreview() {
  const [nav, setNav] = useState("ansokningar");
  const [tab, setTab] = useState("all");

  const counts = {
    all: APPLICATIONS.length,
    active: APPLICATIONS.filter((a) => !a.selectedAt && !a.rejectedAt).length,
    selected: APPLICATIONS.filter((a) => a.selectedAt).length,
    closed: APPLICATIONS.filter((a) => a.rejectedAt).length,
  };
  const list = APPLICATIONS.filter((a) => tab === "all" ? true : tab === "active" ? (!a.selectedAt && !a.rejectedAt) : tab === "selected" ? !!a.selectedAt : !!a.rejectedAt);
  const tabsDef = [{ k: "all", l: "Alla", c: counts.all }, { k: "active", l: "Aktiva", c: counts.active }, { k: "selected", l: "Utvald", c: counts.selected }, { k: "closed", l: "Ej aktuell", c: counts.closed }];

  const tabsEl = tabsDef.map((t) => {
    const isActive = tab === t.k;
    return (
      <button key={t.k} onClick={() => setTab(t.k)} style={{ padding: "12px 18px 14px", position: "relative", fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? "var(--ink-900)" : "var(--ink-500)", display: "inline-flex", alignItems: "center", gap: 8 }}>
        {t.l}
        <span style={{ padding: "1px 8px", borderRadius: 999, background: isActive ? "var(--green-tint)" : "var(--paper-2)", color: isActive ? "var(--green-text)" : "var(--ink-500)", fontSize: 11, fontWeight: 800 }}>{t.c}</span>
        {isActive && <span style={{ position: "absolute", left: 18, right: 18, bottom: -1, height: 3, background: "var(--green)", borderRadius: "3px 3px 0 0" }} />}
      </button>
    );
  });

  return (
    <AppPage
      width="read"
      nav={{ items: NAV_ITEMS, active: nav, onActive: setNav, currentUser: ME }}
      header={<PageHeader width="read" eyebrow="För förare" title="Mina ansökningar" sub="Följ statusen på dina ansökningar — från skickad till beslut." tabs={tabsEl} />}
    >
      <CardStack gap={14} className="stp-fade-up">
        {list.length === 0 ? (
          <Card padding="56px 32px" style={{ textAlign: "center" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-900)", marginBottom: 6 }}>Inga ansökningar här</h3>
            <p style={{ fontSize: 14, color: "var(--ink-500)" }}>När du söker jobb dyker de upp här med status.</p>
          </Card>
        ) : list.map((app) => <AppCard key={app.id} app={app} />)}
      </CardStack>
    </AppPage>
  );
}
