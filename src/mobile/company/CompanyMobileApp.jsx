// STP Mobile — company (Åkeri) logged-in app shell. 5 URL-backed tabs + sheets.
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MobileShell from "../MobileShell";
import { TabBar } from "../ui";
import { COMPANY_TABS, companyTabForPath } from "./tabs";
import { CompanyDataProvider, useCompanyData } from "./CompanyDataContext";
import CompanySheetRouter from "./sheets/SheetRouter";
import OversiktScreen from "./screens/OversiktScreen";
import AnnonserScreen from "./screens/AnnonserScreen";
import ForareScreen from "./screens/ForareScreen";
import InkorgScreen from "./screens/InkorgScreen";
import MerScreen from "./screens/MerScreen";
import CompanyChatScreen from "./screens/ChatScreen";

function CompanyShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const data = useCompanyData();
  const active = companyTabForPath(pathname);
  const [sheet, setSheet] = useState(null);
  const [openChat, setOpenChat] = useState(null);

  const setTab = (id) => {
    const tab = COMPANY_TABS.find((t) => t.id === id);
    if (tab && !(pathname === tab.path || pathname.startsWith(tab.path + "/"))) navigate(tab.path);
    setOpenChat(null);
  };

  const ctx = { ...data, sheet, setSheet, setTab, navigate, openChat, setChat: setOpenChat };

  const screens = {
    oversikt: <OversiktScreen ctx={ctx} go={setTab} />,
    annonser: <AnnonserScreen ctx={ctx} />,
    forare: <ForareScreen ctx={ctx} />,
    inkorg: <InkorgScreen ctx={ctx} go={setTab} />,
    mer: <MerScreen ctx={ctx} />,
  };

  const unread = data.kpis?.unread || null;

  return (
    <MobileShell>
      <div key={active} className="tab-enter" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {screens[active]}
      </div>
      <TabBar tabs={COMPANY_TABS} active={active} onTab={setTab} badges={{ inkorg: unread }} />
      <CompanySheetRouter ctx={ctx} />
      {openChat && <CompanyChatScreen ctx={ctx} />}
    </MobileShell>
  );
}

export default function CompanyMobileApp() {
  return (
    <CompanyDataProvider>
      <CompanyShell />
    </CompanyDataProvider>
  );
}
