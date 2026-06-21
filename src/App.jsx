import { lazy, Suspense, useEffect } from "react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigationType, matchPath } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import OAuthProviders from "./components/OAuthProviders";
import { ThemeProvider } from "./context/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProfileProvider } from "./context/ProfileContext";
import { ChatProvider } from "./context/ChatContext";
import { ToastProvider } from "./context/ToastContext";
import { ConfirmProvider } from "./components/ConfirmDialog";
import ConnectivityGate from "./components/ConnectivityGate";
import ProtectedRoute from "./components/ProtectedRoute";
import OnboardingGate, { useOnboardingRequired } from "./components/OnboardingGate";
import Header from "./components/Header";
import AppTopNav from "./components/AppTopNav";
import Footer from "./components/Footer";
import BottomNav from "./components/BottomNav";
import { NotificationProvider } from "./context/NotificationContext";
import { useAuth } from "./context/AuthContext";
import { useProfile } from "./context/ProfileContext";
import { useIsMobile } from "./hooks/useIsMobile";
import ProfileCompletionBanner from "./components/ProfileCompletionBanner";
import FeedbackButton from "./components/FeedbackButton";
import InstallPrompt from "./components/InstallPrompt";
import CookieBanner from "./components/CookieBanner";
import { DRIVER_MOBILE_PREFIXES } from "./mobile/driver/tabs";
// Shared driver completion items (same source as the mobile driver app)
import { DRIVER_ITEMS } from "./utils/driverCompletion";

// Wraps lazy() to intercept stale-chunk errors after a new deployment.
// If the chunk URL no longer exists (404 → not valid JS), reload immediately
// before the ErrorBoundary has a chance to render the error screen.
function lazyRetry(importFn) {
  return lazy(() =>
    importFn().catch((err) => {
      const msg = String(err?.message || "");
      const isChunkError =
        msg.includes("Failed to fetch dynamically imported module") ||
        msg.includes("Load failed") ||
        msg.includes("Importing a module script failed") ||
        msg.includes("error loading dynamically imported module") ||
        msg.includes("is not a valid JavaScript MIME type");

      const reloadTs = sessionStorage.getItem("chunk_reload");
      const recentReload = reloadTs && Date.now() - Number(reloadTs) < 30_000;
      if (isChunkError && !recentReload) {
        sessionStorage.setItem("chunk_reload", String(Date.now()));
        window.location.reload();
        // Keep Suspense in loading state while reload happens — no error flash.
        return new Promise(() => {});
      }
      throw err;
    })
  );
}

// Lazy-loaded pages — each becomes its own chunk
const DriverMobileApp       = lazyRetry(() => import("./mobile/driver/DriverMobileApp"));
const MobileDriverOnboarding = lazyRetry(() => import("./mobile/driver/Onboarding"));
const MobileAuth            = lazyRetry(() => import("./mobile/public/MobileAuth"));
const MobileLanding         = lazyRetry(() => import("./mobile/public/MobileLanding"));
const MobileGuestJobs       = lazyRetry(() => import("./mobile/public/MobileGuestJobs"));
const MobileLegal           = lazyRetry(() => import("./mobile/public/MobileLegal"));
const CompanyMobileApp      = lazyRetry(() => import("./mobile/company/CompanyMobileApp"));
const MobileCompanyOnboarding = lazyRetry(() => import("./mobile/company/Onboarding"));
const Home                  = lazyRetry(() => import("./pages/Home"));
const ForDrivers            = lazyRetry(() => import("./pages/ForDrivers"));
const ForCompaniesLanding   = lazyRetry(() => import("./pages/ForCompaniesLanding"));
const JobList               = lazyRetry(() => import("./pages/JobList"));
const JobDetail             = lazyRetry(() => import("./pages/JobDetail"));
const Apply                 = lazyRetry(() => import("./pages/Apply"));
const ForCompanies          = lazyRetry(() => import("./pages/ForCompanies"));
const PostJob               = lazyRetry(() => import("./pages/PostJob"));
const About                 = lazyRetry(() => import("./pages/About"));
const Profile               = lazyRetry(() => import("./pages/Profile"));
const DriverSearch          = lazyRetry(() => import("./pages/DriverSearch"));
const DriverDetail          = lazyRetry(() => import("./pages/DriverDetail"));
const MinaJobb              = lazyRetry(() => import("./pages/MinaJobb"));
const MinaAnsokningar       = lazyRetry(() => import("./pages/MinaAnsokningar"));
const Messages              = lazyRetry(() => import("./pages/Messages"));
const Login                 = lazyRetry(() => import("./pages/Login"));
const VerifyEmail           = lazyRetry(() => import("./pages/VerifyEmail"));
const ResetPassword         = lazyRetry(() => import("./pages/ResetPassword"));
const DemoWelcome           = lazyRetry(() => import("./pages/DemoWelcome"));
const Terms                 = lazyRetry(() => import("./pages/Terms"));
const Privacy               = lazyRetry(() => import("./pages/Privacy"));
const Admin                 = lazyRetry(() => import("./pages/Admin"));
const Status                = lazyRetry(() => import("./pages/Status"));
const NotFound              = lazyRetry(() => import("./pages/NotFound"));
const Forbidden             = lazyRetry(() => import("./pages/Forbidden"));
const PreviewIndex          = lazyRetry(() => import("./pages/preview/PreviewIndex"));
const LandingPreview        = lazyRetry(() => import("./pages/preview/LandingPreview"));
const FelsidorPreview       = lazyRetry(() => import("./pages/preview/FelsidorPreview"));
const StatesPreview         = lazyRetry(() => import("./pages/preview/StatesPreview"));
const DialogerPreview       = lazyRetry(() => import("./pages/preview/DialogerPreview"));
const NotiserSokPreview     = lazyRetry(() => import("./pages/preview/NotiserSokPreview"));
const JuridikPreview        = lazyRetry(() => import("./pages/preview/JuridikPreview"));
const InnehallssidorPreview = lazyRetry(() => import("./pages/preview/InnehallssidorPreview"));
const JobbdetaljPreview     = lazyRetry(() => import("./pages/preview/JobbdetaljPreview"));
const LedigaJobbPreview     = lazyRetry(() => import("./pages/preview/LedigaJobbPreview"));
const ForarprofilPreview    = lazyRetry(() => import("./pages/preview/ForarprofilPreview"));
const AnsokanPreview        = lazyRetry(() => import("./pages/preview/AnsokanPreview"));
const MinaAnsokningarPreview = lazyRetry(() => import("./pages/preview/MinaAnsokningarPreview"));
const InkorgPreview         = lazyRetry(() => import("./pages/preview/InkorgPreview"));
const AkeriDashboardPreview = lazyRetry(() => import("./pages/preview/akeri/DashboardPreview"));
const AkeriAnnonserPreview  = lazyRetry(() => import("./pages/preview/akeri/AnnonserPreview"));
const AkeriHittaForarePreview = lazyRetry(() => import("./pages/preview/akeri/HittaForarePreview"));
const AkeriSkapaAnnonsPreview = lazyRetry(() => import("./pages/preview/akeri/SkapaAnnonsPreview"));
const AkeriKanbanPreview    = lazyRetry(() => import("./pages/preview/akeri/KanbanPreview"));
const AkeriForetagsprofilPreview = lazyRetry(() => import("./pages/preview/akeri/ForetagsprofilPreview"));
const AkeriForarprofilPreview = lazyRetry(() => import("./pages/preview/akeri/ForarprofilAkeriPreview"));
const AkeriVerifieringPreview = lazyRetry(() => import("./pages/preview/akeri/VerifieringPreview"));
const AkeriInkorgPreview    = lazyRetry(() => import("./pages/preview/akeri/InkorgPreview"));
const AkeriOnboardingPreview = lazyRetry(() => import("./pages/preview/akeri/OnboardingPreview"));
const AdminOversiktPreview  = lazyRetry(() => import("./pages/preview/admin/OversiktPreview"));
const AdminAnvandarePreview = lazyRetry(() => import("./pages/preview/admin/AnvandarePreview"));
const AdminAkerierPreview   = lazyRetry(() => import("./pages/preview/admin/AkerierPreview"));
const AdminVerifieringarPreview = lazyRetry(() => import("./pages/preview/admin/VerifieringarPreview"));
const AdminSystemPreview    = lazyRetry(() => import("./pages/preview/admin/SystemPreview"));
const AdminAnnonserPreview  = lazyRetry(() => import("./pages/preview/admin/AdminAnnonserPreview"));
const AdminRapporterPreview = lazyRetry(() => import("./pages/preview/admin/RapporterPreview"));
const AdminInstallningarPreview = lazyRetry(() => import("./pages/preview/admin/InstallningarPreview"));
const FavoriterPreview      = lazyRetry(() => import("./pages/preview/FavoriterPreview"));
const AkerierBrowsePreview  = lazyRetry(() => import("./pages/preview/AkerierPreview"));
const AkeriprofilPreview    = lazyRetry(() => import("./pages/preview/AkeriprofilPreview"));
const ForareInstallningarPreview = lazyRetry(() => import("./pages/preview/InstallningarPreview"));
const OnboardingForarePreview = lazyRetry(() => import("./pages/preview/OnboardingForarePreview"));
const SavedJobs             = lazyRetry(() => import("./pages/SavedJobs"));
const CompanyProfile        = lazyRetry(() => import("./pages/CompanyProfile"));
const CompanyPublicProfile  = lazyRetry(() => import("./pages/CompanyPublicProfile"));
const DriverOnboardingWizard   = lazyRetry(() => import("./pages/DriverOnboardingWizard"));
const CompanyOnboardingWizard  = lazyRetry(() => import("./pages/CompanyOnboardingWizard"));
// const CompanyVerification   = lazyRetry(() => import("./pages/CompanyVerification")); // Disabled until F-skatt/trafiktillstånd APIs are integrated
const AddCompany            = lazyRetry(() => import("./pages/AddCompany"));
const CompanyTeam           = lazyRetry(() => import("./pages/CompanyTeam"));
const InviteAccept          = lazyRetry(() => import("./pages/InviteAccept"));
const AkerierSearch         = lazyRetry(() => import("./pages/AkerierSearch"));
const PublicDriverProfile   = lazyRetry(() => import("./pages/PublicDriverProfile"));
const Branschinsikter       = lazyRetry(() => import("./pages/Branschinsikter"));
const Kompetenslaget2025    = lazyRetry(() => import("./pages/Kompetenslaget2025"));
const Kontakt               = lazyRetry(() => import("./pages/Kontakt"));
const LoneKalkylator        = lazyRetry(() => import("./pages/LoneKalkylator"));
const YkbTimer              = lazyRetry(() => import("./pages/YkbTimer"));
const CityJobList           = lazyRetry(() => import("./pages/CityJobList"));
const PatchNotes            = lazyRetry(() => import("./pages/PatchNotes"));
const VisionPresentation    = lazyRetry(() => import("./pages/VisionPresentation"));
const Settings              = lazyRetry(() => import("./pages/Settings"));
const CompanyJobDetail      = lazyRetry(() => import("./pages/CompanyJobDetail"));
const RegionJobList         = lazyRetry(() => import("./pages/RegionJobList"));
const PraktikLanding        = lazyRetry(() => import("./pages/PraktikLanding"));
const SchoolLanding         = lazyRetry(() => import("./pages/SchoolLanding"));
const HittaPraktik          = lazyRetry(() => import("./pages/HittaPraktik"));
const Arbetsmarknadsutbildning = lazyRetry(() => import("./pages/Arbetsmarknadsutbildning"));
const Partner               = lazyRetry(() => import("./pages/Partner"));
const DriverAcquisitionLanding = lazyRetry(() => import("./pages/DriverAcquisitionLanding"));
const PartnerPresentation   = lazyRetry(() => import("./pages/PartnerPresentation"));
const ClaimLanding          = lazyRetry(() => import("./pages/ClaimLanding"));
const OptOut                = lazyRetry(() => import("./pages/OptOut"));
const BloggIndex            = lazy(() => import("./pages/blogg/BloggIndex"));
const CeKorkortSverige      = lazy(() => import("./pages/blogg/CeKorkortSverige"));
const YkbGuide              = lazy(() => import("./pages/blogg/YkbGuide"));
const AdrUtbildning         = lazy(() => import("./pages/blogg/AdrUtbildning"));
const LonLastbilschauffor   = lazy(() => import("./pages/blogg/LonLastbilschauffor"));
const HittaJobbCeChauffor   = lazy(() => import("./pages/blogg/HittaJobbCeChauffor"));
const HittaCeChauffor       = lazy(() => import("./pages/blogg/HittaCeChauffor"));
const YkbFortbildning       = lazy(() => import("./pages/blogg/YkbFortbildning"));
const Kranforarbevis        = lazy(() => import("./pages/blogg/Kranforarbevis"));
const KollektivavtalAkeri   = lazy(() => import("./pages/blogg/KollektivavtalAkeri"));
const LastbilschaufforUtbildning = lazy(() => import("./pages/blogg/LastbilschaufforUtbildning"));
const ArbetstidChauffor     = lazy(() => import("./pages/blogg/ArbetstidChauffor"));
const Fjarrkörning          = lazy(() => import("./pages/blogg/Fjarrkörning"));

function PlausibleAnalytics() {
  const location = useLocation();
  useEffect(() => {
    if (typeof window.plausible === "function") {
      window.plausible("pageview");
    }
  }, [location.pathname]);
  return null;
}

/** Fångar ?skola= på vilken sida som helst och sparar i sessionStorage. */
function SchoolParamCapture() {
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const skola = params.get("skola");
    if (skola) sessionStorage.setItem("stp_school", skola);
  }, [location.search]);
  return null;
}

// Återställ scroll-position vid refresh och bakåt/framåt (POP); scrolla till toppen vid ny navigation (PUSH).
function restoreScrollTo(y) {
  const start = performance.now();
  const step = () => {
    window.scrollTo(0, y);
    // Innehållet laddas asynkront — försök tills sidan är tillräckligt hög (max 2s).
    if (Math.abs(window.scrollY - y) > 2 && performance.now() - start < 2000) {
      requestAnimationFrame(step);
    }
  };
  requestAnimationFrame(step);
}

function ScrollManager() {
  const { pathname, search, hash } = useLocation();
  const navType = useNavigationType(); // "POP" (refresh/bakåt) | "PUSH" | "REPLACE"
  const storageKey = `stp_scroll:${pathname}${search}`;

  // Vi sköter scroll-återställning manuellt (webbläsarens auto fungerar inte i en SPA med async-data).
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Spara aktuell scroll-position löpande (per sida) så den finns kvar vid refresh.
  useEffect(() => {
    const writeNow = () => {
      try { sessionStorage.setItem(storageKey, String(window.scrollY)); } catch { /* */ }
    };
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { writeNow(); ticking = false; });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("beforeunload", writeNow);
    return () => {
      writeNow();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", writeNow);
    };
  }, [storageKey]);

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      return;
    }
    if (navType === "POP") {
      // Refresh eller bakåt/framåt → stanna kvar där användaren var.
      let saved = null;
      try { saved = sessionStorage.getItem(storageKey); } catch { /* */ }
      const y = saved != null ? parseInt(saved, 10) : 0;
      if (y > 0) { restoreScrollTo(y); return; }
    }
    // Ny navigation (PUSH/REPLACE) → börja högst upp.
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search, hash]);

  return null;
}


const ONBOARDING_PATHS = ["/onboarding/forare", "/foretag/onboarding"];
// Sidor som har en egen kompletteringsvy — visa inte den globala bannern där (redundant)
const COMPLETION_SELF_PATHS = ["/profil", "/installningar"];

function DriverCompletionNudge() {
  const { user, isDriver } = useAuth();
  const { profile, profileLoaded } = useProfile();
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const isOnboarding = ONBOARDING_PATHS.some((p) => matchPath(p, pathname));
  const hasOwnCompletionUI = COMPLETION_SELF_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  // På mobil tar bannern för mycket plats — profilsidan har en egen prompt, så
  // den globala bannern visas bara på desktop. (Beslut: ägaren 2026-06-17.)
  if (isMobile || !isDriver || !profileLoaded || !user || user.isAdmin || isOnboarding || hasOwnCompletionUI) return null;
  const p = { ...profile, name: profile?.name || user.name };
  const items = DRIVER_ITEMS.map((item) => ({ label: item.label, done: item.fn(p) }));
  const pct = Math.round((items.filter((i) => i.done).length / items.length) * 100);
  const missing = items.filter((i) => !i.done);
  return (
    <ProfileCompletionBanner
      pct={pct}
      missing={missing}
      profileUrl="/profil?redigera=1"
      storageKey={`stp-profile-banner:${user.id}`}
    />
  );
}

// Routes where the mobile bottom nav should appear (driver-only pages)
const BOTTOM_NAV_PATHS = [
  "/jobb", "/favoriter", "/meddelanden", "/mina-ansokningar", "/profil",
  "/akerier", "/foretag/",  // akerier browse + company public profiles
];

function AppLayout() {
  const { user, isCompany, isDriver, isImpersonating } = useAuth();
  const onboarding = useOnboardingRequired();
  const isMobile = useIsMobile();
  const { pathname } = useLocation();

  // En öppnad meddelandetråd (/meddelanden/:id) är fullskärm med egen header +
  // composer — dölj bottennaven där så den inte överlappar inmatningsfältet.
  const onMessageThread = pathname.startsWith("/meddelanden/") && pathname !== "/meddelanden";

  // Jobbdetaljen (/jobb/:id) är en egen fullskärmsvy (egen back-bar + fast Ansök-bar)
  // för ALLA på mobil — dölj global header/footer/bottennav där, precis som prototypen.
  const isJobDetailMobile = isMobile && !!matchPath("/jobb/:id", pathname);

  // Show bottom nav on mobile for driver-relevant routes
  const showBottomNav = isMobile && isDriver && !onMessageThread && !isJobDetailMobile &&
    BOTTOM_NAV_PATHS.some((p) => pathname === p || pathname.startsWith(p));

  // On mobile + driver pages: hide the desktop header and footer
  const hideChromeOnMobile = isMobile && isDriver &&
    (pathname.startsWith("/jobb") || pathname.startsWith("/favoriter") ||
     pathname.startsWith("/meddelanden") || pathname.startsWith("/mina-ansokningar") ||
     pathname.startsWith("/profil") || pathname.startsWith("/akerier") ||
     pathname.startsWith("/onboarding/forare"));

  // Auth pages are standalone full-screen layouts — no site header/footer
  const isAuthPage = ["/login", "/registrera", "/verifiera-email", "/aterstall-losenord", "/demo-valkommen"].some(p => pathname.startsWith(p));

  // Admin pages use their own sidebar layout — no top nav
  const isAdminPage = pathname.startsWith("/admin");

  // Onboarding wizards are full-screen standalone layouts — no top nav
  const isOnboardingPage = pathname.startsWith("/onboarding/") || pathname.startsWith("/foretag/onboarding");

  // STP (4) design-preview screens render standalone (egen TopNav) — ingen global chrome
  const isPreviewPage = pathname.startsWith("/preview/");

  // Mobil publik reskin (utloggad): Landing ("/") och guest-jobb ("/jobb") har
  // egen header/meny → dölj global chrome. (/jobb/:id hanteras separat.)
  const isMobilePublicScreen = isMobile && !user && (pathname === "/" || pathname === "/jobb");

  // Mobil juridik (villkor/integritet): egen mobil-shell (back-bar + doc-toggle)
  // ersätter desktop-tvåkolumnslayouten. Gäller oavsett inloggning.
  const isMobileLegal = isMobile && (pathname === "/anvandarvillkor" || pathname === "/integritet");

  // ── NEW MOBILE (reskin) ──────────────────────────────────────────────
  // On mobile, a logged-in driver gets the fully rebuilt STP Mobil app
  // (own shell, tab bar, sheets). This wholly replaces the desktop chrome +
  // page bodies for the driver-app routes — desktop is untouched.
  const isDriverMobileRoute = DRIVER_MOBILE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p)
  );
  if (isMobile && isDriver && isDriverMobileRoute && !isAuthPage && !isAdminPage && !isOnboardingPage && !isPreviewPage) {
    return (
      <Suspense fallback={<div className="min-h-screen" />}>
        <DriverMobileApp />
      </Suspense>
    );
  }

  // Mobile company (Åkeri) app — own shell + tab bar, replaces desktop chrome
  // for the company dashboard routes (not /foretag/:id public profile or onboarding).
  const isCompanyMobileRoute = pathname === "/foretag"
    || ["/foretag/annonser", "/foretag/chaufforer", "/foretag/meddelanden", "/foretag/mer", "/foretag/profil"].some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isMobile && isCompany && isCompanyMobileRoute && !isAuthPage && !isAdminPage && !isOnboardingPage && !isPreviewPage) {
    return (
      <Suspense fallback={<div className="min-h-screen" />}>
        <CompanyMobileApp />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ overflowX: "clip" }}>
      {!hideChromeOnMobile && !isMobilePublicScreen && !isMobileLegal && !isJobDetailMobile && !isAuthPage && !isAdminPage && !isOnboardingPage && !isPreviewPage && (
        user ? <AppTopNav /> : <Header onboarding={onboarding} />
      )}
      {/* Profilbanner sitter tätt under headern (utanför pt-16-paddingen) */}
      <DriverCompletionNudge />
      <div className={hideChromeOnMobile || isMobilePublicScreen || isMobileLegal || isJobDetailMobile || isAuthPage || isOnboardingPage || isPreviewPage ? "flex-1" : `flex-1 ${isImpersonating ? "pt-[104px]" : "pt-16"}`}>
        <OnboardingGate>
        <Suspense fallback={<div className="min-h-[60vh]" />}>
        <Routes>
                  <Route path="/" element={isMobile && !user ? <MobileLanding /> : (isMobile && isDriver ? <Navigate to="/hem" replace /> : <Home />)} />
                  <Route path="/forare" element={<ForDrivers />} />
                  <Route path="/forare/:id" element={<PublicDriverProfile />} />
                  <Route path="/for-akerier" element={<ForCompaniesLanding />} />
                  <Route path="/jobb" element={isMobile && !user ? <MobileGuestJobs /> : <JobList />} />
                  <Route path="/jobb/:id" element={<JobDetail />} />
                  <Route path="/jobb/:id/ansok" element={<Apply />} />
                  <Route path="/akerier" element={<AkerierSearch />} />
                  <Route path="/foretag" element={isCompany ? <ForCompanies /> : <ForCompaniesLanding />} />
                  <Route path="/foretag/:id" element={<CompanyPublicProfile />} />
                  <Route path="/om-oss" element={<About />} />
                  <Route path="/branschinsikter" element={<Branschinsikter />} />
                  <Route path="/branschinsikter/kompetenslaget-2025" element={<Kompetenslaget2025 />} />
                  <Route path="/lastbilsjobb/:regionSlug" element={<RegionJobList />} />
                  <Route path="/ce-jobb/:citySlug" element={<CityJobList />} />
                  <Route path="/blogg" element={<BloggIndex />} />
                  <Route path="/blogg/ce-korkort-sverige" element={<CeKorkortSverige />} />
                  <Route path="/blogg/ykb-yrkesforarkompetens" element={<YkbGuide />} />
                  <Route path="/blogg/adr-utbildning-farligt-gods" element={<AdrUtbildning />} />
                  <Route path="/blogg/lon-lastbilschauffor" element={<LonLastbilschauffor />} />
                  <Route path="/blogg/hitta-jobb-ce-chauffor" element={<HittaJobbCeChauffor />} />
                  <Route path="/blogg/hitta-ce-chauffor" element={<HittaCeChauffor />} />
                  <Route path="/blogg/ykb-fortbildning" element={<YkbFortbildning />} />
                  <Route path="/blogg/kranforarbevis" element={<Kranforarbevis />} />
                  <Route path="/blogg/kollektivavtal-akeri" element={<KollektivavtalAkeri />} />
                  <Route path="/blogg/lastbilschauffor-utbildning" element={<LastbilschaufforUtbildning />} />
                  <Route path="/blogg/arbetstid-chauffor" element={<ArbetstidChauffor />} />
                  <Route path="/blogg/fjarrkörning" element={<Fjarrkörning />} />
                  <Route path="/kontakt" element={<Kontakt />} />
                  <Route path="/lon-kalkylator" element={<LoneKalkylator />} />
                  <Route path="/ykb-timer" element={<YkbTimer />} />
                  <Route path="/praktik" element={<PraktikLanding />} />
                  <Route path="/hitta-praktik" element={<HittaPraktik />} />
                  <Route path="/arbetsmarknadsutbildning" element={<Arbetsmarknadsutbildning />} />
                  <Route path="/partner" element={<Partner />} />
                  <Route path="/partner/presentation" element={<PartnerPresentation />} />
                  <Route path="/skola/:slug" element={<SchoolLanding />} />
                  <Route path="/uppdateringar" element={<PatchNotes />} />
                  <Route path="/vision" element={<VisionPresentation />} />
                  <Route path="/login" element={isMobile && !user ? <MobileAuth /> : <Login />} />
                  {/* Direktlänk till registrering — besökare skriver in /registrera för hand */}
                  <Route path="/registrera" element={isMobile && !user ? <MobileAuth /> : <Navigate to="/login?mode=register" replace />} />
                  <Route path="/anslut/:token" element={<ClaimLanding />} />
                  <Route path="/avregistrera/:token" element={<OptOut />} />
                  <Route path="/invite/accept" element={<InviteAccept />} />
                  <Route path="/verifiera-email" element={<VerifyEmail />} />
                  <Route path="/aterstall-losenord" element={<ResetPassword />} />
                  <Route path="/demo-valkommen" element={<DemoWelcome />} />
                  <Route path="/anvandarvillkor" element={isMobile ? <MobileLegal defaultDoc="terms" /> : <Terms />} />
                  <Route path="/integritet" element={isMobile ? <MobileLegal defaultDoc="privacy" /> : <Privacy />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <Admin />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/status"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <Status />
                      </ProtectedRoute>
                    }
                  />

                  {/* Driver only */}
                  <Route
                    path="/profil"
                    element={
                      <ProtectedRoute requiredRole="driver">
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/onboarding/forare"
                    element={
                      <ProtectedRoute requiredRole="driver">
                        {isMobile ? <MobileDriverOnboarding /> : <DriverOnboardingWizard />}
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/meddelanden"
                    element={
                      <ProtectedRoute requiredRole="driver">
                        <Messages />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/meddelanden/:id"
                    element={
                      <ProtectedRoute requiredRole="driver">
                        <Messages />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/favoriter"
                    element={
                      <ProtectedRoute requiredRole="driver">
                        <SavedJobs />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/mina-ansokningar"
                    element={
                      <ProtectedRoute requiredRole="driver">
                        <MinaAnsokningar />
                      </ProtectedRoute>
                    }
                  />

                  {/* Settings — both roles (uses own redirect in component) */}
                  <Route path="/installningar" element={<Settings />} />

                  {/* Company only */}
                  <Route
                    path="/foretag/mina-jobb"
                    element={
                      <ProtectedRoute requiredRole="company">
                        <MinaJobb />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/foretag/annonser"
                    element={
                      <ProtectedRoute requiredRole="company">
                        <MinaJobb />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/foretag/annonser/:id"
                    element={
                      <ProtectedRoute requiredRole="company">
                        <CompanyJobDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/foretag/onboarding"
                    element={
                      <ProtectedRoute requiredRole="company">
                        {isMobile ? <MobileCompanyOnboarding /> : <CompanyOnboardingWizard />}
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/foretag/annonsera"
                    element={
                      <ProtectedRoute requiredRole="company">
                        <PostJob />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/foretag/chaufforer"
                    element={
                      <ProtectedRoute requiredRole="company">
                        <DriverSearch />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/foretag/chaufforer/:id"
                    element={
                      <ProtectedRoute requiredRole="company">
                        <DriverDetail />
                      </ProtectedRoute>
                    }
                  />
                  {/* /foretag/verifiering disabled — see CompanyVerification.jsx */}
                  <Route
                    path="/foretag/profil"
                    element={
                      <ProtectedRoute requiredRole="company">
                        <CompanyProfile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/foretag/lagg-till-akeri"
                    element={
                      <ProtectedRoute requiredRole="company">
                        <AddCompany />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/foretag/team"
                    element={
                      <ProtectedRoute requiredRole="company">
                        <CompanyTeam />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/foretag/meddelanden"
                    element={
                      <ProtectedRoute requiredRole="company">
                        <Messages />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/foretag/meddelanden/:id"
                    element={
                      <ProtectedRoute requiredRole="company">
                        <Messages />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/preview" element={<PreviewIndex />} />
                  <Route path="/preview/landing" element={<LandingPreview />} />
                  <Route path="/preview/felsidor" element={<FelsidorPreview />} />
                  <Route path="/preview/states" element={<StatesPreview />} />
                  <Route path="/preview/dialoger" element={<DialogerPreview />} />
                  <Route path="/preview/notiser-sok" element={<NotiserSokPreview />} />
                  <Route path="/preview/juridik" element={<JuridikPreview />} />
                  <Route path="/preview/innehallssidor" element={<InnehallssidorPreview />} />
                  <Route path="/preview/jobbdetalj" element={<JobbdetaljPreview />} />
                  <Route path="/preview/lediga-jobb" element={<LedigaJobbPreview />} />
                  <Route path="/preview/forarprofil" element={<ForarprofilPreview />} />
                  <Route path="/preview/ansokan" element={<AnsokanPreview />} />
                  <Route path="/preview/mina-ansokningar" element={<MinaAnsokningarPreview />} />
                  <Route path="/preview/inkorg" element={<InkorgPreview />} />
                  <Route path="/preview/akeri/dashboard" element={<AkeriDashboardPreview />} />
                  <Route path="/preview/akeri/annonser" element={<AkeriAnnonserPreview />} />
                  <Route path="/preview/akeri/hitta-forare" element={<AkeriHittaForarePreview />} />
                  <Route path="/preview/akeri/skapa-annons" element={<AkeriSkapaAnnonsPreview />} />
                  <Route path="/preview/akeri/ansokningar" element={<AkeriKanbanPreview />} />
                  <Route path="/preview/akeri/foretagsprofil" element={<AkeriForetagsprofilPreview />} />
                  <Route path="/preview/akeri/forarprofil" element={<AkeriForarprofilPreview />} />
                  <Route path="/preview/akeri/verifiering" element={<AkeriVerifieringPreview />} />
                  <Route path="/preview/akeri/inkorg" element={<AkeriInkorgPreview />} />
                  <Route path="/preview/akeri/onboarding" element={<AkeriOnboardingPreview />} />
                  <Route path="/preview/admin/oversikt" element={<AdminOversiktPreview />} />
                  <Route path="/preview/admin/anvandare" element={<AdminAnvandarePreview />} />
                  <Route path="/preview/admin/akerier" element={<AdminAkerierPreview />} />
                  <Route path="/preview/admin/verifieringar" element={<AdminVerifieringarPreview />} />
                  <Route path="/preview/admin/system" element={<AdminSystemPreview />} />
                  <Route path="/preview/admin/annonser" element={<AdminAnnonserPreview />} />
                  <Route path="/preview/admin/rapporter" element={<AdminRapporterPreview />} />
                  <Route path="/preview/admin/installningar" element={<AdminInstallningarPreview />} />
                  <Route path="/preview/favoriter" element={<FavoriterPreview />} />
                  <Route path="/preview/akerier" element={<AkerierBrowsePreview />} />
                  <Route path="/preview/akeriprofil" element={<AkeriprofilPreview />} />
                  <Route path="/preview/installningar" element={<ForareInstallningarPreview />} />
                  <Route path="/preview/onboarding-forare" element={<OnboardingForarePreview />} />
                  <Route path="/ingen-atkomst" element={<Forbidden />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
        </Suspense>
        </OnboardingGate>
              </div>
              {!hideChromeOnMobile && !isMobilePublicScreen && !isMobileLegal && !isJobDetailMobile && !isAuthPage && !isPreviewPage && <Footer />}
              {/* Flytande feedback-knapp bara på desktop — på mobil krockar den med
                  sticky-CTA:er (ansök/kontakta) och tar dyrbar skärmyta. */}
              {!isMobile && !hideChromeOnMobile && !isAuthPage && !isPreviewPage && <FeedbackButton />}
              <InstallPrompt />
              <CookieBanner />
              {showBottomNav && <BottomNav />}
            </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <PlausibleAnalytics />
      <SchoolParamCapture />
      <VercelAnalytics />
      <ThemeProvider>
        <ErrorBoundary>
          <ConnectivityGate>
          <OAuthProviders>
            <AuthProvider>
              <NotificationProvider>
              <ProfileProvider>
                <ChatProvider>
                  <ToastProvider>
                    <ConfirmProvider>
                      <Routes>
                        {/* Standalone landing pages — ingen header/footer */}
                        <Route path="/bli-forare" element={<DriverAcquisitionLanding />} />
                        {/* Alla andra sidor via AppLayout */}
                        <Route path="/*" element={<AppLayout />} />
                      </Routes>
                    </ConfirmProvider>
                  </ToastProvider>
                </ChatProvider>
              </ProfileProvider>
              </NotificationProvider>
            </AuthProvider>
          </OAuthProviders>
          </ConnectivityGate>
        </ErrorBoundary>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
