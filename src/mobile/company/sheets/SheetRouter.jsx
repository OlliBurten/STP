// Company — bottom-sheet host. One <Sheet> driven by ctx.sheet ({type,...}).
import React from "react";
import { Sheet } from "../../ui";
import { PublishSheet, PipelineSheet, CandidateSheet, DriverSheet, ContactDriverSheet, DriverFilterSheet } from "./coreSheets";
// PlanSheet (abonnemang/billing) finns kvar i merSheets men är avwirad tills vidare
// — vi fakturerar inte åkerier än. Återaktivera: importera PlanSheet, lägg tillbaka
// `plan`-raden i CONFIG + grenen nedan, samt entry points i MerScreen/SettingsSheet.
import { EditCompanySheet, CompleteProfileSheet, SettingsSheet, TeamSheet, InviteSheet, ReviewsSheet, VerificationSheet, PublicProfileSheet, OrgSwitcherSheet, NotiserSheet, SupportSheet, LogoutSheet } from "./merSheets";

const CONFIG = {
  publish: { full: true, title: "Publicera jobb" },
  pipeline: { full: true, title: "Kandidater" },
  candidate: { title: "Kandidat" },
  driver: { title: "Förarprofil", full: true },
  contactDriver: { title: "Kontakta förare" },
  driverFilter: { title: "Filter" },
  editCompany: { title: "Företagsprofil", full: true },
  completeProfile: { title: "Komplettera profil", full: true },
  settings: { title: "Inställningar" },
  team: { title: "Team", full: true },
  invite: { title: "Bjud in" },
  reviews: { title: "Omdömen", full: true },
  verifiering: { title: "Verifiering" },
  publicProfile: { title: "Publik profil", full: true },
  orgSwitcher: { title: "Dina åkerier" },
  notiser: { title: "Notiser" },
  support: { title: "Hjälp & support" },
  logout: { title: "Logga ut" },
};

export default function CompanySheetRouter({ ctx }) {
  const sheet = ctx.sheet;
  const type = sheet?.type;
  const cfg = (type && CONFIG[type]) || {};
  const close = () => ctx.setSheet(null);

  let body = null;
  if (type === "publish") body = <PublishSheet ctx={ctx} close={close} />;
  else if (type === "pipeline") body = <PipelineSheet ctx={ctx} jobId={sheet.id} close={close} />;
  else if (type === "candidate") body = <CandidateSheet ctx={ctx} id={sheet.id} close={close} />;
  else if (type === "driver") body = <DriverSheet ctx={ctx} id={sheet.id} close={close} />;
  else if (type === "contactDriver") body = <ContactDriverSheet ctx={ctx} id={sheet.id} close={close} />;
  else if (type === "driverFilter") body = <DriverFilterSheet ctx={ctx} close={close} />;
  else if (type === "editCompany") body = <EditCompanySheet ctx={ctx} close={close} />;
  else if (type === "completeProfile") body = <CompleteProfileSheet ctx={ctx} close={close} />;
  else if (type === "settings") body = <SettingsSheet ctx={ctx} close={close} />;
  else if (type === "team") body = <TeamSheet ctx={ctx} close={close} />;
  else if (type === "invite") body = <InviteSheet ctx={ctx} close={close} />;
  else if (type === "reviews") body = <ReviewsSheet ctx={ctx} close={close} />;
  else if (type === "verifiering") body = <VerificationSheet ctx={ctx} close={close} />;
  else if (type === "publicProfile") body = <PublicProfileSheet ctx={ctx} close={close} />;
  else if (type === "orgSwitcher") body = <OrgSwitcherSheet ctx={ctx} close={close} />;
  else if (type === "notiser") body = <NotiserSheet ctx={ctx} close={close} />;
  else if (type === "support") body = <SupportSheet ctx={ctx} close={close} />;
  else if (type === "logout") body = <LogoutSheet ctx={ctx} close={close} />;

  return <Sheet open={!!type && !!body} onClose={close} title={cfg.title} full={cfg.full}>{body}</Sheet>;
}
