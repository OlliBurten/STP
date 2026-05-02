import { lazy, Suspense, useEffect } from "react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { BrowserRouter, Routes, Route, useLocation, matchPath } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import OAuthProviders from "./components/OAuthProviders";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProfileProvider } from "./context/ProfileContext";
import { ChatProvider } from "./context/ChatContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import OnboardingGate, { useOnboardingRequired } from "./components/OnboardingGate";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { useAuth } from "./context/AuthContext";
import { useProfile } from "./context/ProfileContext";
import ProfileCompletionBanner from "./components/ProfileCompletionBanner";
import FeedbackButton from "./components/FeedbackButton";

// Lazy-loaded pages — each becomes its own chunk
const Home                  = lazy(() => import("./pages/Home"));
const ForDrivers            = lazy(() => import("./pages/ForDrivers"));
const ForCompaniesLanding   = lazy(() => import("./pages/ForCompaniesLanding"));
const JobList               = lazy(() => import("./pages/JobList"));
const JobDetail             = lazy(() => import("./pages/JobDetail"));
const ForCompanies          = lazy(() => import("./pages/ForCompanies"));
const PostJob               = lazy(() => import("./pages/PostJob"));
const About                 = lazy(() => import("./pages/About"));
const Profile               = lazy(() => import("./pages/Profile"));
const DriverSearch          = lazy(() => import("./pages/DriverSearch"));
const DriverDetail          = lazy(() => import("./pages/DriverDetail"));
const MinaJobb              = lazy(() => import("./pages/MinaJobb"));
const MinaAnsokningar       = lazy(() => import("./pages/MinaAnsokningar"));
const Messages              = lazy(() => import("./pages/Messages"));
const Login                 = lazy(() => import("./pages/Login"));
const VerifyEmail           = lazy(() => import("./pages/VerifyEmail"));
const ResetPassword         = lazy(() => import("./pages/ResetPassword"));
const Terms                 = lazy(() => import("./pages/Terms"));
const Privacy               = lazy(() => import("./pages/Privacy"));
const Admin                 = lazy(() => import("./pages/Admin"));
const Status                = lazy(() => import("./pages/Status"));
const NotFound              = lazy(() => import("./pages/NotFound"));
const SavedJobs             = lazy(() => import("./pages/SavedJobs"));
const CompanyProfile        = lazy(() => import("./pages/CompanyProfile"));
const CompanyPublicProfile  = lazy(() => import("./pages/CompanyPublicProfile"));
const DriverOnboardingWizard   = lazy(() => import("./pages/DriverOnboardingWizard"));
const CompanyOnboardingWizard  = lazy(() => import("./pages/CompanyOnboardingWizard"));
const AddCompany            = lazy(() => import("./pages/AddCompany"));
const InviteAccept          = lazy(() => import("./pages/InviteAccept"));
const AkerierSearch         = lazy(() => import("./pages/AkerierSearch"));
const PublicDriverProfile   = lazy(() => import("./pages/PublicDriverProfile"));
const Branschinsikter       = lazy(() => import("./pages/Branschinsikter"));
const Kompetenslaget2025    = lazy(() => import("./pages/Kompetenslaget2025"));
const Kontakt               = lazy(() => import("./pages/Kontakt"));
const LoneKalkylator        = lazy(() => import("./pages/LoneKalkylator"));
const PatchNotes            = lazy(() => import("./pages/PatchNotes"));
const VisionPresentation    = lazy(() => import("./pages/VisionPresentation"));
const RegionJobList         = lazy(() => import("./pages/RegionJobList"));
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

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const DRIVER_ITEMS = [
  { key: "name",             label: "Namn",                   fn: (p) => String(p.name || "").trim().length >= 2 },
  { key: "phone",            label: "Telefonnummer",           fn: (p) => String(p.phone || "").replace(/\D/g, "").length >= 7 },
  { key: "primarySegment",   label: "Primärt segment",         fn: (p) => String(p.primarySegment || "").trim().length > 0 },
  { key: "location",         label: "Ort",                    fn: (p) => String(p.location || "").trim().length > 0 },
  { key: "region",           label: "Region",                  fn: (p) => String(p.region || "").trim().length > 0 },
  { key: "licenses",         label: "Körkort",                 fn: (p) => Array.isArray(p.licenses) && p.licenses.length > 0 },
  { key: "availability",     label: "Tillgänglighet",          fn: (p) => String(p.availability || "").trim().length > 0 },
  { key: "summary",          label: "Profiltext (20+ tecken)", fn: (p) => String(p.summary || "").trim().length >= 20 },
  { key: "visibleToCompanies", label: "Synlig för åkerier",   fn: (p) => p.visibleToCompanies === true },
  { key: "experience",       label: "Erfarenhet",              fn: (p) => Array.isArray(p.experience) && p.experience.length > 0 },
  { key: "certificates",     label: "Certifikat (YKB/ADR)",   fn: (p) => Array.isArray(p.certificates) && p.certificates.length > 0 },
  { key: "regionsWilling",   label: "Körregioner",             fn: (p) => Array.isArray(p.regionsWilling) && p.regionsWilling.length > 0 },
];

const ONBOARDING_PATHS = ["/onboarding/forare", "/foretag/onboarding"];

function DriverCompletionNudge() {
  const { user, isDriver } = useAuth();
  const { profile, profileLoaded } = useProfile();
  const { pathname } = useLocation();
  const isOnboarding = ONBOARDING_PATHS.some((p) => matchPath(p, pathname));
  if (!isDriver || !profileLoaded || !user || user.isAdmin || isOnboarding) return null;
  const p = { ...profile, name: profile?.name || user.name };
  const items = DRIVER_ITEMS.map((item) => ({ label: item.label, done: item.fn(p) }));
  const pct = Math.round((items.filter((i) => i.done).length / items.length) * 100);
  const missing = items.filter((i) => !i.done);
  return (
    <ProfileCompletionBanner
      pct={pct}
      missing={missing}
      profileUrl="/profil"
      storageKey={`stp-profile-banner:${user.id}`}
    />
  );
}

function AppLayout() {
  const { user, isCompany, isImpersonating } = useAuth();
  const onboarding = useOnboardingRequired();
  return (
    <div className="min-h-screen flex flex-col" style={{ overflowX: "clip" }}>
      <Header onboarding={onboarding} />
      <div className={`flex-1 ${isImpersonating ? "pt-[104px]" : "pt-16"}`}>
        <DriverCompletionNudge />
        <OnboardingGate>
        <Suspense fallback={<div className="min-h-[60vh]" />}>
        <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/forare" element={<ForDrivers />} />
                  <Route path="/forare/:id" element={<PublicDriverProfile />} />
                  <Route path="/for-akerier" element={<ForCompaniesLanding />} />
                  <Route path="/jobb" element={<JobList />} />
                  <Route path="/jobb/:id" element={<JobDetail />} />
                  <Route path="/akerier" element={<AkerierSearch />} />
                  <Route path="/foretag" element={isCompany ? <ForCompanies /> : <ForCompaniesLanding />} />
                  <Route path="/foretag/:id" element={<CompanyPublicProfile />} />
                  <Route path="/om-oss" element={<About />} />
                  <Route path="/branschinsikter" element={<Branschinsikter />} />
                  <Route path="/branschinsikter/kompetenslaget-2025" element={<Kompetenslaget2025 />} />
                  <Route path="/lastbilsjobb/:regionSlug" element={<RegionJobList />} />
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
                  <Route path="/uppdateringar" element={<PatchNotes />} />
                  <Route path="/vision" element={<VisionPresentation />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/invite/accept" element={<InviteAccept />} />
                  <Route path="/verifiera-email" element={<VerifyEmail />} />
                  <Route path="/aterstall-losenord" element={<ResetPassword />} />
                  <Route path="/anvandarvillkor" element={<Terms />} />
                  <Route path="/integritet" element={<Privacy />} />
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
                        <DriverOnboardingWizard />
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
                    path="/foretag/onboarding"
                    element={
                      <ProtectedRoute requiredRole="company">
                        <CompanyOnboardingWizard />
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
                  <Route path="*" element={<NotFound />} />
                </Routes>
        </Suspense>
        </OnboardingGate>
              </div>
              <Footer />
              <FeedbackButton />
            </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <PlausibleAnalytics />
      <VercelAnalytics />
      <ErrorBoundary>
        <OAuthProviders>
          <AuthProvider>
            <ProfileProvider>
              <ChatProvider>
                <ToastProvider>
                  <AppLayout />
                </ToastProvider>
              </ChatProvider>
            </ProfileProvider>
          </AuthProvider>
        </OAuthProviders>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
