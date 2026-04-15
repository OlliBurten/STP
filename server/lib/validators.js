import { z } from "zod";
import { isValidSwedishOrgNumber } from "./companyVerify.js";

/** Transportsegment – måste matcha src/data/bransch.js branschValues */
const BRANSCH_VALUES = [
  "tankbil-drivmedel",
  "tankbil-kemikalier",
  "tankbil-livsmedel",
  "gastransport",
  "adr-styckegods",
  "adr-tank",
  "timmerbil",
  "flisbil",
  "anlaggningstransporter",
  "massor-grus",
  "berg-kross",
  "maskintransport",
  "tippbil",
  "kranbil",
  "betongbil",
  "schakt",
  "bygglogistik",
  "modultransporter",
  "dagdistribution",
  "nattdistribution",
  "terminaltrafik",
  "paket-citylogistik",
  "styckegods-fjarr",
  "fjarrbil",
  "kyltransporter",
  "frys",
  "livsmedelsdistribution",
  "mejeri",
  "slakteri",
  "sopbil",
  "atervinning",
  "slam-spol",
  "sugbil",
  "slamsugning",
  "miljotransporter",
  "bargning",
  "tungbargning",
  "biltransport",
  "specialtransporter-bred",
  "modul-eskort",
  "levande-djur",
  "hasttransport",
  "inrikes-fjarr",
  "norden",
  "eu-trafik",
  "container",
  "hamntransporter",
  "terminalkorning",
  "industriintern",
  "lager-truck-ce",
  "kombitjanster",
];

export const registerSchema = z
  .object({
    email: z.string().min(1, "E-post krävs").email("Ogiltig e-postadress").max(255),
    password: z.string().min(8, "Lösenordet måste vara minst 8 tecken").max(200),
    role: z.enum(["DRIVER", "COMPANY"], { errorMap: () => ({ message: "Roll måste vara DRIVER eller COMPANY" }) }),
    name: z.string().min(1, "Namn krävs").max(200).transform((s) => s.trim()),
    companyName: z.string().max(200).optional(),
    companyOrgNumber: z.string().max(20).optional(),
    verificationBaseUrl: z.string().url().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.role !== "COMPANY") return true;
      const name = (data.companyName || "").trim();
      const org = data.companyOrgNumber;
      if (name.length === 0 && !org) return true; // Rekryterare utan företag – lägger till i onboarding
      return name.length > 0 && isValidSwedishOrgNumber(org);
    },
    { message: "Företagsnamn och giltigt organisationsnummer krävs (eller lämna tomt och lägg till i nästa steg)", path: ["companyOrgNumber"] }
  );

export const loginSchema = z.object({
  email: z.string().min(1, "E-post krävs").max(255),
  password: z.string().min(1, "Lösenord krävs").max(200),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().min(1, "E-post krävs").email("Ogiltig e-postadress").max(255),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token krävs"),
  password: z.string().min(8, "Lösenordet måste vara minst 8 tecken").max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Nuvarande lösenord krävs"),
  newPassword: z.string().min(8, "Lösenordet måste vara minst 8 tecken").max(200),
});

export const resendVerificationSchema = z.object({
  email: z.string().min(1, "E-post krävs").email("Ogiltig e-postadress").max(255),
  verificationBaseUrl: z.string().url().max(500).optional(),
});

export const oauthGoogleSchema = z.object({
  credential: z.string().min(1, "Credential krävs"),
  role: z.enum(["DRIVER", "COMPANY"]).optional(),
});

export const oauthMicrosoftSchema = z.object({
  credential: z.string().min(1, "Credential krävs"),
  role: z.enum(["DRIVER", "COMPANY"]).optional(),
});

export const oauthCompleteSchema = z.object({
  oauthCompleteToken: z.string().min(1, "Token krävs"),
  role: z.enum(["DRIVER", "COMPANY"], { errorMap: () => ({ message: "Roll måste vara DRIVER eller COMPANY" }) }),
});

export const createJobSchema = z.object({
  title: z.string().min(1, "Jobbtitel krävs").max(300),
  company: z.string().min(1, "Företagsnamn krävs").max(200),
  description: z.string().min(1, "Beskrivning krävs").max(20_000),
  location: z.string().min(1, "Ort krävs").max(200),
  region: z.string().min(1, "Region krävs").max(100),
  license: z.array(z.string().max(20)).optional().default([]),
  certificates: z.array(z.string().max(50)).optional().default([]),
  jobType: z.enum(["fjärrkörning", "lokalt", "distribution", "timjobb"], {
    errorMap: () => ({ message: "Ogiltig jobbtyp" }),
  }),
  employment: z.enum(["fast", "vikariat", "tim"], {
    errorMap: () => ({ message: "Ogiltig anställningstyp" }),
  }),
  segment: z.string().max(50).optional(),
  contact: z.string().min(1, "Kontakt e-post krävs").email("Ogiltig kontakt e-post").max(255),
  schedule: z.string().max(50).optional().nullable(),
  experience: z.string().max(20).optional().nullable(),
  salary: z.string().max(100).optional().nullable(),
  requirements: z.array(z.string()).optional(),
  extraRequirements: z.string().max(2000).optional().nullable(),
  bransch: z
    .string()
    .max(80)
    .optional()
    .nullable()
    .refine((v) => !v || v.trim() === "" || BRANSCH_VALUES.includes(v.trim()), "Ogiltig bransch (välj från listan)")
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  physicalWorkRequired: z.boolean().optional().nullable(),
  soloWorkOk: z.boolean().optional().nullable(),
  kollektivavtal: z.boolean().optional().nullable(),
});

/** Company can close job (set filled) or update limited fields */
export const patchJobSchema = z.object({
  status: z.enum(["ACTIVE", "HIDDEN", "REMOVED"]).optional(),
  filledAt: z.string().datetime().optional().nullable().transform((v) => (v ? new Date(v) : null)),
  kollektivavtal: z.boolean().optional().nullable(),
});

export const createOrganizationSchema = z
  .object({
    name: z.string().min(1, "Företagsnamn krävs").max(200),
    orgNumber: z.string().min(1, "Organisationsnummer krävs").max(20),
    description: z.string().max(10000).optional(),
    website: z
      .string()
      .max(500)
      .optional()
      .refine((v) => !v || v === "" || /^https?:\/\//i.test(v), "Ogiltig webbadress"),
    location: z.string().max(200).optional(),
    segmentDefaults: z.array(z.string().max(50)).optional(),
    bransch: z.array(z.enum(BRANSCH_VALUES)).optional(),
    region: z.string().max(100).optional().nullable(),
  })
  .refine((data) => isValidSwedishOrgNumber(data.orgNumber), {
    message: "Ogiltigt organisationsnummer",
    path: ["orgNumber"],
  });

export const companyProfileSchema = z.object({
  name: z.string().max(200).optional(),
  companyName: z.string().max(200).optional(),
  companyDescription: z.string().max(10000).optional(),
  companyWebsite: z
    .string()
    .max(500)
    .optional()
    .refine((v) => !v || v === "" || /^https?:\/\//i.test(v), "Ogiltig webbadress"),
  companyLocation: z.string().max(200).optional(),
  companySegmentDefaults: z.array(z.string().max(50)).optional(),
  companyBransch: z.array(z.enum(BRANSCH_VALUES)).optional(),
  companyRegion: z.string().max(100).optional().nullable(),
  fSkattsedel: z.boolean().optional(),
  industryOrgMember: z.boolean().optional(),
  industryOrgName: z.string().max(200).optional().nullable(),
  policyAgreedAt: z.string().datetime().optional().nullable(),
});

export const createConversationSchema = z.object({
  driverId: z.string().max(100).optional(),
  companyId: z.string().max(100).optional(),
  jobId: z.string().max(100).optional().nullable(),
  jobTitle: z.string().max(300).optional().nullable(),
  initialMessage: z.string().max(5000).optional(),
  sender: z.string().optional(),
  driverEmail: z.string().email().optional(),
  driverPhone: z.string().max(50).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Meddelande krävs").max(5000),
});

/** Query: bransch, region, segment. segment=INTERNSHIP => åkerier som erbjuder praktik. */
export const companiesSearchQuerySchema = z.object({
  bransch: z.string().max(50).optional(),
  region: z.string().max(100).optional(),
  segment: z.enum(["FULLTIME", "FLEX", "INTERNSHIP"]).optional(),
});

/** Query: bransch for jobs list (optional) */
export const jobsListQuerySchema = z.object({
  bransch: z.string().max(50).optional(),
});

/** Create company invite */
export const inviteCreateSchema = z.object({
  email: z.string().min(1, "E-post krävs").email("Ogiltig e-postadress").max(255),
});

/** Validate invite token (query param) */
export const inviteValidateQuerySchema = z.object({
  token: z.string().min(1, "Token krävs").max(500),
});

/** Accept invite – login existing user or register new */
export const inviteAcceptSchema = z
  .object({
    token: z.string().min(1, "Token krävs").max(500),
    action: z.enum(["login", "register"]),
    email: z.string().email("Ogiltig e-post").max(255).optional(),
    password: z.string().min(1).max(200).optional(),
    name: z.string().min(1, "Namn krävs").max(200).optional(),
    verificationBaseUrl: z.string().url().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.action === "login") return data.email && data.password;
      if (data.action === "register") return data.email && data.password && data.name;
      return false;
    },
    { message: "E-post, lösenord och (vid registrering) namn krävs", path: ["email"] }
  );
