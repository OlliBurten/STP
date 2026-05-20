import React, { useEffect, useState } from "react";

export const T = {
  bg:          "#060f0f",
  card:        "rgba(255,255,255,0.03)",
  cardHover:   "rgba(255,255,255,0.055)",
  border:      "rgba(255,255,255,0.08)",
  text:        "#f0faf9",
  sub:         "rgba(240,250,249,0.5)",
  muted:       "rgba(240,250,249,0.28)",
  amber:       "#F5A623",
  amberBg:     "rgba(245,166,35,0.10)",
  amberBorder: "rgba(245,166,35,0.30)",
  green:       "#4ade80",
  greenBg:     "rgba(74,222,128,0.10)",
  greenBorder: "rgba(74,222,128,0.25)",
  tealBright:  "#7dd3c8",
  tealBg:      "rgba(125,211,200,0.10)",
  tealBorder:  "rgba(125,211,200,0.25)",
  red:         "#f87171",
  redBg:       "rgba(248,113,113,0.10)",
  redBorder:   "rgba(248,113,113,0.25)",
  indigo:      "#a5b4fc",
  indigoBg:    "rgba(165,180,252,0.10)",
  indigoBorder:"rgba(165,180,252,0.25)",
};

export const INP = {
  background: "rgba(255,255,255,0.05)",
  border: `1px solid rgba(255,255,255,0.1)`,
  borderRadius: 10,
  color: T.text,
  padding: "9px 12px",
  fontSize: 13,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

export function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

export function fmtDate(value) {
  if (!value) return "–";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleString("sv-SE");
}

export function Btn({ variant = "default", size = "sm", disabled, onClick, children, title, type = "button", fullWidth }) {
  const base = {
    borderRadius: 9,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    fontSize: size === "sm" ? 12 : 13,
    padding: size === "sm" ? "7px 13px" : "10px 20px",
    border: "none",
    transition: "opacity 0.15s",
    whiteSpace: "nowrap",
    width: fullWidth ? "100%" : undefined,
    display: fullWidth ? "block" : "inline-block",
  };
  const v = {
    default: { background: "rgba(255,255,255,0.07)", color: T.sub, border: `1px solid ${T.border}` },
    primary: { background: T.amber, color: "#000" },
    success: { background: T.greenBg, color: T.green, border: `1px solid ${T.greenBorder}` },
    danger:  { background: T.redBg,   color: T.red,   border: `1px solid ${T.redBorder}` },
    warning: { background: T.amberBg, color: T.amber,  border: `1px solid ${T.amberBorder}` },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title} style={{ ...base, ...v[variant] }}>
      {children}
    </button>
  );
}

export function StatusBadge({ value }) {
  const map = {
    ACTIVE:     { bg: T.greenBg,  color: T.green,  border: T.greenBorder,  label: "Aktiv" },
    HIDDEN:     { bg: T.amberBg,  color: T.amber,  border: T.amberBorder,  label: "Dold" },
    REMOVED:    { bg: T.redBg,    color: T.red,    border: T.redBorder,    label: "Borttagen" },
    VERIFIED:   { bg: T.greenBg,  color: T.green,  border: T.greenBorder,  label: "Verifierad" },
    PENDING:    { bg: T.amberBg,  color: T.amber,  border: T.amberBorder,  label: "Väntar" },
    REJECTED:   { bg: T.redBg,    color: T.red,    border: T.redBorder,    label: "Avslad" },
    OPEN:       { bg: T.redBg,    color: T.red,    border: T.redBorder,    label: "Öppen" },
    IN_REVIEW:  { bg: T.amberBg,  color: T.amber,  border: T.amberBorder,  label: "Granskas" },
    RESOLVED:   { bg: T.greenBg,  color: T.green,  border: T.greenBorder,  label: "Löst" },
    DISMISSED:  { bg: T.card,     color: T.muted,  border: T.border,       label: "Avfärdat" },
    PUBLISHED:  { bg: T.greenBg,  color: T.green,  border: T.greenBorder,  label: "Publicerat" },
    DRIVER:     { bg: T.tealBg,   color: T.tealBright, border: T.tealBorder, label: "Förare" },
    COMPANY:    { bg: T.indigoBg, color: T.indigo, border: T.indigoBorder, label: "Åkeri" },
    Admin:      { bg: T.amberBg,  color: T.amber,  border: T.amberBorder,  label: "Admin" },
  };
  const s = map[value] || { bg: T.card, color: T.muted, border: T.border, label: value };
  return (
    <span style={{
      display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
      padding: "3px 8px", borderRadius: 99, background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

export function KpiCard({ label, value, sub, urgent, teal, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: urgent ? T.amberBg : (teal ? T.tealBg : T.card),
      border: `1px solid ${urgent ? T.amberBorder : (teal ? T.tealBorder : T.border)}`,
      borderRadius: 14, padding: "18px 20px",
      cursor: onClick ? "pointer" : "default",
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        color: urgent ? T.amber : (teal ? T.tealBright : T.muted), marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, margin: "0 0 4px",
        color: urgent ? T.amber : (teal ? T.tealBright : T.text) }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>{sub}</p>}
    </div>
  );
}

export function SectionCard({ children }) {
  const isMobile = useIsMobile();
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 20,
      padding: isMobile ? "16px" : "28px 32px",
    }}>
      {children}
    </div>
  );
}
