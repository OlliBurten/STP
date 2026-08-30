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
        // Reserverar plats för cookiebannern så länge den syns. Skalet är
        // positioneringskontext för bottensheetsen, och absolutpositionerade barn
        // utgår från padding-boxen — därför lyfts även deras `bottom: 0`-rader
        // (Ansök, Visa jobb) upp ovanför bannern i stället för att hamna under.
        paddingBottom: "var(--stp-cookie-h, 0px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
