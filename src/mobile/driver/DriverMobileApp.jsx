// STP Mobile — driver logged-in app shell.
// Owns the 5-tab bottom-nav experience. Tabs are URL-backed (deep-linkable;
// OAuth/notification redirects work); transient bottom-sheets are local state.
// Data comes from <DriverDataProvider> (real contexts/APIs); this shell adds
// navigation + sheet UI state and passes a merged `ctx` to each screen,
// matching the prototype's screen signatures.
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MobileShell from "../MobileShell";
import { TabBar } from "../ui";
import { DRIVER_TABS, tabForPath } from "./tabs";
import { DriverDataProvider, useDriverData } from "./DriverDataContext";
import SheetRouter from "./sheets/SheetRouter";
import HemScreen from "./screens/HemScreen";
import JobbScreen from "./screens/JobbScreen";
import AnsokScreen from "./screens/AnsokScreen";
import InkorgScreen from "./screens/InkorgScreen";
import ChatScreen from "./screens/ChatScreen";
import ProfilScreen from "./screens/ProfilScreen";

function DriverShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const data = useDriverData();
  const active = tabForPath(pathname);
  const [sheet, setSheet] = useState(null);
  const [chat, setChat] = useState(null);

  // Sheets/chat är lokal overlay-state, inte URL-backad. När rutten ändras
  // (t.ex. telefonens bakåt-gest/-knapp) måste de stängas — annars blir en öppen
  // sheet/chatt kvar ovanpå den nya sidan och äter alla klick ("knapparna dör").
  useEffect(() => { setSheet(null); setChat(null); }, [pathname]);

  const setTab = (id) => {
    const tab = DRIVER_TABS.find((t) => t.id === id);
    if (tab && !(pathname === tab.path || pathname.startsWith(tab.path + "/"))) navigate(tab.path);
    setChat(null);
  };

  const ctx = { ...data, sheet, setSheet, setTab, chat, setChat, navigate };

  const screens = {
    hem: <HemScreen ctx={ctx} />,
    jobb: <JobbScreen ctx={ctx} />,
    ansokningar: <AnsokScreen ctx={ctx} />,
    meddelanden: <InkorgScreen ctx={ctx} />,
    profil: <ProfilScreen ctx={ctx} />,
  };

  const unread = data.chat?.unreadCount || null;

  return (
    <MobileShell>
      <div key={active} className="tab-enter" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {screens[active]}
      </div>
      <TabBar tabs={DRIVER_TABS} active={active} onTab={setTab} badges={{ meddelanden: unread }} />
      <SheetRouter ctx={ctx} />
      {chat && <ChatScreen ctx={ctx} />}
    </MobileShell>
  );
}

export default function DriverMobileApp() {
  return (
    <DriverDataProvider>
      <DriverShell />
    </DriverDataProvider>
  );
}
