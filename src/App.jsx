import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProfileProvider } from "./context/ProfileContext";
import { ChatProvider } from "./context/ChatContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import Home from "./pages/Home";
import JobList from "./pages/JobList";
import JobDetail from "./pages/JobDetail";
import ForCompanies from "./pages/ForCompanies";
import PostJob from "./pages/PostJob";
import About from "./pages/About";
import Profile from "./pages/Profile";
import DriverSearch from "./pages/DriverSearch";
import DriverDetail from "./pages/DriverDetail";
import MinaJobb from "./pages/MinaJobb";
import Messages from "./pages/Messages";
import Login from "./pages/Login";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import SavedJobs from "./pages/SavedJobs";
import CompanyProfile from "./pages/CompanyProfile";
import CompanyPublicProfile from "./pages/CompanyPublicProfile";
import DriverOnboardingWizard from "./pages/DriverOnboardingWizard";
import CompanyOnboardingWizard from "./pages/CompanyOnboardingWizard";
import AkerierSearch from "./pages/AkerierSearch";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <ChatProvider>
            <div className="min-h-screen flex flex-col overflow-x-hidden">
              <Header />
              <div className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/jobb" element={<JobList />} />
                  <Route path="/jobb/:id" element={<JobDetail />} />
                  <Route path="/akerier" element={<AkerierSearch />} />
                  <Route path="/foretag" element={<ForCompanies />} />
                  <Route path="/foretag/:id" element={<CompanyPublicProfile />} />
                  <Route path="/om-oss" element={<About />} />
                  <Route path="/login" element={<Login />} />
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
              </div>
              <footer className="mt-auto py-8 border-t border-slate-200 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-slate-500">
                  <p>DriverMatch – Jobb för yrkesförare och rekrytering av chaufförer i Sverige</p>
                  <p className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
                    <Link to="/" className="hover:text-[var(--color-primary)]">Startsida</Link>
                    <Link to="/jobb" className="hover:text-[var(--color-primary)]">Jobb</Link>
                    <Link to="/akerier" className="hover:text-[var(--color-primary)]">Åkerier</Link>
                    <Link to="/#sa-fungerar-det" className="hover:text-[var(--color-primary)]">Så fungerar det</Link>
                    <a href="mailto:info@drivermatch.se" className="hover:text-[var(--color-primary)]">Kontakta oss</a>
                    <Link to="/anvandarvillkor" className="hover:text-[var(--color-primary)]">Användarvillkor</Link>
                    <Link to="/integritet" className="hover:text-[var(--color-primary)]">Integritetspolicy</Link>
                  </p>
                </div>
              </footer>
            </div>
          </ChatProvider>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
