// Jobbevakning via mejl utan konto — B2C:s viktigaste fångst av besökare som
// inte är redo att registrera sig. Dubbel opt-in: bekräftelsemejl skickas.
import { useState } from "react";
import { createJobAlert } from "../api/jobAlerts";

export default function JobAlertSignup({ region = null, style }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | done | error

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || status === "sending") return;
    setStatus("sending");
    try {
      await createJobAlert({ email, region });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  const card = {
    background: "var(--card)", border: "1px solid var(--line)",
    borderRadius: "var(--r-lg)", padding: "22px 24px", ...style,
  };

  if (status === "done") {
    return (
      <div style={card}>
        <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 6 }}>Kolla din inkorg!</h3>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-600)", lineHeight: 1.6, margin: 0 }}>
          Vi har mejlat en bekräftelselänk till <strong>{email.trim()}</strong>. Klicka på den så är bevakningen igång.
        </p>
      </div>
    );
  }

  return (
    <div style={card}>
      <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--ink-900)", marginBottom: 4 }}>
        Bevaka nya jobb{region ? ` i ${region}` : ""}
      </h3>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-600)", lineHeight: 1.6, marginBottom: 14 }}>
        Få ett mejl när nya lastbilsjobb läggs upp — inget konto behövs.
      </p>
      <form onSubmit={submit} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
          placeholder="din@mejl.se"
          aria-label="E-postadress för jobbevakning"
          style={{ flex: "1 1 200px", height: 46, padding: "0 14px", borderRadius: "var(--r)", border: "1px solid var(--line-2)", background: "var(--paper)", fontSize: "var(--text-base)", fontFamily: "inherit", color: "var(--ink-900)" }}
        />
        <button
          type="submit"
          disabled={status === "sending"}
          style={{ height: 46, padding: "0 22px", borderRadius: "var(--r)", background: "var(--green)", color: "#fff", fontWeight: 700, fontSize: "var(--text-base)", border: "none", cursor: status === "sending" ? "wait" : "pointer", fontFamily: "inherit" }}
        >
          {status === "sending" ? "Skickar…" : "Bevaka"}
        </button>
      </form>
      {status === "error" && (
        <p style={{ fontSize: "var(--text-xs)", color: "var(--danger)", marginTop: 8, marginBottom: 0 }}>
          Något gick fel — kontrollera adressen och försök igen.
        </p>
      )}
      <p style={{ fontSize: "var(--text-xs)", color: "var(--ink-400)", marginTop: 10, marginBottom: 0 }}>
        Max ett mejl per dag. Avsluta när du vill med ett klick.
      </p>
    </div>
  );
}
