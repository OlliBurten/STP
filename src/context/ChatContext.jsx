import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import { fetchConversations, createConversation as apiCreateConversation, sendMessage as apiSendMessage } from "../api/conversations.js";

const CHAT_STORAGE_KEY = "drivermatch-conversations";
const SELECTED_SEEN_STORAGE_KEY = "drivermatch-selected-seen";
const CONV_SEEN_STORAGE_KEY = "drivermatch-conv-seen";
function loadConversations() {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveConversations(convs) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(convs));
  } catch (_) {}
}

function loadSeenSelectedMap() {
  try {
    const stored = localStorage.getItem(SELECTED_SEEN_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveSeenSelectedMap(map) {
  try {
    localStorage.setItem(SELECTED_SEEN_STORAGE_KEY, JSON.stringify(map));
  } catch (_) {}
}

function loadConvSeenMap() {
  try {
    const stored = localStorage.getItem(CONV_SEEN_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveConvSeenMap(map) {
  try {
    localStorage.setItem(CONV_SEEN_STORAGE_KEY, JSON.stringify(map));
  } catch (_) {}
}

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { hasApi, token, isDriver, isCompany } = useAuth();
  const [conversations, setConversations] = useState(loadConversations);
  const [apiConversations, setApiConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [seenSelectedMap, setSeenSelectedMap] = useState(loadSeenSelectedMap);
  const [convSeenMap, setConvSeenMap] = useState(loadConvSeenMap);

  const refreshRef = useRef(null);

  useEffect(() => {
    if (!hasApi || !token) {
      setConversationsLoading(false);
      return;
    }
    let active = true;

    const refresh = () => {
      setConversationsLoading(true);
      return fetchConversations()
        .then((data) => {
          if (active) setApiConversations(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          if (active) setApiConversations([]);
        })
        .finally(() => {
          if (active) setConversationsLoading(false);
        });
    };

    refreshRef.current = refresh;
    refresh();
    const interval = setInterval(refresh, 20000);
    return () => {
      active = false;
      refreshRef.current = null;
      clearInterval(interval);
    };
  }, [hasApi, token]);

  const refreshConversations = useCallback(() => {
    refreshRef.current?.();
  }, []);

  useEffect(() => {
    if (!hasApi) saveConversations(conversations);
  }, [hasApi, conversations]);

  useEffect(() => {
    saveSeenSelectedMap(seenSelectedMap);
  }, [seenSelectedMap]);

  useEffect(() => {
    saveConvSeenMap(convSeenMap);
  }, [convSeenMap]);

  const list = hasApi ? apiConversations : conversations;
  const selectedNotificationCount = isDriver
    ? list.filter(
        (c) => c.selectedByCompanyAt && seenSelectedMap[c.id] !== c.selectedByCompanyAt
      ).length
    : 0;
  const companyUnreadConversationCount = isCompany
    ? list.filter((c) => !c.readByCompanyAt).length
    : 0;

  const createConversation = useCallback(
    async ({ driverId, companyId, driverName, companyName, jobId, jobTitle, initialMessage, sender, driverEmail, driverPhone }) => {
      if (hasApi) {
        const c = await apiCreateConversation({
          driverId,
          companyId,
          jobId: jobId || null,
          jobTitle: jobTitle || null,
          initialMessage: initialMessage || "Hej.",
        });
        setApiConversations((prev) => [c, ...prev.filter((x) => x.id !== c.id)]);
        return c.id;
      }
      const id = `conv-${Date.now()}`;
      const message = {
        id: `msg-${Date.now()}`,
        sender,
        content: initialMessage,
        timestamp: new Date().toISOString(),
      };
      const conversation = {
        id,
        driverId,
        driverName,
        companyName,
        jobId: jobId || null,
        jobTitle: jobTitle || null,
        messages: [message],
        createdAt: new Date().toISOString(),
        driverEmail: driverEmail || null,
        driverPhone: driverPhone || null,
      };
      setConversations((prev) => [conversation, ...prev]);
      return id;
    },
    [hasApi]
  );

  const getOrCreateConversation = useCallback(
    ({ driverId, driverName, companyName, jobId, jobTitle }) => {
      const existing = list.find(
        (c) =>
          c.driverId === driverId &&
          c.companyName === companyName &&
          (c.jobId === jobId || (!c.jobId && !jobId))
      );
      return existing?.id || null;
    },
    [list]
  );

  const sendMessage = useCallback(
    async (conversationId, content, sender) => {
      if (hasApi) {
        await apiSendMessage(conversationId, content);
        const updated = await fetchConversations();
        setApiConversations(updated);
        return;
      }
      const message = {
        id: `msg-${Date.now()}`,
        sender,
        content,
        timestamp: new Date().toISOString(),
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, messages: [...c.messages, message] }
            : c
        )
      );
    },
    [hasApi]
  );

  const getDriverConversations = useCallback(
    (driverId) => list.filter((c) => c.driverId === driverId),
    [list]
  );

  const getCompanyConversations = useCallback(
    (companyName) => list.filter((c) => c.companyName === companyName),
    [list]
  );

  const getConversation = useCallback(
    (id) => list.find((c) => c.id === id),
    [list]
  );

  // Driver unread: conversations where last message is from company and newer than last seen
  const driverUnreadCount = isDriver
    ? list.filter((c) => {
        const lastMsg = c.messages?.[c.messages.length - 1];
        if (!lastMsg || lastMsg.sender !== "company") return false;
        const lastSeen = convSeenMap[c.id];
        return !lastSeen || new Date(lastMsg.timestamp) > new Date(lastSeen);
      }).length
    : 0;

  const unreadCount = isDriver ? driverUnreadCount : companyUnreadConversationCount;

  const markConversationSeen = useCallback((conversationId) => {
    setConvSeenMap((prev) => ({ ...prev, [conversationId]: new Date().toISOString() }));
  }, []);

  const markSelectedNotificationsSeen = useCallback(() => {
    if (!isDriver) return;
    setSeenSelectedMap((prev) => {
      const next = { ...prev };
      list.forEach((c) => {
        if (c.selectedByCompanyAt) {
          next[c.id] = c.selectedByCompanyAt;
        }
      });
      return next;
    });
  }, [isDriver, list]);

  return (
    <ChatContext.Provider
      value={{
        conversations: list,
        createConversation,
        getOrCreateConversation,
        sendMessage,
        getDriverConversations,
        getCompanyConversations,
        getConversation,
        unreadCount,
        selectedNotificationCount,
        companyUnreadConversationCount,
        markConversationSeen,
        markSelectedNotificationsSeen,
        refreshConversations,
        conversationsLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
