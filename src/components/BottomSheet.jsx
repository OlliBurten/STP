/**
 * BottomSheet — mobile bottom sheet overlay for filters/options.
 * Usage:
 *   <BottomSheet open={open} onClose={() => setOpen(false)} title="Filter">
 *     ...content...
 *   </BottomSheet>
 */
import { useEffect } from "react";

export default function BottomSheet({ open, onClose, title, children, footerLeft, footerRight }) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.6)",
          animation: "fadeIn .2s ease both",
        }}
      />
      {/* Sheet */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        background: "var(--card)",
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        maxHeight: "80vh",
        display: "flex", flexDirection: "column",
        animation: "slideUp .25s cubic-bezier(.22,1,.36,1) both",
      }}>
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{
            width: 38, height: 4, borderRadius: 99,
            background: "var(--line-2)",
          }}/>
        </div>

        {/* Header */}
        {title && (
          <div style={{
            padding: "8px 20px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.4, color: "var(--ink-900)", margin: 0 }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: 99,
                background: "var(--paper-2)", border: "none",
                color: "var(--ink-500)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
          {children}
        </div>

        {/* Footer */}
        {(footerLeft || footerRight) && (
          <div style={{
            padding: "14px 20px max(env(safe-area-inset-bottom), 20px)",
            display: "flex", gap: 10,
            background: "var(--card)",
            borderTop: "1px solid var(--line)",
            flexShrink: 0,
          }}>
            {footerLeft && (
              <button
                onClick={footerLeft.onClick}
                style={{
                  flex: 1, padding: "14px", borderRadius: 99,
                  background: "transparent", border: "1px solid var(--line-2)",
                  color: "var(--ink-500)", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {footerLeft.label}
              </button>
            )}
            {footerRight && (
              <button
                onClick={footerRight.onClick}
                style={{
                  flex: 1.5, padding: "14px", borderRadius: 99,
                  background: "var(--green)",
                  border: "none", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {footerRight.label}
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
