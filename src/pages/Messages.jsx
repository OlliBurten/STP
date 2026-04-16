import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { useChat } from "../context/ChatContext";
import { createReport } from "../api/reports.js";
import { getMyConversationReview, submitCompanyReview } from "../api/reviews.js";
import LoadingBlock from "../components/LoadingBlock";
import { useToast } from "../context/ToastContext";
import { ChevronDownIcon } from "../components/Icons";

function getApplicationStatusLabel(conversation) {
  if (conversation.rejectedByCompanyAt) return { label: "Avvisad", className: "bg-red-100 text-red-800" };
  if (conversation.selectedByCompanyAt) return { label: "Utvald", className: "bg-green-100 text-green-800" };
  if (conversation.readByCompanyAt) return { label: "Läst", className: "bg-blue-100 text-blue-800" };
  return { label: "Skickad", className: "bg-slate-100 text-slate-700" };
}

function ConversationItem({ conversation, isDriver, isActive, onClick, basePath }) {
  const other = isDriver ? conversation.companyName : conversation.driverName;
  const lastMsg = conversation.messages[conversation.messages.length - 1];
  const time = lastMsg
    ? new Date(lastMsg.timestamp).toLocaleString("sv-SE", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const status = isDriver && conversation.jobId ? getApplicationStatusLabel(conversation) : null;

  return (
    <Link
      to={`${basePath}/${conversation.id}`}
      className={`block w-full text-left p-4 rounded-lg transition-colors ${
        isActive ? "bg-[var(--color-primary)]/10 border-l-4 border-[var(--color-primary)]" : "hover:bg-slate-50"
      }`}
    >
      <p className="font-medium text-slate-900 truncate">{other}</p>
      {status && (
        <p className={`text-[11px] mt-0.5 inline-flex items-center px-2 py-0.5 rounded w-fit ${status.className}`}>
          {status.label}
        </p>
      )}
      {conversation.jobTitle && (
        <p className="text-xs text-slate-500 truncate mt-0.5">{conversation.jobTitle}</p>
      )}
      <p className="text-sm text-slate-600 truncate mt-1">{lastMsg?.content || "—"}</p>
      <p className="text-xs text-slate-400 mt-1">{time}</p>
    </Link>
  );
}

function ChatWindow({ conversation, isDriver, onBack, onReport, onReview, canReview, reviewStatus }) {
  const { sendMessage } = useChat();
  const [input, setInput] = useState("");

  const other = isDriver ? conversation.companyName : conversation.driverName;

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(conversation.id, input.trim(), isDriver ? "driver" : "company");
    setInput("");
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 flex items-center gap-3">
        <button type="button" onClick={onBack} className="lg:hidden text-slate-600 hover:text-slate-900">
          ←
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-slate-900 truncate">{other}</h2>
          {conversation.jobTitle && (
            <p className="text-sm text-slate-500 truncate">{conversation.jobTitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onReport}
          className="text-xs text-red-600 hover:text-red-700 font-medium min-h-[36px]"
        >
          Rapportera
        </button>
        {isDriver ? (
          <button
            type="button"
            onClick={onReview}
            disabled={!canReview}
            className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-light)] font-medium disabled:opacity-50 min-h-[36px]"
          >
            {reviewStatus || "Lämna omdöme"}
          </button>
        ) : null}
      </div>

      {!isDriver && (conversation.driverEmail || conversation.driverPhone) && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-sm text-slate-600">
          {conversation.driverEmail && <span>E-post: {conversation.driverEmail}</span>}
          {conversation.driverEmail && conversation.driverPhone && " · "}
          {conversation.driverPhone && <span>Tel: {conversation.driverPhone}</span>}
        </div>
      )}

      {isDriver && conversation.selectedByCompanyAt && conversation.jobId && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm font-medium text-green-900">Företaget har valt dig för detta jobb</p>
          <Link
            to={`/jobb/${conversation.jobId}`}
            className="inline-flex items-center gap-1 mt-2 text-sm text-[var(--color-primary)] font-medium hover:underline"
          >
            Öppna jobbannonsen →
          </Link>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {conversation.messages.map((msg, idx) => {
          const isOwn = msg.sender === (isDriver ? "driver" : "company");
          const isLastCompanyMsg = !isDriver &&
            msg.sender === "company" &&
            conversation.messages.slice(idx + 1).every((m) => m.sender !== "company");
          const showReadReceipt = isLastCompanyMsg && conversation.readByDriverAt;
          return (
            <div key={msg.id}>
              <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    isOwn
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-slate-100 text-slate-900"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? "text-white/80" : "text-slate-500"}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
              {showReadReceipt && (
                <p className="text-right text-xs text-slate-400 mt-0.5 pr-1">
                  Läst {new Date(conversation.readByDriverAt).toLocaleString("sv-SE", {
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Skriv meddelande..."
            className="flex-1 px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
          />
          <button
            type="submit"
            className="px-4 sm:px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-light)] min-h-[44px]"
          >
            Skicka
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          All kommunikation sker via Sveriges Transportplattform. Du behöver inte dela dina kontaktuppgifter.
        </p>
      </form>
    </div>
  );
}

export default function Messages() {
  usePageTitle("Meddelanden");
  const { id } = useParams();
  const { user, hasApi } = useAuth();
  const { profile } = useProfile();
  const {
    getDriverConversations,
    getCompanyConversations,
    getConversation,
    markConversationSeen,
    markSelectedNotificationsSeen,
    refreshConversations,
    conversationsLoading,
    companyUnreadConversationCount = 0,
  } = useChat();

  const { pathname } = useLocation();
  const toast = useToast();
  const isDriver = !pathname.startsWith("/foretag/meddelanden");
  const companies = hasApi
    ? [...new Set((conversationsLoading ? [] : getCompanyConversations(user?.companyName || "")).map((c) => c.companyName))]
    : [];
  const [companyFilter, setCompanyFilter] = useState("");
  const [conversationReview, setConversationReview] = useState(null);

  const driverId = user?.id ?? profile.id;
  const companyNameForFilter = user?.companyName || companyFilter;
  const conversations = isDriver
    ? getDriverConversations(driverId)
    : getCompanyConversations(companyNameForFilter);

  const conversation = id ? getConversation(id) : null;

  const handleReportConversation = async () => {
    if (!conversation) return;
    const category = prompt(
      "Kategori (PAYMENT, BEHAVIOR, SCAM, SPAM, OTHER):",
      "BEHAVIOR"
    );
    if (!category) return;
    const description = prompt("Beskriv problemet kort:", "");
    if (!description || description.trim().length < 10) {
      setReportError("Beskrivning måste vara minst 10 tecken.");
      return;
    }
    try {
      const reportedUserId = isDriver ? conversation.companyId : conversation.driverId;
      await createReport({
        category: category.toUpperCase(),
        description: description.trim(),
        conversationId: conversation.id,
        reportedUserId,
      });
      toast.success("Tack. Rapporten är skickad till moderation.");
    } catch (e) {
      toast.error(e.message || "Kunde inte skicka rapporten.");
    }
  };

  const handleSubmitReview = async () => {
    if (!conversation || !isDriver) return;
    if (conversationReview) {
      toast.info("Du har redan lämnat omdöme för denna kontakt.");
      return;
    }
    const ratingRaw = prompt("Betyg 1-5:", "5");
    if (!ratingRaw) return;
    const rating = Number(ratingRaw);
    const comment = prompt("Kommentar (valfritt, minst 10 tecken om ifyllt):", "") || "";
    try {
      const data = await submitCompanyReview({
        conversationId: conversation.id,
        rating,
        comment,
      });
      setConversationReview(data);
      toast.success("Tack! Ditt omdöme är registrerat.");
    } catch (e) {
      toast.error(e.message || "Kunde inte skicka omdöme.");
    }
  };

  useEffect(() => {
    if (isDriver) return;
    if (user?.companyName) {
      setCompanyFilter(user.companyName);
      return;
    }
    if (!companyFilter && companies.length > 0) {
      setCompanyFilter(companies[0]);
    }
  }, [isDriver, user?.companyName, companies, companyFilter]);

  useEffect(() => {
    if (conversation && !isDriver) {
      setCompanyFilter(conversation.companyName);
    }
  }, [conversation?.id, conversation?.companyName, isDriver]);

  useEffect(() => {
    if (!isDriver || !conversation?.id) {
      setConversationReview(null);
      return;
    }
    getMyConversationReview(conversation.id)
      .then((r) => setConversationReview(r))
      .catch(() => setConversationReview(null));
  }, [isDriver, conversation?.id]);

  useEffect(() => {
    if (isDriver) {
      markSelectedNotificationsSeen();
    }
  }, [isDriver, markSelectedNotificationsSeen]);

  // Mark conversation as seen when opened
  useEffect(() => {
    if (conversation?.id && isDriver) {
      markConversationSeen(conversation.id);
    }
  }, [conversation?.id, isDriver, markConversationSeen]);

  // Fast polling while on this page (4s instead of 20s)
  useEffect(() => {
    if (!hasApi) return;
    const interval = setInterval(refreshConversations, 4000);
    return () => clearInterval(interval);
  }, [hasApi, refreshConversations]);

  const selectedConversations = isDriver
    ? conversations.filter((c) => c.selectedByCompanyAt)
    : [];
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 min-h-[calc(100dvh-8rem)] lg:h-[calc(100vh-8rem)]">
      {!isDriver && companyUnreadConversationCount > 0 && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
          <p className="font-medium">Saker som lätt glöms</p>
          <p className="mt-1 text-slate-700">Svarar ni inom 24–48 timmar ökar chansen att hitta rätt kandidat. Ni har {companyUnreadConversationCount} nya ansökningar att granska.</p>
        </div>
      )}
      {isDriver && selectedConversations.length > 0 && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          <p className="font-medium">Du har blivit utvald i {selectedConversations.length} ansökan{selectedConversations.length > 1 ? "er" : ""}.</p>
          <p className="mt-1 text-green-800">Saker som lätt glöms: svara snabbt – det visar intresse och ökar chansen till nästa steg.</p>
          <p className="mt-1 text-green-700">Öppna konversationen nedan för att svara företaget.</p>
        </div>
      )}
      <div className="flex flex-col lg:flex-row h-full gap-4">
        <aside className={`lg:w-80 shrink-0 flex flex-col border border-slate-200 rounded-xl bg-white overflow-hidden ${id ? "hidden lg:flex" : ""}`}>
          <div className="p-4 border-b border-slate-200">
            <h1 className="text-xl font-bold text-slate-900">
              {isDriver ? "Meddelanden" : "Företagsmeddelanden"}
            </h1>
            {!isDriver && (
              <div className="mt-3">
                <label htmlFor="company-select" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Företag
                </label>
                <div className="relative">
                  <select
                    id="company-select"
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="w-full appearance-none pl-3 pr-9 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none"
                  >
                    {companies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <ChevronDownIcon className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="p-6">
                <LoadingBlock message="Hämtar meddelanden..." className="py-8" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-sm space-y-3">
                <p className="text-slate-600">
                  {isDriver ? "Inga konversationer ännu." : "Inga konversationer för detta företag."}
                </p>
                {isDriver ? (
                  <Link to="/jobb" className="inline-block px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white font-medium text-xs hover:bg-[var(--color-primary-light)]">
                    Se lediga jobb →
                  </Link>
                ) : (
                  <Link to="/foretag/chaufforer" className="inline-block px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white font-medium text-xs hover:bg-[var(--color-primary-light)]">
                    Hitta förare →
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {conversations.map((c) => (
                  <ConversationItem
                    key={c.id}
                    conversation={c}
                    isDriver={isDriver}
                    isActive={c.id === id}
                    onClick={() => {}}
                    basePath={isDriver ? "/meddelanden" : "/foretag/meddelanden"}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        <div className={`flex-1 min-h-0 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col ${!id ? "hidden lg:flex" : ""}`}>
          {conversation ? (
            <ChatWindow
              conversation={conversation}
              isDriver={isDriver}
              onBack={() => window.history.back()}
              onReport={handleReportConversation}
              onReview={handleSubmitReview}
              canReview={!conversationReview}
              reviewStatus={
                conversationReview
                  ? `Omdöme lämnat (${conversationReview.rating}/5)`
                  : "Lämna omdöme"
              }
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-500 p-8 text-center">
              {id ? (
                <p className="text-sm">Konversationen hittades inte.</p>
              ) : conversations.length > 0 ? (
                <p className="text-sm">Välj en konversation till vänster.</p>
              ) : isDriver ? (
                <>
                  <p className="text-sm">Ansök till ett jobb för att starta en konversation.</p>
                  <Link to="/jobb" className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-light)]">
                    Se lediga jobb
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm">Kontakta en förare för att starta en konversation.</p>
                  <Link to="/foretag/chaufforer" className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-light)]">
                    Hitta förare
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {conversations.length > 0 && !id && (
        <div className="mt-4 lg:hidden">
          <Link
            to={`${isDriver ? "/meddelanden" : "/foretag/meddelanden"}/${conversations[0].id}`}
            className="block text-center py-3 rounded-lg bg-[var(--color-primary)] text-white font-medium"
          >
            Öppna senaste konversation
          </Link>
        </div>
      )}
    </main>
  );
}
