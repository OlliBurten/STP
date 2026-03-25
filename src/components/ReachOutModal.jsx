import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { useProfile } from "../context/ProfileContext";
import { CloseIcon, CheckIcon } from "./Icons";

export default function ReachOutModal({ driver, jobs, onClose, onSuccess }) {
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
          {mode === "general" && (
            <div className="mb-4">
              <label htmlFor="reach-company" className="block text-sm font-medium text-slate-700 mb-2">
                Ditt företag
              </label>
              <select
                id="reach-company"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-white"
              >
                <option value="">Välj företag</option>
                {user?.companyName ? (
                  <option value={user.companyName}>{user.companyName}</option>
                ) : null}
              </select>
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
            <label htmlFor="reach-message" className="block text-sm font-medium text-slate-700 mb-2">
              Meddelande
            </label>
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
