// Driver — apply bottom sheet. Ported from STP Mobil Förare ApplySheet.
// "Skapa med AI" generates a client-side draft from the real profile (no live
// model call — flagged as a discrepancy). Submit records the application
// locally this turn; real submission lands with the Ansökt screen wiring.
import React, { useState } from "react";
import { Icon, Label, Button } from "../../ui";
import { suggestMessage } from "../../../api/ai";

export default function ApplySheet({ job, ctx, close }) {
  const [done, setDone] = useState(false);
  const [consent, setConsent] = useState(false);
  const [msg, setMsg] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const imp = job.imported;
  const p = ctx.profile;

  // Real AI first-message suggestion (driver). Falls back to a local draft.
  const genDraft = async () => {
    setAiBusy(true);
    try {
      const res = ctx.hasApi ? await suggestMessage({ jobId: job.id }) : null;
      const text = res?.message || res?.suggestion || (typeof res === "string" ? res : "");
      if (text) { setMsg(text); return; }
      const lic = Array.isArray(p.licenses) && p.licenses.length ? p.licenses.join(" ") : "C/CE";
      const where = p.location || p.region || "södra Sverige";
      setMsg(`Hej!\n\nJag har ${lic}-behörighet och erfarenhet som förare i ${where}. Tjänsten som ${job.title} hos ${job.company} passar mig väl – jag tar ansvar för både fordon och leverans.\n\nMed vänlig hälsning,\n${p.name || ""}`);
    } catch { /* ignore */ } finally {
      setAiBusy(false);
    }
  };

  const submit = async () => {
    if (imp && !consent) return;
    setSending(true);
    // ctx.apply sparar optimistiskt lokalt och sväljer nätverksfel. Men om nätet
    // hänger (kall/långsam prod-backend) får knappen ALDRIG snurra för evigt —
    // timeouta efter 12s och fortsätt (Ansökt-vyn reconciliar riktig status).
    try {
      await Promise.race([
        ctx.apply(job, { message: msg, consent }),
        new Promise((resolve) => setTimeout(resolve, 12000)),
      ]);
    } catch { /* optimistiskt redan satt */ }
    setSending(false);
    setDone(true);
    setTimeout(close, 1700);
  };

  if (done) {
    return (
      <div style={{ padding: "40px 30px 56px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ width: 74, height: 74, borderRadius: 24, background: "var(--success-tint)", display: "flex", alignItems: "center", justifyContent: "center", animation: "stpm-pop .5s" }}>
          <Icon name="check" size={36} color="var(--success)" stroke={2.5} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink-900)" }}>{imp ? "Ansökan mottagen!" : "Ansökan skickad!"}</h2>
        <p style={{ fontSize: 14, color: "var(--ink-500)", lineHeight: 1.5, maxWidth: 262 }}>
          {imp
            ? `Vi kontaktar nu ${job.company} åt dig. Du följer allt under Ansökt — svar kan dröja eftersom företaget inte är på STP än.`
            : `${job.company} har fått din profil. Du ser status under Ansökt.`}
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 22px 26px" }}>
      <div style={{ display: "flex", gap: 11, alignItems: "center", padding: "13px 14px", background: "var(--card-2)", borderRadius: 13, border: "1px solid var(--line)", marginBottom: 16 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "var(--green-text)", flexShrink: 0 }}>{job.initials}</div>
        <div style={{ minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink-900)" }}>{job.title}</div><div style={{ fontSize: 13, color: "var(--ink-500)" }}>{job.company}</div></div>
      </div>
      {imp ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 16, padding: "15px 15px", background: "var(--info-tint)", borderRadius: 13 }}>
          {[["1", "Vi tar emot din ansökan i STP"], ["2", `Vi kontaktar ${job.company} och skickar din profil`], ["3", "Du följer allt här under Ansökt"]].map(([n, t]) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 26, height: 26, borderRadius: 13, background: "var(--info)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{n}</div>
              <span style={{ fontSize: 13.5, color: "var(--ink-800)", lineHeight: 1.4 }}>{t}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", background: "var(--success-tint)", borderRadius: 12, marginBottom: 16 }}>
          <Icon name="check" size={18} color="var(--success)" stroke={2.5} />
          <span style={{ fontSize: 13.5, color: "var(--ink-800)", fontWeight: 600, lineHeight: 1.4 }}>Din profil, körkort och behörigheter bifogas automatiskt.</span>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 9 }}>
        <Label style={{ margin: 0, minWidth: 0 }}>Meddelande <span style={{ textTransform: "none", fontWeight: 500, color: "var(--ink-400)" }}>(valfritt)</span></Label>
        <button onClick={genDraft} disabled={aiBusy} className="press" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 800, color: "var(--amber-deep)", whiteSpace: "nowrap", flexShrink: 0 }}>
          <Icon name={aiBusy ? "refresh" : "spark"} size={14} color="var(--amber-deep)" stroke={aiBusy ? 2.2 : 0} style={aiBusy ? { animation: "stpm-spin .8s linear infinite" } : { fill: "var(--amber-deep)" }} />
          {aiBusy ? "Skriver…" : "Skapa med AI"}
        </button>
      </div>
      <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Berätta kort varför du passar för rollen – eller låt AI skriva åt dig…" style={{ width: "100%", minHeight: 96, padding: "13px 14px", borderRadius: 12, border: "1px solid var(--line-2)", background: "var(--card-2)", fontSize: 14.5, lineHeight: 1.5, outline: "none", resize: "none", color: "var(--ink-900)", marginBottom: 16, fontFamily: "var(--font)" }} />
      {imp && (
        <button onClick={() => setConsent((c) => !c)} style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "13px 14px", background: consent ? "var(--green-tint)" : "var(--card-2)", border: `1px solid ${consent ? "var(--green)" : "var(--line-2)"}`, borderRadius: 12, marginBottom: 16, textAlign: "left", width: "100%", transition: "background .15s,border-color .15s" }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, background: consent ? "var(--green)" : "#fff", border: `1px solid ${consent ? "var(--green-deep)" : "var(--line-2)"}`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>{consent && <Icon name="check" size={15} color="#fff" stroke={3} />}</div>
          <span style={{ fontSize: 13, color: "var(--ink-700)", lineHeight: 1.45 }}>Jag godkänner att STP skickar min profil till {job.company}.</span>
        </button>
      )}
      <Button variant="primary" size="lg" full onClick={submit} busy={sending} disabled={imp && !consent} icon={<Icon name={imp ? "forward" : "send"} size={17} stroke={2} />}>{imp ? "Skicka & vidarebefordra" : "Skicka ansökan"}</Button>
    </div>
  );
}
