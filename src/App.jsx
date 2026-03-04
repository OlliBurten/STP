import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProfileProvider } from "./context/ProfileContext";
import { ChatProvider } from "./context/ChatContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import Footer from "./components/Footer";
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
import Status from "./pages/Status";
import NotFound from "./pages/NotFound";
import SavedJobs from "./pages/SavedJobs";
import CompanyProfile from "./pages/CompanyProfile";
import CompanyPublicProfile from "./pages/CompanyPublicProfile";
import DriverOnboardingWizard from "./pages/DriverOnboardingWizard";
import CompanyOnboardingWizard from "./pages/CompanyOnboardingWizard";
import AkerierSearch from "./pages/AkerierSearch";
import Branschinsikter from "./pages/Branschinsikter";
import Kompetenslaget2025 from "./pages/Kompetenslaget2025";
import Kontakt from "./pages/Kontakt";
import { useAuth } from "./context/AuthContext";

function AppLayout() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header />
      <div className="flex-1 pt-16">
        <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/jobb" element={<JobList />} />
                  <Route path="/jobb/:id" element={<JobDetail />} />
                  <Route path="/akerier" element={<AkerierSearch />} />
                  <Route path="/foretag" element={<ForCompanies />} />
                  <Route path="/foretag/:id" element={<CompanyPublicProfile />} />
                  <Route path="/om-oss" element={<About />} />
                  <Route path="/branschinsikter" element={<Branschinsikter />} />
                  <Route path="/branschinsikter/kompetenslaget-2025" element={<Kompetenslaget2025 />} />
                  <Route path="/kontakt" element={<Kontakt />} />
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
              {!user && <Footer />}
            </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <ChatProvider>
            <AppLayout />
          </ChatProvider>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
