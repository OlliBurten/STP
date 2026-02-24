export const defaultProfile = {
  id: "",
  name: "",
  location: "",
  region: "",
  email: "",
  phone: "",
  summary: "",
  licenses: [],
  certificates: [],
  availability: "open",
  primarySegment: "",
  secondarySegments: [],
  visibleToCompanies: false,
  regionsWilling: [],
  showEmailToCompanies: false,
  showPhoneToCompanies: false,
  experience: [],
  isGymnasieelev: false,
  schoolName: "",
  physicalWorkOk: null,
  soloWorkOk: null,
};

// Re-export från competencies (YKB, ADR, APV, Truck, Kran, övriga)
export { certificateTypes, certificateGroups, getCertificateLabel } from "./competencies.js";

export const availabilityTypes = [
  { value: "open", label: "Öppen för förfrågningar" },
  { value: "vikariat", label: "Söker vikariat" },
  { value: "tim", label: "Söker timjobb" },
  { value: "fast", label: "Söker fast anställning" },
  { value: "inactive", label: "Inte aktivt sökande" },
];

export const PROFILE_STORAGE_KEY = "drivermatch-profile";
