import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { useChat } from "../context/ChatContext";
import { CloseIcon, CheckIcon } from "./Icons";

export default function ApplyModal({ job, onClose, onSuccess }) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { createConversation } = useChat();
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = message.trim() || "Hej, jag är intresserad av detta jobb.";
    setSending(true);
    try {
      const id = await createConversation({
        driverId: user?.id ?? profile.id,
        companyId: job.userId,
        driverName: profile.name,
        companyName: job.company,
        jobId: job.id,
        jobTitle: job.title,
        initialMessage: text,
        sender: "driver",
        driverEmail: profile.showEmailToCompanies ? profile.email : null,
        driverPhone: profile.showPhoneToCompanies ? profile.phone : null,
      });
      setConversationId(id);
      setSubmitted(true);
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
          <h2 className="text-xl font-bold text-slate-900">Ansökan skickad</h2>
          <p className="mt-2 text-slate-600">
            Din profil har skickats till {job.company}. Du kan fortsätta konversationen via meddelanden.
          </p>
          <Link
            to={`/meddelanden/${conversationId}`}
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
        <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600">
          <p className="font-medium text-slate-800">Vad händer efter ansökan?</p>
          <p className="mt-1">Företaget får din profil och meddelande. De kan markera dig som &quot;Utvald&quot; eller svara i chatten. Du får notiser här i plattformen.</p>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Ansök med din profil</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
            aria-label="Stäng"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <p className="text-slate-600 mb-6">
          Du ansöker till <strong>{job.title}</strong> på {job.company}. Din profil kommer att delas
          med företaget – inget CV behövs. Ni kan chatta direkt via Sveriges Transportplattform.
        </p>

        <div className="mb-6 p-4 bg-slate-50 rounded-lg">
          <p className="text-lg font-medium text-slate-900">{profile.name}</p>
          <p className="text-sm text-slate-600">
            {profile.licenses?.join(", ")} • {profile.certificates?.join(", ")}
          </p>
          <p className="text-sm text-slate-600">
            {profile.region} • {profile.experience?.length || 0} yrkeserfarenheter
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="apply-message" className="block text-sm font-medium text-slate-700 mb-2">
            Meddelande (valfritt)
          </label>
          <textarea
            id="apply-message"
            rows={4}
            placeholder="Skriv ett kort meddelande till arbetsgivaren..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none mb-6"
          />

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
              {sending ? "Skickar..." : "Skicka ansökan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
