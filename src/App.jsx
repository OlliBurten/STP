import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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
import Home from "./pages/Home";
import ForDrivers from "./pages/ForDrivers";
import ForCompaniesLanding from "./pages/ForCompaniesLanding";
import JobList from "./pages/JobList";
import JobDetail from "./pages/JobDetail";
import ForCompanies from "./pages/ForCompanies";
import PostJob from "./pages/PostJob";
import About from "./pages/About";
import Profile from "./pages/Profile";
import DriverSearch from "./pages/DriverSearch";
import DriverDetail from "./pages/DriverDetail";
import MinaJobb from "./pages/MinaJobb";
import MinaAnsokningar from "./pages/MinaAnsokningar";
import Messages from "./pages/Messages";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Admin from "./pages/Admin";
import Status from "./pages/Status";
import NotFound from "./pages/NotFound";
import SavedJobs from "./pages/SavedJobs";
import CompanyProfile from "./pages/CompanyProfile";
import CompanyPublicProfile from "./pages/CompanyPublicProfile";
import DriverOnboardingWizard from "./pages/DriverOnboardingWizard";
import CompanyOnboardingWizard from "./pages/CompanyOnboardingWizard";
import AddCompany from "./pages/AddCompany";
import InviteAccept from "./pages/InviteAccept";
import AkerierSearch from "./pages/AkerierSearch";
import Branschinsikter from "./pages/Branschinsikter";
import Kompetenslaget2025 from "./pages/Kompetenslaget2025";
import Kontakt from "./pages/Kontakt";
import PatchNotes from "./pages/PatchNotes";
import VisionPresentation from "./pages/VisionPresentation";
import { useAuth } from "./context/AuthContext";
import { useProfile } from "./context/ProfileContext";
import ProfileCompletionBanner from "./components/ProfileCompletionBanner";
import FeedbackButton from "./components/FeedbackButton";
import { useEffect } from "react";

function Analytics() {
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

function DriverCompletionNudge() {
  const { user, isDriver } = useAuth();
  const { profile, profileLoaded } = useProfile();
  if (!isDriver || !profileLoaded || !user || user.isAdmin) return null;
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
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header onboarding={onboarding} />
      <div className={`flex-1 ${isImpersonating ? "pt-[104px]" : "pt-16"}`}>
        <DriverCompletionNudge />
        <OnboardingGate>
        <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/forare" element={<ForDrivers />} />
                  <Route path="/for-akerier" element={<ForCompaniesLanding />} />
                  <Route path="/jobb" element={<JobList />} />
                  <Route path="/jobb/:id" element={<JobDetail />} />
                  <Route path="/akerier" element={<AkerierSearch />} />
                  <Route path="/foretag" element={isCompany ? <ForCompanies /> : <ForCompaniesLanding />} />
                  <Route path="/foretag/:id" element={<CompanyPublicProfile />} />
                  <Route path="/om-oss" element={<About />} />
                  <Route path="/branschinsikter" element={<Branschinsikter />} />
                  <Route path="/branschinsikter/kompetenslaget-2025" element={<Kompetenslaget2025 />} />
                  <Route path="/kontakt" element={<Kontakt />} />
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
      <Analytics />
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
