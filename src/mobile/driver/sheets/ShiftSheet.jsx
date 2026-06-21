// Driver — accept an inhopp/extra-pass. Ported from STP Mobil Förare ShiftSheet,
// wired to POST /api/shifts/:id/accept.
import React, { useState } from "react";
import { Icon, Pill, Button } from "../../ui";

export default function ShiftSheet({ shift, ctx, close }) {
  const taken = ctx.acceptedShifts.has(shift.id) || shift.status === "TAKEN";
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const accept = async () => {
    setBusy(true);
    await ctx.acceptShift(shift.id);
    setBusy(false);
    setDone(true);
    setTimeout(close, 1600);
  };

  if (done) {
    return (
      <div style={{ padding: "36px 30px 52px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ width: 74, height: 74, borderRadius: 24, background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center", animation: "stpm-pop .5s" }}><Icon name="check" size={36} color="var(--success)" stroke={2.5} /></div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink-900)" }}>Passet är ditt!</h2>
        <p style={{ fontSize: 14, color: "var(--ink-500)", lineHeight: 1.5, maxWidth: 264 }}>{shift.company} får bekräftelsen direkt. Du ser passet under Ansökt och får en påminnelse innan start.</p>
      </div>
    );
  }

  const facts = [["Datum", shift.date], ["Tid", shift.time], shift.hours ? ["Längd", `${shift.hours} tim`] : null, ["Ersättning", shift.pay]].filter(Boolean);

  return (
    <div style={{ padding: "0 22px 26px" }}>
      <div style={{ display: "flex", gap: 13, alignItems: "center", marginBottom: 16 }}>
        <div style={{ width: 50, height: 50, borderRadius: 14, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "var(--green-text)" }}>{(shift.company || "?").slice(0, 2).toUpperCase()}</div>
        <div style={{ flex: 1 }}><h2 style={{ fontSize: 19, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.3 }}>{shift.role}</h2><div style={{ fontSize: 13.5, color: "var(--ink-500)" }}>{shift.company} · {shift.location}</div></div>
        {shift.urgency && <Pill tone={shift.urgency === "Akut" ? "danger" : "amber"} size="sm">{shift.urgency}</Pill>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {facts.map(([k, v]) => (
          <div key={k} style={{ padding: "12px 14px", background: "var(--card-2)", borderRadius: 12, border: "1px solid var(--line)" }}><div style={{ fontSize: 11, color: "var(--ink-500)", fontWeight: 600, marginBottom: 3 }}>{k}</div><div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink-900)" }}>{v || "—"}</div></div>
        ))}
      </div>
      {shift.license && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--info-tint)", borderRadius: 12, marginBottom: 18 }}>
          <Icon name="info" size={17} color="var(--info)" stroke={2} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: "var(--ink-700)", lineHeight: 1.45 }}>Kräver <b>{shift.license}</b>. Tar du passet är det bindande – {shift.company} räknar med dig.</span>
        </div>
      )}
      {taken
        ? <Button variant="secondary" size="lg" full disabled icon={<Icon name="check" size={18} stroke={2.5} color="var(--success)" />}>Du har tagit passet</Button>
        : <Button variant="primary" size="lg" full busy={busy} onClick={accept} icon={<Icon name="bolt" size={18} stroke={0} style={{ fill: "#fff" }} />}>Ta passet</Button>}
    </div>
  );
}
