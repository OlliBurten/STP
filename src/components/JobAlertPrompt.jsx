// Bottenblad som erbjuder jobbevakning när en utloggad besökare kommer tillbaka
// till annonsen efter att ha klickat "Ansök" (ansökan öppnas i ny flik/mejlapp).
// Det är ögonblicket då intresset är som störst — och tidigare lämnade vi dem utan
// något skäl att komma tillbaka.
import { useEffect, useState } from "react";
import JobAlertSignup from "./JobAlertSignup";

export default function JobAlertPrompt({ region, licenses, onClose }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Jobbevakning"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(27,36,33,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        // Cookiebannern (zIndex 10000) ligger kvar överst för förstagångsbesökare —
        // bladet håller undan för den via dess höjd, som annonsens Ansök-rad.
        style={{ width: "100%", maxWidth: 520, background: "var(--paper)", borderRadius: "18px 18px 0 0", padding: "18px 16px calc(max(env(safe-area-inset-bottom, 16px), 16px) + var(--stp-cookie-h, 0px))", boxShadow: "0 -8px 30px rgba(0,0,0,0.15)" }}
      >
        <JobAlertSignup
          region={region}
          licenses={licenses}
          source="after_apply"
          heading="Få fler jobb som detta på mejl"
          subheading={null}
          onDone={() => setDone(true)}
          style={{ border: "none", padding: "6px 8px 0", background: "transparent" }}
        />
        <button
          onClick={onClose}
          style={{ display: "block", margin: "10px auto 0", background: "none", border: "none", color: "var(--ink-500)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", padding: 8 }}
        >
          {done ? "Stäng" : "Nej tack"}
        </button>
      </div>
    </div>
  );
}
