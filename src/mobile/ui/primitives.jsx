// STP Mobile — shared primitives, ported 1:1 from the STP Mobil prototypes.
import React from "react";
import Icon from "./Icon";

export const Pill = ({ tone = "neutral", children, icon, size = "md" }) => {
  const t = {
    primary: { bg: "var(--green)", c: "#fff" },
    soft: { bg: "var(--green-tint)", c: "var(--green-text)" },
    amber: { bg: "var(--amber-tint)", c: "var(--amber-text)" },
    amberSolid: { bg: "var(--amber)", c: "#fff" },
    success: { bg: "var(--success-tint)", c: "var(--success)" },
    danger: { bg: "var(--danger-tint)", c: "var(--danger)" },
    info: { bg: "var(--info-tint)", c: "var(--info)" },
    neutral: { bg: "var(--paper-2)", c: "var(--ink-700)" },
    outline: { bg: "transparent", c: "var(--ink-700)", b: "var(--line-2)" },
  }[tone];
  const sz = { sm: { p: "3px 8px", f: 11 }, md: { p: "4px 10px", f: 12 }, lg: { p: "5px 12px", f: 13 } }[size];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, padding: sz.p, borderRadius: 999,
        fontSize: sz.f, fontWeight: 600, lineHeight: 1.35, whiteSpace: "nowrap",
        background: t.bg, color: t.c, border: `1px solid ${t.b || "transparent"}`,
      }}
    >
      {icon}
      {children}
    </span>
  );
};

export const Dot = ({ tone = "success", size = 7 }) => {
  const m = {
    success: "var(--success)", danger: "var(--danger)", amber: "var(--amber)",
    primary: "var(--green)", muted: "var(--ink-400)", info: "var(--info)",
  };
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: size / 2, background: m[tone], flexShrink: 0 }} />;
};

export const Avatar = ({ initials, src, size = 40, color = "var(--green)", ring, style }) => (
  <div style={{ position: "relative", width: size, height: size, flexShrink: 0, ...style }}>
    {ring && (
      <div style={{ position: "absolute", inset: -4, borderRadius: "50%", padding: 3, background: "conic-gradient(var(--success),var(--green-soft),var(--success))" }}>
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "var(--card)" }} />
      </div>
    )}
    {src ? (
      <img src={src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
    ) : (
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, color: "#fff", fontSize: size * 0.36, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{initials}</div>
    )}
  </div>
);

export const Button = ({ children, variant = "primary", size = "md", icon, iconRight, onClick, disabled, busy, full, style, type, ariaLabel, title }) => {
  const v = {
    primary: { bg: "var(--green)", c: "#fff", b: "var(--green-deep)", sh: "0 1px 0 var(--green-deep),0 2px 6px rgba(31,95,92,0.28)" },
    secondary: { bg: "#fff", c: "var(--ink-900)", b: "var(--line-2)", sh: "var(--sh-sm)" },
    ghost: { bg: "transparent", c: "var(--ink-900)", b: "transparent" },
    dark: { bg: "var(--ink-900)", c: "#fff", b: "var(--ink-900)", sh: "var(--sh-sm)" },
    amber: { bg: "var(--amber)", c: "#fff", b: "var(--amber-deep)", sh: "0 1px 0 var(--amber-deep),0 2px 6px rgba(199,122,14,0.30)" },
    danger: { bg: "#fff", c: "var(--danger)", b: "rgba(185,28,59,0.30)" },
  }[variant];
  const sz = { sm: { p: "7px 13px", f: 12.5, h: 34, r: 9 }, md: { p: "10px 18px", f: 14, h: 44, r: 11 }, lg: { p: "13px 22px", f: 15.5, h: 52, r: 13 } }[size];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      aria-label={ariaLabel}
      title={title}
      className="press"
      style={{
        display: full ? "flex" : "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        fontWeight: 700, cursor: disabled || busy ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        lineHeight: 1, whiteSpace: "nowrap", background: v.bg, color: v.c, border: `1px solid ${v.b}`,
        boxShadow: v.sh, padding: sz.p, fontSize: sz.f, height: sz.h, borderRadius: sz.r, width: full ? "100%" : "auto", ...style,
      }}
    >
      {busy ? (
        <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: v.c, borderRadius: "50%", animation: "stpm-spin .7s linear infinite" }} />
      ) : (
        <>
          {icon}
          {children}
          {iconRight}
        </>
      )}
    </button>
  );
};

export const Label = ({ children, style }) => (
  <h3 style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--ink-500)", ...style }}>{children}</h3>
);

export const Card = ({ children, style, onClick, className = "" }) => (
  <div onClick={onClick} className={className} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--sh-sm)", ...style }}>{children}</div>
);

export const Field = ({ label, value, onChange, type = "text", placeholder, sub, inputMode, autoComplete, required, error, onBlur, disabled }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <Label style={{ marginBottom: 8 }}>{label}{required && <span style={{ color: "var(--danger)" }}> *</span>}</Label>}
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder}
      inputMode={inputMode} autoComplete={autoComplete} disabled={disabled} aria-invalid={!!error}
      style={{ width: "100%", height: 50, padding: "0 15px", borderRadius: 12, border: `1px solid ${error ? "var(--danger)" : "var(--line-2)"}`, background: disabled ? "var(--card-2)" : "#fff", fontSize: 15.5, color: disabled ? "var(--ink-400)" : "var(--ink-900)", outline: "none", WebkitAppearance: "none" }}
    />
    {error
      ? <div role="alert" style={{ fontSize: 12, color: "var(--danger)", marginTop: 6, lineHeight: 1.4, fontWeight: 600 }}>{error}</div>
      : sub && <div style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 6, lineHeight: 1.4 }}>{sub}</div>}
  </div>
);

export const SheetBack = ({ label = "Inställningar", onBack }) => (
  <button onClick={onBack} className="press" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13.5, fontWeight: 700, color: "var(--ink-500)", padding: "0 0 16px" }}>
    <Icon name="arrowLeft" size={17} color="var(--ink-500)" stroke={2.2} />
    {label}
  </button>
);

export const Switch = ({ on, onToggle, tone = "green", label }) => (
  <button
    role="switch"
    aria-checked={!!on}
    aria-label={label}
    onClick={(e) => { e.stopPropagation(); onToggle(); }}
    style={{ width: 46, height: 28, borderRadius: 14, position: "relative", flexShrink: 0, background: on ? (tone === "green" ? "var(--green)" : "var(--amber)") : "var(--ink-200)", border: "1px solid", borderColor: on ? (tone === "green" ? "var(--green-deep)" : "var(--amber-deep)") : "var(--line-2)", transition: "background .2s,border-color .2s" }}
  >
    <span style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 22, height: 22, borderRadius: 11, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.28)", transition: "left .2s cubic-bezier(.32,.72,0,1)" }} />
  </button>
);

// Skelett-platshållare för list-laddning (matchar slutlig layout, inte en spinner).
export const Skeleton = ({ height = 16, width = "100%", radius = 8, style }) => (
  <div className="stpm-skel" style={{ height, width, borderRadius: radius, ...style }} />
);

// Ett list-kort-skelett (avatar + två textrader) — används av Inkorg/Ansökt/Jobb.
export const SkeletonRow = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16 }}>
    <Skeleton height={44} width={44} radius={12} style={{ flexShrink: 0 }} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
      <Skeleton height={13} width="62%" />
      <Skeleton height={11} width="40%" />
    </div>
  </div>
);

export const Segment = ({ items, value, onChange }) => (
  <div style={{ display: "flex", background: "var(--paper-2)", borderRadius: 12, padding: 3, gap: 2 }}>
    {items.map((it) => {
      const id = typeof it === "string" ? it : it.id;
      const label = typeof it === "string" ? it : it.label;
      const badge = it.badge;
      const on = value === id;
      return (
        <button
          key={id} onClick={() => onChange(id)}
          style={{ flex: 1, padding: "8px 6px", borderRadius: 9, fontSize: 13, fontWeight: on ? 700 : 600, color: on ? "var(--ink-900)" : "var(--ink-500)", background: on ? "var(--card)" : "transparent", boxShadow: on ? "var(--sh-sm)" : "none", transition: "all .18s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
        >
          {label}
          {badge != null && <span style={{ fontSize: 10.5, fontWeight: 800, color: on ? "var(--green)" : "var(--ink-400)" }}>{badge}</span>}
        </button>
      );
    })}
  </div>
);

export const Empty = ({ icon, title, text, action }) => (
  <div style={{ padding: "54px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
    <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
      <Icon name={icon} size={28} color="var(--green)" stroke={1.8} />
    </div>
    <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--ink-900)" }}>{title}</h3>
    <p style={{ fontSize: 14, color: "var(--ink-500)", lineHeight: 1.5, maxWidth: 260 }}>{text}</p>
    {action && <div style={{ marginTop: 8 }}>{action}</div>}
  </div>
);

export const Stars = ({ n = 0, rating, size = 12 }) => {
  const value = rating != null ? Math.round(rating) : n;
  return (
    <span style={{ display: "inline-flex", gap: 1.5 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={size} stroke={0} color={i <= value ? "var(--amber)" : "var(--ink-200)"} style={{ fill: i <= value ? "var(--amber)" : "var(--ink-200)" }} />
      ))}
    </span>
  );
};
