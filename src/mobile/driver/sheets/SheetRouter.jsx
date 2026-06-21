// Driver — bottom-sheet host. One <Sheet> driven by ctx.sheet ({type,...}).
// Grows as screens land; unknown types render nothing.
import React from "react";
import { Sheet } from "../../ui";
import DetailSheet from "./DetailSheet";
import ApplySheet from "./ApplySheet";
import CompleteSheet from "./CompleteSheet";
import FilterSheet from "./FilterSheet";
import CompanySheet from "./CompanySheet";
import ShiftSheet from "./ShiftSheet";
import {
  EditProfileSheet, SettingsSheet, PersonalSheet, PasswordSheet, PrivacySheet,
  PhotoSheet, PrefsSheet, AddDocSheet, DocDetailSheet, RenewSheet, ShareSheet, AiSheet, LogoutSheet,
} from "./profileSheets";

const CONFIG = {
  detail: { full: true },
  apply: { title: "Ansök" },
  complete: { title: "Komplettera profil" },
  filter: { title: "Filter" },
  company: { full: true },
  shift: { title: "Inhopp" },
  editProfile: { title: "Redigera profil", full: true },
  settings: { title: "Inställningar" },
  personal: { title: "Personuppgifter" },
  password: { title: "Byt lösenord" },
  privacy: { title: "Integritet & data" },
  photo: { title: "Profilbild" },
  prefs: { title: "Var vill du köra?" },
  addDoc: { title: "Lägg till intyg" },
  renew: { title: "Förnya dokument" },
  share: { title: "Dela din profil" },
  ai: { title: "Personligt brev" },
  logout: { title: "Logga ut" },
};

export default function SheetRouter({ ctx }) {
  const sheet = ctx.sheet;
  const type = sheet?.type;
  const cfg = (type && CONFIG[type]) || {};
  const close = () => ctx.setSheet(null);

  let body = null;
  if (type === "detail") body = <DetailSheet job={sheet.job} ctx={ctx} close={close} />;
  else if (type === "apply") body = <ApplySheet job={sheet.job} ctx={ctx} close={close} />;
  else if (type === "complete") body = <CompleteSheet ctx={ctx} close={close} />;
  else if (type === "filter") body = <FilterSheet ctx={ctx} close={close} />;
  else if (type === "company") body = <CompanySheet name={sheet.name} companyId={sheet.companyId} ctx={ctx} close={close} />;
  else if (type === "shift") body = <ShiftSheet shift={sheet.shift} ctx={ctx} close={close} />;
  else if (type === "editProfile") body = <EditProfileSheet ctx={ctx} focus={sheet.focus} close={close} />;
  else if (type === "settings") body = <SettingsSheet ctx={ctx} close={close} />;
  else if (type === "personal") body = <PersonalSheet ctx={ctx} close={close} />;
  else if (type === "password") body = <PasswordSheet ctx={ctx} close={close} />;
  else if (type === "privacy") body = <PrivacySheet ctx={ctx} close={close} />;
  else if (type === "photo") body = <PhotoSheet ctx={ctx} close={close} />;
  else if (type === "prefs") body = <PrefsSheet ctx={ctx} close={close} />;
  else if (type === "addDoc") body = <AddDocSheet ctx={ctx} close={close} />;
  else if (type === "docDetail") body = <DocDetailSheet doc={sheet.doc} ctx={ctx} close={close} />;
  else if (type === "renew") body = <RenewSheet doc={sheet.doc} ctx={ctx} close={close} />;
  else if (type === "share") body = <ShareSheet ctx={ctx} close={close} />;
  else if (type === "ai") body = <AiSheet ctx={ctx} close={close} />;
  else if (type === "logout") body = <LogoutSheet ctx={ctx} close={close} />;

  const title = type === "docDetail" ? (sheet.doc?.name || "Dokument") : cfg.title;

  return (
    <Sheet open={!!type && !!body} onClose={close} title={title} full={cfg.full}>
      {body}
    </Sheet>
  );
}
