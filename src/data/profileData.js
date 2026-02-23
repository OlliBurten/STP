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
};

export const certificateTypes = [
  { value: "YKB", label: "YKB (Yrkesförarkompetens)" },
  { value: "ADR", label: "ADR" },
  { value: "Tank", label: "Tankbehörighet" },
  { value: "Kyl", label: "Kylskåpsbehörighet" },
];

export const availabilityTypes = [
  { value: "open", label: "Öppen för förfrågningar" },
  { value: "vikariat", label: "Söker vikariat" },
  { value: "tim", label: "Söker timjobb" },
  { value: "fast", label: "Söker fast anställning" },
  { value: "inactive", label: "Inte aktivt sökande" },
];

export const PROFILE_STORAGE_KEY = "drivermatch-profile";
