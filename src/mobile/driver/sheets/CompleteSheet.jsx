// Driver — profile completion bottom sheet. Ported from STP Mobil Förare
// CompleteSheet, wired to the real computed completion (shared DRIVER_ITEMS).
// Each missing item opens the profile editor (granular per-field sheets land
// with the Profil screen task).
import React from "react";
import { Icon } from "../../ui";

// Vilket sheet varje saknat fält öppnar (resten → profilredigeraren).
const SHEET_FOR = { phone: "personal", certificates: "addDoc", regionsWilling: "prefs", visibleToCompanies: "privacy" };

export default function CompleteSheet({ ctx, close }) {
  const { pct, missing } = ctx.completion;
  const R = 24;
  const C = 2 * Math.PI * R;
  return (
    <div style={{ padding: "0 22px 26px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div style={{ position: "relative", width: 56, height: 56 }}>
          <svg width="56" height="56" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="28" cy="28" r={R} fill="none" stroke="var(--paper-2)" strokeWidth="6" />
            <circle cx="28" cy="28" r={R} fill="none" stroke="var(--amber)" strokeWidth="6" strokeDasharray={`${C}`} strokeDashoffset={`${C * (1 - pct / 100)}`} strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "var(--amber-deep)", fontFamily: "var(--mono)" }}>{pct}%</div>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink-900)" }}>Nästan där</div>
          <div style={{ fontSize: 13.5, color: "var(--ink-500)" }}>Kompletta profiler får 3× fler svar.</div>
        </div>
      </div>
      {missing.length === 0 ? (
        <div style={{ textAlign: "center", padding: "10px 6px 6px" }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><Icon name="check" size={30} color="var(--success)" stroke={2.5} /></div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--ink-900)" }}>Profilen är komplett!</h3>
          <p style={{ fontSize: 14, color: "var(--ink-500)", marginTop: 4 }}>Du syns nu högst upp för åkerier.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {missing.map((m) => (
            <button key={m.key} onClick={() => ctx.setSheet({ type: SHEET_FOR[m.key] || "editProfile", focus: m.key })} className="press" style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px", background: "var(--card-2)", border: "1px solid var(--line)", borderRadius: 13, textAlign: "left", width: "100%" }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={m.icon || "user"} size={18} color="var(--green)" stroke={1.9} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>{m.label}</div><div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{m.desc || "Lägg till för att stärka din profil"}</div></div>
              <Icon name="chevRight" size={18} color="var(--ink-300)" stroke={2.2} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
