import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { useProfile } from "../context/ProfileContext";
import { useIsMobile } from "../hooks/useIsMobile";
import { CloseIcon, CheckIcon } from "./Icons";
import { suggestMessage } from "../api/ai.js";

export default function ReachOutModal({ driver, jobs, onClose, onSuccess }) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { createConversation } = useChat();
  const { profile } = useProfile();
  const [mode, setMode] = useState("general");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [sending, setSending] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  const selectedJob = selectedJobId ? jobs.find((j) => j.id === selectedJobId) : null;
  const effectiveCompany = mode === "invite" && selectedJob ? selectedJob.company : companyName;

  const driverEmail =
    driver.id === profile.id && profile.showEmailToCompanies ? profile.email : driver.showEmailToCompanies ? driver.email : null;
  const driverPhone =
    driver.id === profile.id && profile.showPhoneToCompanies ? profile.phone : driver.showPhoneToCompanies ? driver.phone : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;

    const job = mode === "invite" && selectedJobId ? jobs.find((j) => j.id === selectedJobId) : null;
    setSending(true);
    try {
      const id = await createConversation({
        driverId: driver.id,
        companyId: user?.id,
        driverName: driver.name,
        companyName: effectiveCompany,
        jobId: job?.id || null,
        jobTitle: job?.title || null,
        initialMessage: text,
        sender: "company",
        driverEmail,
        driverPhone,
      });
      setConversationId(id);
      setSubmitted(true);
      onSuccess?.();
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    if (isMobile) {
      return (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end" }}>
          <div style={{ width: "100%", background: "#0d1f1f", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 99, background: "rgba(74,222,128,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#4ade80" }}>
              <CheckIcon className="w-6 h-6" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f0faf9", marginBottom: 8 }}>Förfrågan skickad</div>
            <p style={{ fontSize: 14, color: "rgba(240,250,249,0.65)", lineHeight: 1.55, marginBottom: 24 }}>
              Din förfrågan har skickats till {driver.name}.
            </p>
            <Link
              to={`/foretag/meddelanden/${conversationId}`}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "15px", borderRadius: 14, background: "#1F5F5C", color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none", marginBottom: 12 }}
            >
              Öppna konversation
            </Link>
            <button type="button" onClick={onClose} style={{ width: "100%", padding: "12px", background: "transparent", border: "none", color: "rgba(240,250,249,0.5)", fontSize: 14, cursor: "pointer" }}>
              Stäng
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-green-700">
            <CheckIcon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Förfrågan skickad</h2>
          <p className="mt-2 text-slate-600">
            Din förfrågan har skickats till {driver.name}. Föraren får ett meddelande via Sveriges Transportplattform.
          </p>
          <Link
            to={`/foretag/meddelanden/${conversationId}`}
            className="mt-6 inline-flex items-center justify-center w-full px-6 py-3 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-light)]"
          >
            Öppna konversation
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 block w-full text-sm text-slate-600 hover:text-slate-900"
          >
            Stäng
          </button>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div style={{ width: "100%", background: "#0d1f1f", borderRadius: "24px 24px 0 0", padding: "20px 20px 40px", maxHeight: "90vh", overflowY: "auto", animation: "slideUp 0.25s ease-out" }}>
          {/* Drag handle */}
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.15)", margin: "0 auto 20px" }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#f0faf9" }}>Kontakta {driver.name}</div>
            <button type="button" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 99, background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(240,250,249,0.5)" }}>
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>

          <p style={{ fontSize: 13, color: "rgba(240,250,249,0.55)", marginBottom: 18, lineHeight: 1.5 }}>
            All kommunikation sker via Sveriges Transportplattform.
          </p>

          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {["general", "invite"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                style={{ flex: 1, padding: "10px", borderRadius: 11, fontSize: 13, fontWeight: 700, cursor: "pointer", background: mode === m ? "#1F5F5C" : "rgba(255,255,255,0.05)", border: `1px solid ${mode === m ? "rgba(31,95,92,0.5)" : "rgba(255,255,255,0.08)"}`, color: mode === m ? "#fff" : "rgba(240,250,249,0.6)" }}
              >
                {m === "general" ? "Generell förfrågan" : "Bjud in till jobb"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === "general" && companyName && (
              <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 11, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 13, color: "rgba(240,250,249,0.65)" }}>
                Från: <span style={{ fontWeight: 700, color: "#f0faf9" }}>{companyName}</span>
              </div>
            )}

            {mode === "invite" && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(240,250,249,0.55)", marginBottom: 8 }}>Välj jobb</div>
                <select
                  required
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0faf9", fontSize: 14, outline: "none" }}
                >
                  <option value="" style={{ background: "#0d1f1f" }}>Välj jobb</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id} style={{ background: "#0d1f1f" }}>{j.title} – {j.company}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(240,250,249,0.55)" }}>Meddelande</div>
                <button
                  type="button"
                  onClick={async () => {
                    setSuggesting(true);
                    try {
                      const data = await suggestMessage({ driverId: driver.id, jobId: selectedJobId || undefined });
                      if (data?.suggestion) setMessage(data.suggestion);
                    } catch (_) {}
                    setSuggesting(false);
                  }}
                  disabled={suggesting}
                  style={{ fontSize: 12, fontWeight: 600, color: "#7dd3c8", background: "none", border: "none", cursor: "pointer", opacity: suggesting ? 0.5 : 1, padding: 0 }}
                >
                  {suggesting ? "Skriver..." : "Förslag"}
                </button>
              </div>
              <textarea
                rows={4}
                required
                placeholder={mode === "invite" ? "Skriv ett kort meddelande till föraren om jobbet..." : "Skriv vad du vill diskutera..."}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f0faf9", fontSize: 14, outline: "none", resize: "none", lineHeight: 1.55, boxSizing: "border-box" }}
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              style={{ width: "100%", padding: "15px", borderRadius: 14, background: "linear-gradient(135deg,#F5A623,#d97706)", border: "none", color: "#000", fontSize: 15, fontWeight: 800, cursor: "pointer", opacity: sending ? 0.7 : 1 }}
            >
              {sending ? "Skickar..." : mode === "invite" ? "Bjud in" : "Skicka förfrågan"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Kontakta {driver.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
            aria-label="Stäng"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <p className="text-slate-600 mb-4 text-sm">
          All kommunikation sker via Sveriges Transportplattform. Föraren behöver inte dela kontaktuppgifter.
        </p>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode("general")}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "general"
                ? "bg-[var(--color-primary)] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Generell förfrågan
          </button>
          <button
            type="button"
            onClick={() => setMode("invite")}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "invite"
                ? "bg-[var(--color-primary)] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Bjud in till jobb
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "general" && companyName && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
              Från: <span className="font-medium">{companyName}</span>
            </div>
          )}

          {mode === "invite" && (
            <div className="mb-4">
              <label htmlFor="reach-job" className="block text-sm font-medium text-slate-700 mb-2">
                Välj vilket jobb du bjuder in till
              </label>
              <select
                id="reach-job"
                required={mode === "invite"}
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white"
              >
                <option value="">Välj jobb</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} – {j.company}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="reach-message" className="block text-sm font-medium text-slate-700">
                Meddelande
              </label>
              <button
                type="button"
                onClick={async () => {
                  setSuggesting(true);
                  try {
                    const data = await suggestMessage({
                      driverId: driver.id,
                      jobId: selectedJobId || undefined,
                    });
                    if (data?.suggestion) setMessage(data.suggestion);
                  } catch (_) {}
                  setSuggesting(false);
                }}
                disabled={suggesting}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline disabled:opacity-50"
              >
                {suggesting ? "Skriver förslag..." : "Förslag på meddelande"}
              </button>
            </div>
            <textarea
              id="reach-message"
              rows={4}
              required
              placeholder={
                mode === "invite"
                  ? "Skriv ett kort meddelande till föraren om jobbet..."
                  : "Skriv vad du vill diskutera..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 px-4 py-3 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-light)] disabled:opacity-50"
            >
              {sending ? "Skickar..." : mode === "invite" ? "Bjud in" : "Skicka förfrågan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
