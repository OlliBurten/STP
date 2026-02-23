import { z } from "zod";

const BRANSCH_VALUES = [
  "tank",
  "soppor",
  "atervinning",
  "distribution",
  "fjarrkorning",
  "specialtransport",
  "kyl",
  "ovrigt",
];

export const registerSchema = z
  .object({
    email: z.string().min(1, "E-post krävs").email("Ogiltig e-postadress").max(255),
    password: z.string().min(8, "Lösenordet måste vara minst 8 tecken").max(200),
    role: z.enum(["DRIVER", "COMPANY"], { errorMap: () => ({ message: "Roll måste vara DRIVER eller COMPANY" }) }),
    name: z.string().min(1, "Namn krävs").max(200).transform((s) => s.trim()),
    companyName: z.string().max(200).optional(),
    companyOrgNumber: z.string().max(20).optional(),
  })
  .refine(
    (data) => {
      if (data.role !== "COMPANY") return true;
      const name = (data.companyName || "").trim();
      const org = String(data.companyOrgNumber || "").replace(/\D/g, "");
      const normalized = org.length === 12 ? org.slice(2) : org;
      return name.length > 0 && normalized.length === 10;
    },
    { message: "Företagsnamn och giltigt organisationsnummer (10 siffror) krävs för företag", path: ["companyOrgNumber"] }
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

export const resendVerificationSchema = z.object({
  email: z.string().min(1, "E-post krävs").email("Ogiltig e-postadress").max(255),
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
  bransch: z.string().max(50).optional().nullable().transform((v) => (v && v.trim() ? v.trim() : null)),
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

/** Query: bransch for companies search (optional) */
export const companiesSearchQuerySchema = z.object({
  bransch: z.string().max(50).optional(),
  region: z.string().max(100).optional(),
});

/** Query: bransch for jobs list (optional) */
export const jobsListQuerySchema = z.object({
  bransch: z.string().max(50).optional(),
});
