// STP Mobile — outer shell.
// Full-viewport, palette-scoped container that:
//   • applies the `.stp-mobile` warm-palette token layer (desktop untouched),
//   • fills the viewport as a flex column (header / scroll / tab bar),
//   • is the positioning context for absolutely-positioned bottom sheets,
//   • respects the top safe-area inset (replaces the mockup status bar).
import React from "react";
import "./mobile.css";

export default function MobileShell({ children, style }) {
  return (
    <div
      className="stp-mobile"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--paper)",
        overflow: "hidden",
        paddingTop: "var(--stpm-safe-top)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
