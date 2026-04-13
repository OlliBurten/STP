import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiPost } from "../api/client.js";

export default function FeedbackButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | done | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus("sending");
    try {
      await apiPost("/api/feedback", {
        message: message.trim(),
        email: user?.email || undefined,
      });
      setStatus("done");
      setMessage("");
    } catch {
      setStatus("error");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setStatus("idle");
    setMessage("");
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--color-primary)] text-white text-sm font-medium shadow-lg hover:bg-[var(--color-primary-light)] transition-all hover:shadow-xl hover:-translate-y-0.5"
        aria-label="Lämna feedback"
      >
        <span className="text-base leading-none">💬</span>
        Feedback
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" aria-hidden onClick={handleClose} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Lämna feedback</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Vad fungerar bra? Vad kan bli bättre? Allt hjälper.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 p-1 -mr-1 rounded-lg"
                aria-label="Stäng"
              >
                ✕
              </button>
            </div>

            {status === "done" ? (
              <div className="py-6 text-center">
                <p className="text-2xl mb-2">🙏</p>
                <p className="font-semibold text-slate-900">Tack för din feedback!</p>
                <p className="mt-1 text-sm text-slate-500">Det hjälper oss att bygga en bättre plattform.</p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-4 inline-flex px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-light)]"
                >
                  Stäng
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Skriv din feedback här — buggrapport, förslag, eller vad du helst saknar..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-none"
                  autoFocus
                  maxLength={5000}
                />
                <div className="flex items-center justify-between mt-1 mb-4">
                  <span className="text-xs text-slate-400">{message.length}/5000</span>
                  {!user && (
                    <span className="text-xs text-slate-400">Skickas anonymt</span>
                  )}
                </div>
                {status === "error" && (
                  <p className="mb-3 text-sm text-red-600">Något gick fel. Försök igen eller maila oss direkt.</p>
                )}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    disabled={!message.trim() || status === "sending"}
                    className="px-5 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-light)] disabled:opacity-50 transition-colors"
                  >
                    {status === "sending" ? "Skickar…" : "Skicka feedback"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
