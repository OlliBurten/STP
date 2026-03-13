import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";

/** Returnerar true om användaren är inloggad men inte slutfört onboarding. */
export function useOnboardingRequired() {
  const { user, isDriver, isCompany } = useAuth();
  const { profile } = useProfile();

  if (!user) return false;
  if (isDriver) return !Boolean(profile?.primarySegment?.trim());
  if (isCompany) return !(Array.isArray(user?.companySegmentDefaults) && user.companySegmentDefaults.length > 0);
  return false;
}

const SKIP_PATHS = [
  "/login",
  "/verifiera-email",
  "/aterstall-losenord",
  "/anvandarvillkor",
  "/integritet",
  "/admin",
];

/** Redirecterar inloggade användare till onboarding om de inte fyllt i obligatoriska fält. */
export default function OnboardingGate({ children }) {
  const { user, isDriver, isCompany } = useAuth();
  const { profile } = useProfile();
  const location = useLocation();
  const path = location.pathname;

  if (!user) return children;

  if (SKIP_PATHS.some((p) => path === p || path.startsWith(p + "/"))) {
    return children;
  }

  if (isDriver) {
    const hasPrimarySegment = Boolean(profile?.primarySegment?.trim());
    if (!hasPrimarySegment && path !== "/onboarding/forare") {
      return <Navigate to="/onboarding/forare" state={{ from: path }} replace />;
    }
  }

  if (isCompany) {
    const hasSegments =
      Array.isArray(user?.companySegmentDefaults) && user.companySegmentDefaults.length > 0;
    if (!hasSegments && path !== "/foretag/onboarding" && !path.startsWith("/foretag/onboarding")) {
      return <Navigate to="/foretag/onboarding" state={{ from: path }} replace />;
    }
  }

  return children;
}
