/* PROOF — Bekräftelsedialoger, från "STP Dialoger Ljust.html". Route: /preview/dialoger */
import { useState } from "react";
import { Button, Icon } from "../../components/ui";

const DIALOGS = {
  deleteAccount: { tone: "danger", icon: "alert", title: "Radera ditt konto?", body: "All din data — profil, ansökningar och meddelanden — raderas permanent. Detta går inte att ångra.", confirm: "Radera konto", confirmVariant: "danger", typed: "RADERA" },
  unpublish: { tone: "amber", icon: "eye", title: "Avpublicera annonsen?", body: "Annonsen tas bort från sök och slutar matchas mot förare. Pågående konversationer påverkas inte. Du kan publicera den igen senare.", confirm: "Avpublicera", confirmVariant: "primary" },
  withdraw: { tone: "amber", icon: "x", title: "Dra tillbaka ansökan?", body: "Åkeriet ser inte längre din ansökan till CE-chaufför fjärrkörning. Du kan söka igen så länge annonsen är aktiv.", confirm: "Dra tillbaka", confirmVariant: "danger" },
  suspend: { tone: "danger", icon: "alert", title: "Stäng av detta konto?", body: "Användaren TONY KARLSSON kan inte längre logga in. Profilen döljs från sök tills kontot återaktiveras.", confirm: "Stäng av konto", confirmVariant: "danger" },
  logout: { tone: "neutral", icon: "user", title: "Logga ut?", body: "Du loggas ut från STP på den här enheten.", confirm: "Logga ut", confirmVariant: "dark" },
  rejectCand: { tone: "amber", icon: "x", title: "Avböj kandidat?", body: "Erik Johansson flyttas till Avböjda. Du kan skicka en valfri återkoppling — det uppskattas av förare.", confirm: "Avböj", confirmVariant: "danger", note: true },
};

const Dialog = ({ d, onClose }) => {
  const [typed, setTyped] = useState("");
  const toneIcon = { danger: ["var(--danger)", "var(--danger-tint)"], amber: ["var(--amber-deep)", "var(--amber-tint)"], neutral: ["var(--ink-700)", "var(--paper-2)"] }[d.tone];
  const canConfirm = !d.typed || typed === d.typed;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,22,22,0.5)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 100 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: "var(--card)", borderRadius: 18, boxShadow: "0 30px 70px rgba(15,22,22,0.3)", padding: "28px 28px 24px" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: toneIcon[1], display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}><Icon name={d.icon} size={24} color={toneIcon[0]} stroke={2} /></div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink-900)", letterSpacing: -0.4, marginBottom: 10 }}>{d.title}</h2>
        <p style={{ fontSize: 14.5, color: "var(--ink-500)", lineHeight: 1.6, marginBottom: d.typed || d.note ? 18 : 24, textWrap: "pretty" }}>{d.body}</p>
        {d.note && <textarea placeholder="Återkoppling (valfritt) — t.ex. vad som saknades" rows={2} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "var(--card-2)", border: "1px solid var(--line-2)", fontSize: 13.5, color: "var(--ink-900)", outline: "none", fontFamily: "var(--font)", lineHeight: 1.5, resize: "vertical", marginBottom: 20 }} />}
        {d.typed && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginBottom: 8 }}>Skriv <strong style={{ color: "var(--danger)", fontFamily: "var(--mono)" }}>{d.typed}</strong> för att bekräfta</div>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={d.typed} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "var(--card-2)", border: `1px solid ${typed && !canConfirm ? "var(--danger)" : "var(--line-2)"}`, fontSize: 14.5, color: "var(--ink-900)", outline: "none", fontFamily: "var(--mono)" }} />
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" size="md" full onClick={onClose}>Avbryt</Button>
          <Button variant={d.confirmVariant} size="md" full onClick={onClose} disabled={!canConfirm}>{d.confirm}</Button>
        </div>
      </div>
    </div>
  );
};

export default function DialogerPreview() {
  const [open, setOpen] = useState("deleteAccount");
  const items = [["deleteAccount", "Radera konto"], ["unpublish", "Avpublicera annons"], ["withdraw", "Dra tillbaka ansökan"], ["suspend", "Stäng av (admin)"], ["rejectCand", "Avböj kandidat"], ["logout", "Logga ut"]];
  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <div style={{ padding: "20px 32px", borderBottom: "1px solid var(--line)", background: "var(--card)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13 }}>S</div>
        <span style={{ fontWeight: 800, fontSize: 15, color: "var(--ink-900)" }}>STP</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-500)", letterSpacing: 1, textTransform: "uppercase", paddingLeft: 8, marginLeft: 2, borderLeft: "1px solid var(--line-2)" }}>Bekräftelsedialoger</span>
      </div>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 32px" }}>
        <p style={{ fontSize: 14, color: "var(--ink-500)", marginBottom: 20 }}>Klicka för att förhandsgranska varje dialog. Destruktiva åtgärder kräver bekräftelse — "Radera konto" kräver att man skriver ordet.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {items.map(([k, l]) => <button key={k} onClick={() => setOpen(k)} style={{ padding: "16px 18px", borderRadius: 12, background: "var(--card)", border: "1px solid var(--line-2)", boxShadow: "var(--sh-sm)", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14.5, fontWeight: 600, color: "var(--ink-900)" }}>{l}<Icon name="chevRight" size={16} color="var(--ink-300)" stroke={2} /></button>)}
        </div>
      </div>
      {open && <Dialog d={DIALOGS[open]} onClose={() => setOpen(null)} />}
    </div>
  );
}
