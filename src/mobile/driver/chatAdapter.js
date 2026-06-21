// Maps real conversations (ChatContext) onto the prototype's thread/application
// shapes. Application stage is derived from the company-side timestamps, the
// same way MinaAnsokningar/Messages do it.
import { initialsFor, timeAgo } from "./jobAdapter";

export function stageOf(conv) {
  if (conv.selectedByCompanyAt) return { id: "selected", label: "Utvald", tone: "success", step: 3 };
  if (conv.rejectedByCompanyAt) return { id: "rejected", label: "Avslag", tone: "danger", step: 0 };
  if (conv.reviewedByCompanyAt) return { id: "review", label: "Granskas", tone: "info", step: 2 };
  if (conv.readByCompanyAt) return { id: "seen", label: "Läst", tone: "info", step: 2 };
  return { id: "applied", label: "Skickad", tone: "neutral", step: 1 };
}

export function lastMessage(conv) {
  const msgs = Array.isArray(conv.messages) ? conv.messages : [];
  return msgs[msgs.length - 1] || null;
}

// Approximate per-thread unread: last message is from the company. (ChatContext
// tracks a precise seen-map internally; we surface a good-enough flag here.)
export function isUnread(conv) {
  const m = lastMessage(conv);
  return !!m && m.sender === "company";
}

export function toThread(conv) {
  const m = lastMessage(conv);
  const prefix = m && m.sender === "driver" ? "Du: " : "";
  return {
    id: conv.id,
    company: conv.companyName || "Åkeri",
    initials: initialsFor(conv.companyName),
    last: m ? prefix + m.content : "",
    time: timeAgo(m?.timestamp || conv.createdAt),
    unread: isUnread(conv),
    jobTitle: conv.jobTitle || null,
    conv,
  };
}

export function toMessages(conv) {
  const msgs = Array.isArray(conv.messages) ? conv.messages : [];
  return msgs.map((m) => ({ me: m.sender === "driver", text: m.content, t: timeAgo(m.timestamp) }));
}

export function toApplication(conv) {
  const st = stageOf(conv);
  let note = null;
  if (st.id === "selected") note = `${conv.companyName} vill gå vidare med dig`;
  else if (st.id === "review") note = `${conv.companyName} granskar din ansökan`;
  return {
    id: conv.id,
    jobId: conv.jobId,
    title: conv.jobTitle || "Ansökan",
    company: conv.companyName || "Åkeri",
    stage: st,
    when: timeAgo(conv.createdAt),
    note,
    conv,
  };
}
