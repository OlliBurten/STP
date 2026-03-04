/**
 * Demo-seed: rik data för presentation (TYA, Transportföretagen).
 * Använd ENDAST i en separat demo-miljö – kör aldrig mot produktion.
 *
 * Kör: DEMO_SEED=true node prisma/seed-demo.js
 * Eller: npm run db:seed:demo (sätter DEMO_SEED=true)
 *
 * OBS: Databasen måste ha senaste schemat (t.ex. isGymnasieelev, schoolName på DriverProfile).
 * Kör först: npx prisma db push
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo123";
const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

async function main() {
  // Enterprise-guard: kör ALDRIG demo-seed mot produktion. Prod sätter DEPLOYMENT=production.
  if (process.env.DEPLOYMENT === "production") {
    throw new Error(
      "Demo seed får ALDRIG köras mot produktion. Denna databas är markerad som production (DEPLOYMENT=production)."
    );
  }
  if (process.env.NODE_ENV === "production" && process.env.DEMO_SEED !== "true") {
    throw new Error(
      "Demo seed är avstängd i production. Sätt DEMO_SEED=true och använd en separat demo-databas (och DEPLOYMENT=demo)."
    );
  }
  if (!process.env.DEMO_SEED) {
    console.warn("Tips: kör med DEMO_SEED=true (eller npm run db:seed:demo)");
  }

  console.log("Rensar befintlig demo-data...");
  await prisma.report.deleteMany({});
  await prisma.companyReview.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.savedJob.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.driverProfile.deleteMany({});
  await prisma.user.deleteMany({});

  // —— Åkerier ——
  const companiesData = [
    {
      email: "rekrytering@nordiclogistics.se",
      name: "Lisa Bergström",
      companyName: "Nordic Logistics AB",
      companyOrgNumber: "556011-5798",
      companyDescription: "Fjärr- och distribution i Norden. Kollektivavtal, moderna lastbilar.",
      companyLocation: "Malmö",
      companyRegion: "Skåne",
      companySegmentDefaults: ["FULLTIME", "FLEX"],
      companyBransch: ["dagdistribution", "inrikes-fjarr"],
    },
    {
      email: "hr@svensktransport.se",
      name: "Johan Karlsson",
      companyName: "Svensk Transport & Logistik AB",
      companyOrgNumber: "556123-4567",
      companyDescription: "Lokal och regional distribution. Vi satsar på våra chaufförer.",
      companyLocation: "Göteborg",
      companyRegion: "Västra Götaland",
      companySegmentDefaults: ["FULLTIME", "FLEX"],
      companyBransch: ["dagdistribution", "terminaltrafik"],
    },
    {
      email: "anna@hallbergsakeri.se",
      name: "Anna Hallberg",
      companyName: "Hallbergs Åkeri",
      companyOrgNumber: "556234-5678",
      companyDescription: "Familjeåkeri med fokus på tank- och specialtransporter.",
      companyLocation: "Stockholm",
      companyRegion: "Stockholm",
      companySegmentDefaults: ["FULLTIME"],
      companyBransch: ["tankbil-drivmedel", "bargning"],
    },
    {
      email: "kontakt@skanetransport.se",
      name: "Maria Lind",
      companyName: "Skåne Transport AB",
      companyOrgNumber: "556345-6789",
      companyDescription: "Distribution i Skåne och Öresund. Vikarier och fasta anställningar.",
      companyLocation: "Helsingborg",
      companyRegion: "Skåne",
      companySegmentDefaults: ["FULLTIME", "FLEX"],
      companyBransch: ["dagdistribution", "terminaltrafik"],
    },
    {
      email: "info@ostgotaakeri.se",
      name: "Per Östlund",
      companyName: "Östgöta Åkeri AB",
      companyOrgNumber: "556456-7890",
      companyDescription: "Distribution och fjärrkörning i Östergötland. Vi tar emot praktikanter från transportgymnasier.",
      companyLocation: "Linköping",
      companyRegion: "Östergötland",
      companySegmentDefaults: ["FULLTIME", "FLEX", "INTERNSHIP"],
      companyBransch: ["dagdistribution", "inrikes-fjarr"],
    },
    {
      email: "hr@malartransport.se",
      name: "Karin Målar",
      companyName: "Målar Transport AB",
      companyOrgNumber: "556567-8901",
      companyDescription: "Lokal distribution i Mälardalen. Vikarier och praktikanter välkomna.",
      companyLocation: "Västerås",
      companyRegion: "Västmanland",
      companySegmentDefaults: ["FLEX", "INTERNSHIP"],
      companyBransch: ["dagdistribution", "terminaltrafik"],
    },
    {
      email: "rekrytering@nordhalland.se",
      name: "Thomas Nord",
      companyName: "Nord Halland Transport",
      companyOrgNumber: "556678-9012",
      companyDescription: "Åkeri i Halland med inriktning fjärr och distribution. Kollektivavtal.",
      companyLocation: "Falkenberg",
      companyRegion: "Halland",
      companySegmentDefaults: ["FULLTIME", "FLEX"],
      companyBransch: ["dagdistribution", "inrikes-fjarr"],
    },
    {
      email: "kontakt@blekingelogistik.se",
      name: "Emma Rask",
      companyName: "Blekinge Logistik AB",
      companyOrgNumber: "556789-0123",
      companyDescription: "Transport och logistik i Blekinge. Söker både erfarna och praktikanter.",
      companyLocation: "Karlskrona",
      companyRegion: "Blekinge",
      companySegmentDefaults: ["FULLTIME", "INTERNSHIP"],
      companyBransch: ["dagdistribution", "terminaltrafik"],
    },
    {
      email: "hr@uppsalatransport.se",
      name: "Anders Bergman",
      companyName: "Uppsalatransport i Norden AB",
      companyOrgNumber: "556890-1234",
      companyDescription: "Fjärr- och distribution från Uppsala. Stort behov av vikarier och LIA-elever.",
      companyLocation: "Uppsala",
      companyRegion: "Uppland",
      companySegmentDefaults: ["FULLTIME", "FLEX", "INTERNSHIP"],
      companyBransch: ["dagdistribution", "inrikes-fjarr"],
    },
    {
      email: "info@jonkopingsakeri.se",
      name: "Linda Ström",
      companyName: "Jönköpings Åkeri & Logistik",
      companyOrgNumber: "556901-2345",
      companyDescription: "Åkeri i Småland. Distribution, fjärr och tank. Tar emot praktikanter.",
      companyLocation: "Jönköping",
      companyRegion: "Småland",
      companySegmentDefaults: ["FULLTIME", "FLEX", "INTERNSHIP"],
      companyBransch: ["dagdistribution", "tankbil-drivmedel"],
    },
  ];

  const companyUsers = [];
  for (const c of companiesData) {
    const u = await prisma.user.create({
      data: {
        email: c.email,
        passwordHash: hash,
        role: "COMPANY",
        name: c.name,
        companyName: c.companyName,
        companyOrgNumber: c.companyOrgNumber,
        companyDescription: c.companyDescription,
        companyLocation: c.companyLocation,
        companyRegion: c.companyRegion,
        companySegmentDefaults: c.companySegmentDefaults,
        companyBransch: c.companyBransch,
        companyStatus: "VERIFIED",
        emailVerifiedAt: new Date(),
      },
    });
    companyUsers.push(u);
  }

  // —— Förare ——
  const driversData = [
    {
      email: "erik.lindstrom@example.com",
      name: "Erik Lindström",
      location: "Malmö",
      region: "Skåne",
      phone: "070-123 45 67",
      summary: "CE-chaufför med 8 års erfarenhet. YKB, ADR grund.",
      licenses: ["CE"],
      certificates: ["YKB", "ADR"],
      availability: "open",
      primarySegment: "FULLTIME",
      secondarySegments: ["FLEX"],
      regionsWilling: ["Skåne", "Halland", "Blekinge"],
      experience: [
        { id: "e1", company: "Nordic Logistics AB", role: "CE-chaufför", startYear: 2018, endYear: null, current: true, description: "Fjärrkörning Norden." },
      ],
      isGymnasieelev: false,
      schoolName: null,
    },
    {
      email: "sara.johansson@example.com",
      name: "Sara Johansson",
      location: "Göteborg",
      region: "Västra Götaland",
      phone: "073-234 56 78",
      summary: "C/CE, erfaren inom distribution. Söker stabil anställning.",
      licenses: ["C", "CE"],
      certificates: ["YKB"],
      availability: "open",
      primarySegment: "FULLTIME",
      secondarySegments: [],
      regionsWilling: ["Västra Götaland", "Halland"],
      experience: [
        { id: "e1", company: "Svensk Transport AB", role: "Distribution", startYear: 2020, endYear: 2024, current: false, description: "Lokal distribution." },
      ],
      isGymnasieelev: false,
      schoolName: null,
    },
    {
      email: "mikael.andersson@example.com",
      name: "Mikael Andersson",
      location: "Stockholm",
      region: "Stockholm",
      phone: "076-345 67 89",
      summary: "CE med ADR. Erfaren tank- och kemikalietransport.",
      licenses: ["CE"],
      certificates: ["YKB", "ADR"],
      availability: "open",
      primarySegment: "FULLTIME",
      secondarySegments: [],
      regionsWilling: ["Stockholm", "Uppland", "Södermanland"],
      experience: [
        { id: "e1", company: "Hallbergs Åkeri", role: "Tankchaufför", startYear: 2019, endYear: null, current: true, description: "Tank och ADR." },
      ],
      isGymnasieelev: false,
      schoolName: null,
    },
    {
      email: "lina.nilsson@example.com",
      name: "Lina Nilsson",
      location: "Helsingborg",
      region: "Skåne",
      phone: "072-456 78 90",
      summary: "C-kort, YKB. Söker vikariat eller flex i Skåne.",
      licenses: ["C"],
      certificates: ["YKB"],
      availability: "vikariat",
      primarySegment: "FLEX",
      secondarySegments: ["FULLTIME"],
      regionsWilling: ["Skåne"],
      experience: [
        { id: "e1", company: "Lokal Transport AB", role: "Chaufför", startYear: 2022, endYear: 2024, current: false, description: "Vikariat." },
      ],
      isGymnasieelev: false,
      schoolName: null,
    },
    {
      email: "peter.ek@example.com",
      name: "Peter Ek",
      location: "Lund",
      region: "Skåne",
      phone: "079-567 89 01",
      summary: "CE, fjärr och lokalt. Öppen för både fast och flex.",
      licenses: ["CE"],
      certificates: ["YKB"],
      availability: "open",
      primarySegment: "FULLTIME",
      secondarySegments: ["FLEX"],
      regionsWilling: ["Skåne", "Halland", "Småland"],
      experience: [
        { id: "e1", company: "Nordic Logistics AB", role: "CE-chaufför", startYear: 2021, endYear: null, current: true, description: "Fjärr och distribution." },
      ],
      isGymnasieelev: false,
      schoolName: null,
    },
    {
      email: "jenny.svensson@example.com",
      name: "Jenny Svensson",
      location: "Mölndal",
      region: "Västra Götaland",
      phone: "070-678 90 12",
      summary: "C/CE, YKB. Nyligen utexaminerad från YKB, vill bygga erfarenhet.",
      licenses: ["C", "CE"],
      certificates: ["YKB"],
      availability: "open",
      primarySegment: "FULLTIME",
      secondarySegments: ["INTERNSHIP"],
      regionsWilling: ["Västra Götaland"],
      experience: [],
      isGymnasieelev: false,
      schoolName: null,
    },
    {
      email: "olle.larsson@example.com",
      name: "Olle Larsson",
      location: "Trelleborg",
      region: "Skåne",
      phone: "073-789 01 23",
      summary: "CE med lång erfarenhet. Fjärr och internationellt.",
      licenses: ["CE"],
      certificates: ["YKB", "ADR"],
      availability: "open",
      primarySegment: "FULLTIME",
      secondarySegments: [],
      regionsWilling: ["Skåne", "Halland", "Blekinge", "Europe"],
      experience: [
        { id: "e1", company: "Internationell Transport", role: "CE-chaufför", startYear: 2015, endYear: 2023, current: false, description: "Fjärr Europa." },
      ],
      isGymnasieelev: false,
      schoolName: null,
    },
    {
      email: "sofia.bjork@example.com",
      name: "Sofia Björk",
      location: "Stockholm",
      region: "Stockholm",
      phone: "076-890 12 34",
      summary: "C-kort, distribution och lokala körningar. Söker fast anställning.",
      licenses: ["C"],
      certificates: ["YKB"],
      availability: "open",
      primarySegment: "FULLTIME",
      secondarySegments: ["FLEX"],
      regionsWilling: ["Stockholm", "Uppland"],
      experience: [
        { id: "e1", company: "Stockholm Distribution", role: "Chaufför", startYear: 2022, endYear: null, current: true, description: "Lokal distribution." },
      ],
      isGymnasieelev: false,
      schoolName: null,
    },
    {
      email: "marcus.wallin@example.com",
      name: "Marcus Wallin",
      location: "Linköping",
      region: "Östergötland",
      phone: "070-111 22 33",
      summary: "CE-chaufför med 4 års erfarenhet. Fjärr och distribution.",
      licenses: ["CE"],
      certificates: ["YKB"],
      availability: "open",
      primarySegment: "FULLTIME",
      secondarySegments: [],
      regionsWilling: ["Östergötland", "Småland"],
      experience: [
        { id: "e1", company: "Östgöta Åkeri", role: "CE-chaufför", startYear: 2021, endYear: null, current: true, description: "Fjärr och distribution." },
      ],
      isGymnasieelev: false,
      schoolName: null,
    },
    {
      email: "kristina.holm@example.com",
      name: "Kristina Holm",
      location: "Västerås",
      region: "Västmanland",
      phone: "073-222 33 44",
      summary: "C/CE, YKB. Söker vikariat eller fast i Mälardalen.",
      licenses: ["C", "CE"],
      certificates: ["YKB"],
      availability: "vikariat",
      primarySegment: "FLEX",
      secondarySegments: ["FULLTIME"],
      regionsWilling: ["Västmanland", "Uppland"],
      experience: [
        { id: "e1", company: "Målar Transport", role: "Chaufför", startYear: 2023, endYear: null, current: true, description: "Distribution." },
      ],
      isGymnasieelev: false,
      schoolName: null,
    },
    {
      email: "axel.lindqvist@example.com",
      name: "Axel Lindqvist",
      location: "Falkenberg",
      region: "Halland",
      phone: "076-333 44 55",
      summary: "CE, fjärrkörning. Erfaren från Norden.",
      licenses: ["CE"],
      certificates: ["YKB"],
      availability: "open",
      primarySegment: "FULLTIME",
      secondarySegments: [],
      regionsWilling: ["Halland", "Skåne", "Västra Götaland"],
      experience: [
        { id: "e1", company: "Nord Halland Transport", role: "CE-chaufför", startYear: 2020, endYear: null, current: true, description: "Fjärr." },
      ],
      isGymnasieelev: false,
      schoolName: null,
    },
    {
      email: "nina.berg@example.com",
      name: "Nina Berg",
      location: "Karlskrona",
      region: "Blekinge",
      phone: "079-444 55 66",
      summary: "C-kort, YKB. Distribution och lokala körningar i Blekinge.",
      licenses: ["C"],
      certificates: ["YKB"],
      availability: "open",
      primarySegment: "FULLTIME",
      secondarySegments: ["FLEX"],
      regionsWilling: ["Blekinge", "Skåne"],
      experience: [
        { id: "e1", company: "Blekinge Logistik", role: "Chaufför", startYear: 2022, endYear: null, current: true, description: "Distribution." },
      ],
      isGymnasieelev: false,
      schoolName: null,
    },
    {
      email: "david.sandberg@example.com",
      name: "David Sandberg",
      location: "Uppsala",
      region: "Uppland",
      phone: "070-555 66 77",
      summary: "CE med ADR. Söker fast anställning i Uppsala/Mälardalen.",
      licenses: ["CE"],
      certificates: ["YKB", "ADR"],
      availability: "open",
      primarySegment: "FULLTIME",
      secondarySegments: [],
      regionsWilling: ["Uppland", "Stockholm", "Västmanland"],
      experience: [
        { id: "e1", company: "Uppsalatransport", role: "CE-chaufför", startYear: 2019, endYear: null, current: true, description: "Fjärr och ADR." },
      ],
      isGymnasieelev: false,
      schoolName: null,
    },
    {
      email: "emma.praktik@example.com",
      name: "Emma Andersson",
      location: "Linköping",
      region: "Östergötland",
      phone: "073-666 77 88",
      summary: "Gymnasieelev transportprogrammet. Söker LIA-praktik hösten.",
      licenses: ["C"],
      certificates: ["YKB"],
      availability: "open",
      primarySegment: "INTERNSHIP",
      secondarySegments: [],
      regionsWilling: ["Östergötland", "Småland"],
      experience: [],
      isGymnasieelev: true,
      schoolName: "Transportgymnasiet Linköping",
    },
    {
      email: "oscar.praktik@example.com",
      name: "Oscar Nilsson",
      location: "Västerås",
      region: "Västmanland",
      phone: "076-777 88 99",
      summary: "Elev transport- och logistikprogrammet. Vill gärna prova distribution under LIA.",
      licenses: ["C"],
      certificates: [],
      availability: "open",
      primarySegment: "INTERNSHIP",
      secondarySegments: [],
      regionsWilling: ["Västmanland", "Uppland"],
      experience: [],
      isGymnasieelev: true,
      schoolName: "Mälardalens Transportgymnasium",
    },
    {
      email: "linnea.praktik@example.com",
      name: "Linnea Eriksson",
      location: "Jönköping",
      region: "Småland",
      phone: "070-888 99 00",
      summary: "Söker praktikplats som lastbilschaufför. Tar C-kort nu.",
      licenses: ["C"],
      certificates: ["YKB"],
      availability: "open",
      primarySegment: "INTERNSHIP",
      secondarySegments: [],
      regionsWilling: ["Småland", "Östergötland"],
      experience: [],
      isGymnasieelev: true,
      schoolName: "Jönköpings Transportgymnasium",
    },
    {
      email: "viktor.hansson@example.com",
      name: "Viktor Hansson",
      location: "Kristianstad",
      region: "Skåne",
      phone: "073-999 00 11",
      summary: "CE, YKB. Erfaren distribution och fjärr. Söker ny utmaning.",
      licenses: ["CE"],
      certificates: ["YKB"],
      availability: "open",
      primarySegment: "FULLTIME",
      secondarySegments: ["FLEX"],
      regionsWilling: ["Skåne", "Blekinge"],
      experience: [
        { id: "e1", company: "Skåne Transport", role: "CE-chaufför", startYear: 2018, endYear: 2024, current: false, description: "Distribution." },
      ],
      isGymnasieelev: false,
      schoolName: null,
    },
    {
      email: "ida.johansson@example.com",
      name: "Ida Johansson",
      location: "Borås",
      region: "Västra Götaland",
      phone: "076-100 20 30",
      summary: "C-kort, YKB. Söker första jobbet efter YKB-utbildning.",
      licenses: ["C"],
      certificates: ["YKB"],
      availability: "open",
      primarySegment: "FULLTIME",
      secondarySegments: ["FLEX"],
      regionsWilling: ["Västra Götaland"],
      experience: [],
      isGymnasieelev: false,
      schoolName: null,
    },
  ];

  const driverUsers = [];
  for (const d of driversData) {
    const u = await prisma.user.create({
      data: {
        email: d.email,
        passwordHash: hash,
        role: "DRIVER",
        name: d.name,
        emailVerifiedAt: new Date(),
      },
    });
    await prisma.driverProfile.create({
      data: {
        userId: u.id,
        email: d.email,
        location: d.location,
        region: d.region,
        phone: d.phone,
        summary: d.summary,
        licenses: d.licenses,
        certificates: d.certificates,
        availability: d.availability,
        primarySegment: d.primarySegment,
        secondarySegments: d.secondarySegments,
        visibleToCompanies: true,
        regionsWilling: d.regionsWilling,
        experience: d.experience.length ? d.experience : undefined,
        isGymnasieelev: d.isGymnasieelev ?? false,
        schoolName: d.schoolName ?? null,
      },
    });
    driverUsers.push(u);
  }

  // —— Jobb (flera per åkeri) ——
  const jobsData = [
    { companyIndex: 0, title: "CE-chaufför fjärrkörning", employment: "fast", segment: "FULLTIME", region: "Skåne", location: "Malmö", jobType: "fjärrkörning", bransch: null, license: ["CE"], certs: ["YKB"], experience: "2-5" },
    { companyIndex: 0, title: "Distribution chaufför C/CE", employment: "fast", segment: "FULLTIME", region: "Skåne", location: "Malmö", jobType: "distribution", bransch: null, license: ["C", "CE"], certs: ["YKB"], experience: "1-2" },
    { companyIndex: 0, title: "Vikarie CE-chaufför", employment: "vikariat", segment: "FLEX", region: "Skåne", location: "Malmö", jobType: "fjärrkörning", bransch: null, license: ["CE"], certs: ["YKB"], experience: "0-1" },
    { companyIndex: 0, title: "Internationell CE-chaufför", employment: "fast", segment: "FULLTIME", region: "Skåne", location: "Malmö", jobType: "fjärrkörning", bransch: null, license: ["CE"], certs: ["YKB", "ADR"], experience: "5-10" },
    { companyIndex: 1, title: "Lokal chaufför Göteborg", employment: "fast", segment: "FULLTIME", region: "Västra Götaland", location: "Göteborg", jobType: "lokalt", bransch: null, license: ["C"], certs: ["YKB"], experience: "0-1" },
    { companyIndex: 1, title: "CE fjärr Västra Götaland", employment: "fast", segment: "FULLTIME", region: "Västra Götaland", location: "Göteborg", jobType: "fjärrkörning", bransch: null, license: ["CE"], certs: ["YKB"], experience: "2-5" },
    { companyIndex: 1, title: "Timjobb distribution", employment: "tim", segment: "FLEX", region: "Västra Götaland", location: "Göteborg", jobType: "distribution", bransch: null, license: ["C", "CE"], certs: ["YKB"], experience: "1-2" },
    { companyIndex: 2, title: "Tankchaufför CE ADR", employment: "fast", segment: "FULLTIME", region: "Stockholm", location: "Stockholm", jobType: "fjärrkörning", bransch: "tankbil-drivmedel", license: ["CE"], certs: ["YKB", "ADR"], experience: "2-5" },
    { companyIndex: 2, title: "Distribution Stockholm", employment: "fast", segment: "FULLTIME", region: "Stockholm", location: "Stockholm", jobType: "distribution", bransch: null, license: ["C", "CE"], certs: ["YKB"], experience: "1-2" },
    { companyIndex: 3, title: "CE-chaufför Skåne", employment: "fast", segment: "FULLTIME", region: "Skåne", location: "Helsingborg", jobType: "fjärrkörning", bransch: null, license: ["CE"], certs: ["YKB"], experience: "2-5" },
    { companyIndex: 3, title: "Vikarie C/CE", employment: "vikariat", segment: "FLEX", region: "Skåne", location: "Helsingborg", jobType: "lokalt", bransch: null, license: ["C", "CE"], certs: ["YKB"], experience: "0-1" },
    { companyIndex: 3, title: "Distribution Helsingborg–Malmö", employment: "fast", segment: "FULLTIME", region: "Skåne", location: "Helsingborg", jobType: "distribution", bransch: null, license: ["CE"], certs: ["YKB"], experience: "1-2" },
    { companyIndex: 4, title: "CE-chaufför fjärr Östergötland", employment: "fast", segment: "FULLTIME", region: "Östergötland", location: "Linköping", jobType: "fjärrkörning", bransch: null, license: ["CE"], certs: ["YKB"], experience: "2-5" },
    { companyIndex: 4, title: "Praktikant/LIA lastbil", employment: "vikariat", segment: "INTERNSHIP", region: "Östergötland", location: "Linköping", jobType: "distribution", bransch: null, license: ["C"], certs: ["YKB"], experience: "0-1" },
    { companyIndex: 4, title: "Distribution chaufför", employment: "fast", segment: "FULLTIME", region: "Östergötland", location: "Linköping", jobType: "distribution", bransch: null, license: ["C", "CE"], certs: ["YKB"], experience: "1-2" },
    { companyIndex: 5, title: "Vikarie C/CE Mälardalen", employment: "vikariat", segment: "FLEX", region: "Västmanland", location: "Västerås", jobType: "lokalt", bransch: null, license: ["C", "CE"], certs: ["YKB"], experience: "0-1" },
    { companyIndex: 5, title: "LIA-praktik distribution", employment: "vikariat", segment: "INTERNSHIP", region: "Västmanland", location: "Västerås", jobType: "distribution", bransch: null, license: ["C"], certs: [], experience: "0-1" },
    { companyIndex: 6, title: "CE-chaufför Halland", employment: "fast", segment: "FULLTIME", region: "Halland", location: "Falkenberg", jobType: "fjärrkörning", bransch: null, license: ["CE"], certs: ["YKB"], experience: "2-5" },
    { companyIndex: 6, title: "Vikarie fjärr", employment: "vikariat", segment: "FLEX", region: "Halland", location: "Falkenberg", jobType: "fjärrkörning", bransch: null, license: ["CE"], certs: ["YKB"], experience: "1-2" },
    { companyIndex: 7, title: "Chaufför Blekinge", employment: "fast", segment: "FULLTIME", region: "Blekinge", location: "Karlskrona", jobType: "distribution", bransch: null, license: ["C", "CE"], certs: ["YKB"], experience: "1-2" },
    { companyIndex: 7, title: "Praktikant/LIA", employment: "vikariat", segment: "INTERNSHIP", region: "Blekinge", location: "Karlskrona", jobType: "lokalt", bransch: null, license: ["C"], certs: ["YKB"], experience: "0-1" },
    { companyIndex: 8, title: "CE fjärr Uppsala", employment: "fast", segment: "FULLTIME", region: "Uppland", location: "Uppsala", jobType: "fjärrkörning", bransch: null, license: ["CE"], certs: ["YKB"], experience: "2-5" },
    { companyIndex: 8, title: "LIA-elev lastbil", employment: "vikariat", segment: "INTERNSHIP", region: "Uppland", location: "Uppsala", jobType: "distribution", bransch: null, license: ["C"], certs: ["YKB"], experience: "0-1" },
    { companyIndex: 8, title: "Vikarie CE", employment: "vikariat", segment: "FLEX", region: "Uppland", location: "Uppsala", jobType: "fjärrkörning", bransch: null, license: ["CE"], certs: ["YKB"], experience: "0-1" },
    { companyIndex: 9, title: "CE-chaufför Jönköping", employment: "fast", segment: "FULLTIME", region: "Småland", location: "Jönköping", jobType: "fjärrkörning", bransch: null, license: ["CE"], certs: ["YKB"], experience: "2-5" },
    { companyIndex: 9, title: "Praktik/LIA lastbil", employment: "vikariat", segment: "INTERNSHIP", region: "Småland", location: "Jönköping", jobType: "distribution", bransch: null, license: ["C"], certs: ["YKB"], experience: "0-1" },
    { companyIndex: 9, title: "Tankchaufför CE ADR", employment: "fast", segment: "FULLTIME", region: "Småland", location: "Jönköping", jobType: "fjärrkörning", bransch: "tankbil-drivmedel", license: ["CE"], certs: ["YKB", "ADR"], experience: "2-5" },
  ];

  const jobs = [];
  for (const j of jobsData) {
    const company = companyUsers[j.companyIndex];
    const job = await prisma.job.create({
      data: {
        userId: company.id,
        title: j.title,
        company: company.companyName,
        description: `Vi söker erfaren chaufför till detta uppdrag. Kollektivavtal och förmåner. Ansök via plattformen.`,
        location: j.location,
        region: j.region,
        license: j.license,
        certificates: j.certs,
        jobType: j.jobType,
        employment: j.employment,
        segment: j.segment,
        schedule: "blandat",
        experience: j.experience,
        salary: "Enligt kollektivavtal",
        contact: company.email,
        requirements: "[]",
        bransch: j.bransch || undefined,
      },
    });
    jobs.push(job);
  }

  // —— Konversationer (ansökningar) + meddelanden ——
  const conversations = [];
  const pairs = [
    [0, 0], [0, 1], [0, 6], [1, 4], [1, 5], [2, 7], [2, 8], [3, 9], [3, 10], [4, 11], [5, 4], [6, 0], [7, 2],
    [8, 12], [8, 14], [9, 15], [10, 17], [11, 19], [11, 20], [12, 21], [12, 22], [13, 13], [14, 23], [15, 24], [16, 25], [17, 3],
  ];
  for (const [driverIdx, jobIdx] of pairs) {
    if (!driverUsers[driverIdx] || !jobs[jobIdx]) continue;
    const driver = driverUsers[driverIdx];
    const job = jobs[jobIdx];
    const conv = await prisma.conversation.create({
      data: {
        driverId: driver.id,
        companyId: job.userId,
        jobId: job.id,
        jobTitle: job.title,
        selectedByCompanyAt: Math.random() > 0.5 ? new Date() : null,
      },
    });
    conversations.push(conv);
    await prisma.message.createMany({
      data: [
        { conversationId: conv.id, senderId: driver.id, senderRole: "driver", content: "Hej! Jag är intresserad av tjänsten och har erfarenhet som passar. Kan vi boka ett kort samtal?" },
        { conversationId: conv.id, senderId: job.userId, senderRole: "company", content: "Hej! Tack för ansökan. Vi återkommer med tid för samtal." },
      ],
    });
  }

  // —— Sparade jobb (flera förare) ——
  const savedPairs = [
    [0, 1], [0, 2], [1, 4], [4, 11], [5, 4], [6, 0], [8, 12], [9, 15], [10, 17], [11, 19], [14, 23], [16, 25], [17, 3], [17, 10],
  ];
  for (const [driverIdx, jobIdx] of savedPairs) {
    if (!driverUsers[driverIdx] || !jobs[jobIdx]) continue;
    await prisma.savedJob.create({ data: { userId: driverUsers[driverIdx].id, jobId: jobs[jobIdx].id } });
  }

  // —— Notiser (för att visa flödet) ——
  const driver0 = driverUsers[0];
  const conv0 = conversations[0];
  await prisma.notification.create({
    data: {
      userId: driver0.id,
      type: "APPLICATION",
      title: "Ny ansökan",
      body: "Erik Lindström har ansökt på CE-chaufför fjärrkörning.",
      link: "/foretag",
      relatedConversationId: conv0.id,
      relatedJobId: jobs[0].id,
      actorName: "Nordic Logistics AB",
    },
  });
  await prisma.notification.create({
    data: {
      userId: driver0.id,
      type: "MATCH_JOBS",
      title: "Nya jobb som matchar din profil",
      body: "3 nya jobb i Skåne passar din profil.",
      link: "/jobb",
    },
  });

  console.log("\nDemo-seed klar.");
  console.log("Åkerier:", companyUsers.length);
  console.log("Förare:", driverUsers.length);
  console.log("Jobb:", jobs.length);
  console.log("Konversationer:", conversations.length);
  console.log("Sparade jobb:", savedPairs.length);
  console.log("\nInloggning: alla användare har lösenord:", DEMO_PASSWORD);
  console.log("Företag t.ex.:", companiesData[0].email, companiesData[4].email);
  console.log("Förare t.ex.:", driversData[0].email, "| Elev:", driversData[16].email);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
