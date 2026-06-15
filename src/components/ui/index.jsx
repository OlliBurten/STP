/* ════════════════════════════════════════════════════════════
   STP — Delat komponentbibliotek (ljust tema)

   Portat 1:1 från designprototypens `stp-light-components.jsx`
   (STP (4)/). Samma inline-stilar och beteende — enda skillnaden
   är ESM-export istället för window-globals.

   Alla skärmar ska KOMPONERAS av dessa primitiver, precis som
   prototyperna gör. Tokens finns i src/index.css (:root).
════════════════════════════════════════════════════════════ */

/* ────── Icon — monoline SVG efter namn ────── */
export const Icon = ({ name, size = 16, color = "currentColor", stroke = 1.8, style }) => {
  const paths = {
    pin: <path d="M12 21s-7-7.5-7-12a7 7 0 1114 0c0 4.5-7 12-7 12z" />,
    check: <polyline points="4 12 10 18 20 6" />,
    edit: <path d="M14 4l6 6-12 12H2v-6z" />,
    link: <><path d="M9 15l6-6" /><path d="M10 5l-3 3a4 4 0 105.66 5.66l3-3" /><path d="M14 19l3-3a4 4 0 10-5.66-5.66l-3 3" /></>,
    copy: <><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3" /></>,
    arrow: <><polyline points="13 5 19 12 13 19" /><line x1="19" y1="12" x2="3" y2="12" /></>,
    arrowLeft: <><polyline points="11 5 5 12 11 19" /><line x1="5" y1="12" x2="21" y2="12" /></>,
    dot: <circle cx="12" cy="12" r="4" />,
    bell: <><path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21a2 2 0 004 0" /></>,
    msg: <path d="M21 11.5a8.38 8.38 0 01-8.5 8.5 8.5 8.5 0 01-3.7-.84L3 21l1.84-5.8A8.5 8.5 0 1121 11.5z" />,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    x: <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>,
    alert: <><path d="M12 9v4" /><circle cx="12" cy="17" r="0.5" fill="currentColor" /><path d="M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></>,
    info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><circle cx="12" cy="8.5" r="0.5" fill="currentColor" /></>,
    cal: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
    search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    truck: <><rect x="1" y="6" width="14" height="11" rx="1" /><polygon points="15 9 19 9 22 13 22 17 15 17 15 9" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></>,
    building: <><rect x="4" y="2" width="16" height="20" rx="1" /><line x1="9" y1="22" x2="9" y2="18" /><line x1="15" y1="22" x2="15" y2="18" /><line x1="9" y1="6" x2="9.01" y2="6" /><line x1="15" y1="6" x2="15.01" y2="6" /><line x1="9" y1="10" x2="9.01" y2="10" /><line x1="15" y1="10" x2="15.01" y2="10" /><line x1="9" y1="14" x2="9.01" y2="14" /><line x1="15" y1="14" x2="15.01" y2="14" /></>,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
    heart: <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>,
    menu: <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>,
    chevDown: <polyline points="6 9 12 15 18 9" />,
    chevRight: <polyline points="9 6 15 12 9 18" />,
    phone: <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />,
    mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22 6 12 13 2 6" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={style}>
      {paths[name] || null}
    </svg>
  );
};

/* ────── Pill / Tag ────── */
export const Pill = ({ tone = "neutral", children, icon, onRemove, size = "md" }) => {
  const tones = {
    primary: { bg: "var(--green)", color: "#fff", border: "var(--green)", shadow: "0 1px 2px rgba(30,107,91,0.20), inset 0 -1px 0 rgba(0,0,0,0.10)" },
    soft: { bg: "var(--green-tint)", color: "var(--green-text)", border: "transparent" },
    amber: { bg: "var(--amber-tint)", color: "var(--amber-text)", border: "transparent" },
    amberSolid: { bg: "var(--amber)", color: "var(--ink-900)", border: "var(--amber)" },
    success: { bg: "var(--success-tint)", color: "var(--success)", border: "transparent" },
    danger: { bg: "var(--danger-tint)", color: "var(--danger)", border: "transparent" },
    dangerSolid: { bg: "var(--danger)", color: "#fff", border: "var(--danger)" },
    info: { bg: "var(--info-tint)", color: "var(--info)", border: "transparent" },
    neutral: { bg: "var(--paper-2)", color: "var(--ink-700)", border: "transparent" },
    outline: { bg: "transparent", color: "var(--ink-700)", border: "var(--line-2)" },
  };
  const s = tones[tone] || tones.neutral;
  const sizes = {
    sm: { padding: "3px 9px", fontSize: "var(--text-2xs)" },
    md: { padding: "4px 11px", fontSize: "var(--text-xs)" },
    lg: { padding: "5px 13px", fontSize: "var(--text-sm)" },
  };
  const sz = sizes[size];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: sz.padding, borderRadius: 999, fontSize: sz.fontSize,
      fontWeight: 600, lineHeight: 1.4, whiteSpace: "nowrap",
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      boxShadow: s.shadow || "none",
    }}>
      {icon}
      {children}
      {onRemove && (
        <button onClick={onRemove} style={{ color: "inherit", opacity: 0.75, marginLeft: 2, fontSize: "var(--text-base)", lineHeight: 1 }}>×</button>
      )}
    </span>
  );
};

/* ────── Status dot ────── */
export const Dot = ({ tone = "success", size = 7 }) => {
  const map = {
    success: "var(--success)",
    danger: "var(--danger)",
    amber: "var(--amber)",
    primary: "var(--green)",
    muted: "var(--ink-400)",
  };
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: size / 2, background: map[tone], flexShrink: 0 }} />;
};

/* ────── Button ────── */
export const Button = ({ children, variant = "primary", size = "md", icon, iconRight, onClick, disabled, style, type = "button", full }) => {
  const variants = {
    primary: { bg: "var(--green)", color: "#fff", border: "1px solid var(--green-deep)", shadow: "0 1px 0 var(--green-deep), 0 1px 2px rgba(30,107,91,0.25)" },
    secondary: { bg: "#fff", color: "var(--ink-900)", border: "1px solid var(--line-2)", shadow: "var(--sh-sm)" },
    ghost: { bg: "transparent", color: "var(--ink-900)", border: "1px solid transparent" },
    dark: { bg: "var(--ink-900)", color: "#fff", border: "1px solid var(--ink-900)", shadow: "var(--sh-sm)" },
    amber: { bg: "var(--amber)", color: "var(--ink-900)", border: "1px solid var(--amber-deep)", shadow: "0 1px 0 var(--amber-deep), 0 1px 2px rgba(242,164,28,0.30)" },
    danger: { bg: "#fff", color: "var(--danger)", border: "1px solid rgba(185,28,59,0.30)" },
    link: { bg: "transparent", color: "var(--green)", border: "1px solid transparent" },
  };
  const sizes = {
    sm: { padding: "6px 12px", fontSize: "var(--text-xs)", height: 32, radius: 7 },
    md: { padding: "9px 18px", fontSize: "var(--text-base)", height: 40, radius: 9 },
    lg: { padding: "12px 22px", fontSize: "var(--text-md)", height: 46, radius: 10 },
  };
  const v = variants[variant], sz = sizes[size];
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      display: full ? "flex" : "inline-flex",
      alignItems: "center", justifyContent: "center", gap: 7,
      fontFamily: "var(--font)", fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      lineHeight: 1, whiteSpace: "nowrap",
      background: v.bg, color: v.color, border: v.border,
      boxShadow: v.shadow,
      padding: sz.padding, fontSize: sz.fontSize, height: sz.height,
      borderRadius: sz.radius,
      width: full ? "100%" : "auto",
      transition: "transform .08s, box-shadow .15s, background .15s",
      ...style,
    }}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "translateY(1px)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
};

/* ────── Card ────── */
export const Card = ({ children, padding = "26px 28px", style, className = "" }) => (
  <section className={className} style={{
    background: "var(--card)",
    border: "1px solid var(--line)",
    borderRadius: "var(--r-lg)",
    padding,
    boxShadow: "var(--sh-sm)",
    ...style,
  }}>{children}</section>
);

/* ────── SectionLabel ────── */
export const SectionLabel = ({ children, accessory, style }) => (
  <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, ...style }}>
    <h3 style={{ fontSize: "var(--text-2xs)", fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--ink-500)" }}>{children}</h3>
    {accessory}
  </header>
);

/* ────── Field — label + value pair ────── */
export const Field = ({ label, value, mono, action }) => (
  <div style={{ padding: "12px 0", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: "var(--text-2xs)", color: "var(--ink-500)", marginBottom: 4, letterSpacing: 0.3, fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: "var(--text-md)", color: "var(--ink-900)", fontWeight: 600, fontFamily: mono ? "var(--mono)" : "var(--font)", overflow: "hidden", textOverflow: "ellipsis" }}>{value || "—"}</p>
    </div>
    {action}
  </div>
);

/* ────── Tabs ────── */
export const Tabs = ({ value, onChange, items, style }) => (
  <div style={{ display: "flex", gap: 4, borderTop: "1px solid var(--line)", ...style }}>
    {items.map((it) => {
      const id = typeof it === "string" ? it : it.id;
      const label = typeof it === "string" ? it : it.label;
      const isActive = value === id;
      return (
        <button key={id} onClick={() => onChange(id)} style={{
          position: "relative", padding: "16px 20px", fontSize: "var(--text-base)",
          fontWeight: isActive ? 700 : 500,
          color: isActive ? "var(--ink-900)" : "var(--ink-500)",
          textTransform: "capitalize",
        }}>
          {label}
          {isActive && (
            <span style={{ position: "absolute", left: 20, right: 20, bottom: -1, height: 3, background: "var(--green)", borderRadius: "3px 3px 0 0" }} />
          )}
        </button>
      );
    })}
  </div>
);

/* ────── TopNav — mörk asfalt-strip ────── */
const TAB_ICON = { "Jobb": "search", "Lediga jobb": "search", "Åkerier": "truck", "Hitta förare": "search", "Annonser": "building", "Översikt": "building", "Meddelanden": "msg", "Inkorg": "msg", "Favoriter": "heart", "Mina ansökningar": "check", "Företagsprofil": "user", "Profil": "user" };

export const TopNav = ({ items, active, onActive, currentUser, brand = "STP", brandSub, rightExtras, sticky = true }) => (
  <>
  <nav style={{ background: "var(--ink-900)", color: "#e8eded", borderBottom: "1px solid #000", position: sticky ? "sticky" : "relative", top: 0, zIndex: 50 }}>
    <div className="stp-topnav-inner" style={{ maxWidth: "var(--w-app)", margin: "0 auto", padding: "0 32px", height: 60, display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 28 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "var(--text-sm)", color: "#fff", boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.25)" }}>S</div>
        <span style={{ fontWeight: 800, fontSize: "var(--text-lg)", letterSpacing: 0.5 }}>{brand}</span>
        {brandSub && (
          <span style={{ fontSize: "var(--text-2xs)", color: "rgba(232,237,237,0.5)", paddingLeft: 8, marginLeft: 4, borderLeft: "1px solid rgba(255,255,255,0.15)", fontWeight: 600, letterSpacing: 0.5 }}>{brandSub}</span>
        )}
      </div>

      <div className="stp-topnav-links" style={{ display: "flex", gap: 2, flex: 1 }}>
        {items?.map((it) => {
          const isActive = active === it.id;
          return (
            <button key={it.id} onClick={() => onActive?.(it.id)} style={{
              padding: "8px 14px", height: 36,
              background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
              borderRadius: 8,
              color: isActive ? "#fff" : "rgba(232,237,237,0.65)",
              fontSize: "var(--text-sm)", fontWeight: isActive ? 700 : 500,
              display: "inline-flex", alignItems: "center", gap: 7,
            }}>
              {it.label}
              {it.badge != null && (
                <span style={{ background: "var(--amber)", color: "var(--ink-900)", fontSize: "var(--text-2xs)", fontWeight: 800, padding: "1px 6px", borderRadius: 8, lineHeight: 1.3 }}>{it.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {rightExtras}

      {currentUser && (
        <>
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.1)", margin: "0 6px" }} />
          <button style={{ display: "flex", alignItems: "center", gap: 9, padding: "4px 6px", borderRadius: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: "var(--text-2xs)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(255,255,255,0.15)" }}>{currentUser.initials}</div>
            <span className="stp-topnav-userlabel" style={{ fontSize: "var(--text-sm)", color: "#fff", fontWeight: 600 }}>{currentUser.label}</span>
          </button>
        </>
      )}
    </div>
  </nav>
  {items?.length ? (
    <div className="stp-tabbar">
      {items.map((it) => {
        const isActive = active === it.id;
        const ic = TAB_ICON[it.label] || "menu";
        return (
          <button key={it.id} onClick={() => onActive?.(it.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 2px", background: "transparent", position: "relative" }}>
            <Icon name={ic} size={20} color={isActive ? "var(--amber)" : "rgba(232,237,237,0.6)"} stroke={2} />
            <span style={{ fontSize: "var(--text-2xs)", fontWeight: isActive ? 700 : 500, color: isActive ? "#fff" : "rgba(232,237,237,0.6)", whiteSpace: "nowrap" }}>{it.label}</span>
            {it.badge != null && <span style={{ position: "absolute", top: -1, left: "calc(50% + 6px)", background: "var(--amber)", color: "var(--ink-900)", fontSize: "var(--text-2xs)", fontWeight: 800, padding: "0 5px", borderRadius: 7, lineHeight: 1.5 }}>{it.badge}</span>}
          </button>
        );
      })}
    </div>
  ) : null}
  </>
);

/* ────── PageShell — paper-bakgrund ────── */
export const PageShell = ({ children }) => (
  <div style={{ minHeight: "100vh", background: "var(--paper)" }}>{children}</div>
);

/* ────── Container ────── */
export const Container = ({ children, maxWidth = 1240, style, padding = "32px 32px 0" }) => (
  <div style={{ maxWidth, margin: "0 auto", padding, ...style }}>{children}</div>
);

/* ────── Input ────── */
export const Input = ({ label, hint, error, icon, type = "text", ...rest }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--ink-700)", letterSpacing: 0.1 }}>{label}</span>}
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px", background: "#fff", border: `1px solid ${error ? "var(--danger)" : "var(--line-2)"}`, borderRadius: 9, height: 42, boxShadow: "var(--sh-sm)" }}>
      {icon}
      <input type={type} {...rest} style={{ flex: 1, height: "100%", border: "none", outline: "none", background: "transparent", fontSize: "var(--text-base)", color: "var(--ink-900)", fontFamily: "var(--font)" }} />
    </div>
    {hint && !error && <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)" }}>{hint}</span>}
    {error && <span style={{ fontSize: "var(--text-xs)", color: "var(--danger)", fontWeight: 600 }}>{error}</span>}
  </label>
);

/* ────── Divider ────── */
export const Divider = ({ style }) => (
  <div style={{ height: 1, background: "var(--line)", margin: "8px 0", ...style }} />
);

/* ────── Stat — stort tal + etikett ────── */
export const Stat = ({ value, label, tone = "ink", mono = true, trend }) => {
  const colors = {
    ink: "var(--ink-900)",
    primary: "var(--green)",
    success: "var(--success)",
    danger: "var(--danger)",
    amber: "var(--amber-deep)",
  };
  return (
    <div>
      <div style={{ fontSize: "var(--text-4xl)", fontWeight: 800, lineHeight: 1.1, color: colors[tone], letterSpacing: -0.5, fontFamily: mono ? "var(--mono)" : "var(--font)" }}>{value}</div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-500)", marginTop: 5, fontWeight: 600, letterSpacing: 0.2, textTransform: "uppercase" }}>{label}</div>
      {trend && (
        <div style={{ fontSize: "var(--text-xs)", color: trend.startsWith("+") ? "var(--success)" : "var(--danger)", marginTop: 3, fontWeight: 600 }}>{trend}</div>
      )}
    </div>
  );
};

/* ────── Notice — inline informationsruta ────── */
export const Notice = ({ tone = "info", title, children, action, icon }) => {
  const tones = {
    info: { bg: "var(--info-tint)", border: "rgba(27,90,138,0.18)", color: "var(--info)", iconName: "info" },
    success: { bg: "var(--success-tint)", border: "rgba(31,122,58,0.18)", color: "var(--success)", iconName: "check" },
    amber: { bg: "var(--amber-tint)", border: "rgba(242,164,28,0.22)", color: "var(--amber-text)", iconName: "alert" },
    danger: { bg: "var(--danger-tint)", border: "rgba(185,28,59,0.20)", color: "var(--danger)", iconName: "alert" },
    neutral: { bg: "var(--card-2)", border: "var(--line-2)", color: "var(--ink-700)", iconName: "info" },
  };
  const s = tones[tone] || tones.info;
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 16px", background: s.bg, border: `1px solid ${s.border}`, borderRadius: 11 }}>
      {icon !== false && <Icon name={s.iconName} size={18} color={s.color} stroke={1.8} style={{ flexShrink: 0, marginTop: 1 }} />}
      <div style={{ flex: 1, fontSize: "var(--text-sm)", lineHeight: 1.5, color: "var(--ink-700)" }}>
        {title && <div style={{ fontWeight: 700, color: "var(--ink-900)", marginBottom: 2 }}>{title}</div>}
        {children}
      </div>
      {action}
    </div>
  );
};

/* ────── Avatar ────── */
export const Avatar = ({ initials, size = 40, color = "var(--green)", style }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: color, color: "#fff", fontSize: size * 0.34, fontWeight: 800, letterSpacing: 0.3, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>{initials}</div>
);
