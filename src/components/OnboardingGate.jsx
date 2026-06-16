import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { isDriverMinimumProfileComplete } from "../utils/driverProfileRequirements";

/** Returnerar true om användaren är inloggad men inte slutfört onboarding. */
export function useOnboardingRequired() {
  const { user, isDriver, isCompany, isAdmin } = useAuth();
  const { profile, profileLoaded } = useProfile();

  if (!user) return false;
  if (isAdmin) return false;
  if (user.isDemo) return false; // demokonton landar direkt i den fyllda vyn
  if (isDriver) return profileLoaded && !isDriverMinimumProfileComplete(profile);
  if (isCompany) return false; // companies use dashboard empty state instead
  return false;
}

const SKIP_PATHS = [
  "/login",
  "/invite",
  "/verifiera-email",
  "/aterstall-losenord",
  "/anvandarvillkor",
  "/integritet",
  "/admin",
];

/** Redirecterar inloggade användare till onboarding om de inte fyllt i obligatoriska fält. */
export default function OnboardingGate({ children }) {
  const { user, isDriver, isAdmin } = useAuth();
  const { profile, profileLoaded } = useProfile();
  const location = useLocation();
  const path = location.pathname;

  if (!user) return children;
  if (isAdmin) return children;
  // Demokonton (kund/partner/investerare) ska aldrig fastna i onboarding —
  // de ska kunna utforska den fyllda dashboarden direkt.
  if (user.isDemo) return children;

  if (SKIP_PATHS.some((p) => path === p || path.startsWith(p + "/"))) {
    return children;
  }

  // Sidor där en ofullständig profil MÅSTE kompletteras först (förarens privata ytor +
  // själva ansökan). På publika/browse-sidor (hem, jobb, jobbdetalj) får ofullständiga
  // förare vara kvar — så en refresh laddar där man var i stället för att bouncas till
  // onboarding. Post-signup pushas man ändå till onboarding direkt via Login.
  const REQUIRES_ONBOARDING = ["/profil", "/meddelanden", "/favoriter", "/mina-ansokningar"];
  const pathNeedsOnboarding =
    REQUIRES_ONBOARDING.some((p) => path === p || path.startsWith(p + "/")) ||
    /^\/jobb\/[^/]+\/ansok$/.test(path); // ansökningsformuläret

  if (isDriver) {
    if (!profileLoaded) return children;
    if (!isDriverMinimumProfileComplete(profile) && path !== "/onboarding/forare" && pathNeedsOnboarding) {
      return <Navigate to="/onboarding/forare" state={{ from: path }} replace />;
    }
  }

  if (!user.shouldShowOnboarding) return children;

  return children;
}
