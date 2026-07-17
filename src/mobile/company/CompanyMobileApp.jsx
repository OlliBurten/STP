// STP Mobile — company (Åkeri) logged-in app shell. 5 URL-backed tabs + sheets.
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MobileShell from "../MobileShell";
import { TabBar, Icon, Button } from "../ui";
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

  // Stäng overlays (sheet/chatt) vid ruttändring — annars blir de kvar ovanpå
  // den nya sidan vid telefonens bakåt-gest och blockerar alla klick.
  useEffect(() => { setSheet(null); setOpenChat(null); }, [pathname]);

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

  // Inget åkeri kopplat ännu (och ingen legacy-koppling via org.nr) → samma
  // dash-först-flöde som desktop: prompta "Lägg till åkeri" i st f tom dash.
  if (!data.loading && (data.orgs?.length || 0) === 0 && !data.company?.orgnr) {
    return (
      <MobileShell>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 30px", textAlign: "center" }}>
          <div style={{ width: 68, height: 68, borderRadius: 20, background: "var(--green-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <Icon name="building" size={30} color="var(--green)" stroke={1.9} />
          </div>
          <h1 style={{ fontSize: 25, fontWeight: 800, letterSpacing: -0.6, color: "var(--ink-900)", marginBottom: 10 }}>Välkommen till STP</h1>
          <p style={{ fontSize: 15, color: "var(--ink-500)", lineHeight: 1.55, marginBottom: 26 }}>
            Ditt konto är skapat. Lägg till ditt åkeri med organisationsnumret — resten fyller vi i automatiskt.
          </p>
          <Button variant="primary" full onClick={() => navigate("/foretag/lagg-till-akeri")}>Lägg till ditt åkeri</Button>
          <p style={{ fontSize: 12.5, color: "var(--ink-400)", marginTop: 14 }}>Gratis för åkerier · Ingen bindningstid</p>
        </div>
      </MobileShell>
    );
  }

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
