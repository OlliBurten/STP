/* ════════════════════════════════════════════════════════════
   STP — Mobil-shell (telefonram + statusbar + tab-bar)
   Importera EFTER stp-light-components.jsx:
     <script type="text/babel" src="stp-mobile-shell.jsx"></script>
   Exporterar window.MobileShell, window.DRIVER_TABS, window.COMPANY_TABS.

   <MobileShell tabs={DRIVER_TABS} active="jobb" onTab={fn} header={...}>
     ...skärmens innehåll...
   </MobileShell>
════════════════════════════════════════════════════════════ */

const DRIVER_TABS = [
  { id: "jobb",        label: "Jobb",       icon: "search" },
  { id: "sparat",      label: "Sparat",     icon: "heart" },
  { id: "ansokningar", label: "Ansökn.",    icon: "check" },
  { id: "inkorg",      label: "Inkorg",     icon: "msg", badge: 1 },
  { id: "profil",      label: "Profil",     icon: "user" },
];

const COMPANY_TABS = [
  { id: "oversikt", label: "Översikt",  icon: "building" },
  { id: "annonser", label: "Annonser",  icon: "search" },
  { id: "hitta",    label: "Förare",    icon: "user" },
  { id: "inkorg",   label: "Inkorg",    icon: "msg", badge: 3 },
  { id: "profil",   label: "Profil",    icon: "settings" },
];

const StatusBar = ({ dark }) => {
  const fg = dark ? "#fff" : "var(--ink-900)";
  return (
    <div style={{
      height: 44, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px 0 28px",
      color: fg, fontSize: 14, fontWeight: 700, fontFamily: "var(--font)",
    }}>
      <span style={{ letterSpacing: 0.3 }}>09:41</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* signal */}
        <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
          {[0,1,2,3].map(i => (
            <rect key={i} x={i*4.5} y={8 - i*2.4} width="3" height={3 + i*2.4} rx="0.7" fill={fg}/>
          ))}
        </svg>
        {/* wifi */}
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <path d="M8 9.5a1.3 1.3 0 100-2.6 1.3 1.3 0 000 2.6z" fill={fg}/>
          <path d="M3.2 5.2a7 7 0 019.6 0M5.2 7.1a4.2 4.2 0 015.6 0" stroke={fg} strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        {/* battery */}
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke={fg} strokeOpacity="0.4"/>
          <rect x="2" y="2" width="16" height="8" rx="1.6" fill={fg}/>
          <rect x="23" y="4" width="1.5" height="4" rx="0.75" fill={fg} fillOpacity="0.5"/>
        </svg>
      </div>
    </div>
  );
};

const TabBar = ({ tabs, active, onTab }) => (
  <div style={{
    flexShrink: 0, background: "var(--card)",
    borderTop: "1px solid var(--line)",
    paddingBottom: 22, paddingTop: 8,
    display: "grid", gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
  }}>
    {tabs.map(t => {
      const on = active === t.id;
      return (
        <button key={t.id} onClick={() => onTab && onTab(t.id)} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          padding: "4px 0", position: "relative",
        }}>
          <span style={{ position: "relative" }}>
            <Icon name={t.icon} size={22} color={on ? "var(--green)" : "var(--ink-400)"} stroke={on ? 2.2 : 1.9}/>
            {t.badge != null && (
              <span style={{
                position: "absolute", top: -4, right: -8,
                background: "var(--amber)", color: "#fff",
                fontSize: 9, fontWeight: 800, minWidth: 15, height: 15,
                borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 4px", border: "1.5px solid var(--card)",
              }}>{t.badge}</span>
            )}
          </span>
          <span style={{ fontSize: 10.5, fontWeight: on ? 700 : 500, color: on ? "var(--green)" : "var(--ink-500)" }}>{t.label}</span>
        </button>
      );
    })}
  </div>
);

const MobileShell = ({ tabs, active, onTab, header, footer, children, statusDark = false, statusBg = "var(--paper)", noTabs = false, contentBg = "var(--paper)" }) => {
  return (
    <div style={{
      minHeight: "100vh", background: "var(--paper-2)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
    }}>
      <div style={{
        width: 390, height: 844, maxHeight: "calc(100vh - 48px)",
        background: contentBg, borderRadius: 44,
        boxShadow: "0 40px 80px rgba(15,22,22,0.18), 0 0 0 11px #11171a, 0 0 0 12px rgba(0,0,0,0.2)",
        overflow: "hidden", position: "relative",
        display: "flex", flexDirection: "column",
      }}>
        {/* status bar */}
        <div style={{ background: statusBg, flexShrink: 0, position: "relative", zIndex: 5 }}>
          <StatusBar dark={statusDark}/>
        </div>

        {/* optional sticky header */}
        {header && <div style={{ flexShrink: 0, position: "relative", zIndex: 4 }}>{header}</div>}

        {/* scroll content */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", background: contentBg }}>
          {children}
        </div>

        {/* optional fixed footer (detail-screen CTA) */}
        {footer && <div style={{ flexShrink: 0, position: "relative", zIndex: 4 }}>{footer}</div>}

        {/* tab bar */}
        {!noTabs && <TabBar tabs={tabs} active={active} onTab={onTab}/>}
      </div>
    </div>
  );
};

Object.assign(window, { MobileShell, DRIVER_TABS, COMPANY_TABS });
