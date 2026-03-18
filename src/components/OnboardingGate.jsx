import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";

/** Returnerar true om användaren är inloggad men inte slutfört onboarding. */
export function useOnboardingRequired() {
  const { user, isDriver, isCompany, isAdmin } = useAuth();
  const { profile, profileLoaded } = useProfile();
  const isCompanyMember = Boolean(user?.companyOwnerId && user.companyOwnerId !== user?.id);
  const hasSegments =
    Array.isArray(user?.companySegmentDefaults) && user.companySegmentDefaults.length > 0;
  const hasOrganizationContext = Boolean(user?.organizationId || user?.companyOwnerId);

  if (!user) return false;
  if (isAdmin) return false;
  if (isDriver) return profileLoaded && !Boolean(profile?.primarySegment?.trim());
  if (isCompany) {
    if (isCompanyMember) return false;
    return !hasOrganizationContext || !hasSegments;
  }
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
  const { user, isDriver, isCompany, isAdmin } = useAuth();
  const { profile, profileLoaded } = useProfile();
  const location = useLocation();
  const path = location.pathname;
  const isCompanyMember = Boolean(user?.companyOwnerId && user.companyOwnerId !== user?.id);
  const hasSegments =
    Array.isArray(user?.companySegmentDefaults) && user.companySegmentDefaults.length > 0;
  const hasOrganizationContext = Boolean(user?.organizationId || user?.companyOwnerId);

  if (!user) return children;
  if (isAdmin) return children;

  if (SKIP_PATHS.some((p) => path === p || path.startsWith(p + "/"))) {
    return children;
  }

  if (isDriver) {
    if (!profileLoaded) return children;
    const hasPrimarySegment = Boolean(profile?.primarySegment?.trim());
    if (!hasPrimarySegment && path !== "/onboarding/forare") {
      return <Navigate to="/onboarding/forare" state={{ from: path }} replace />;
    }
  }

  if (isCompany) {
    if (!isCompanyMember && (!hasOrganizationContext || !hasSegments) && path !== "/foretag/onboarding" && !path.startsWith("/foretag/onboarding")) {
      return <Navigate to="/foretag/onboarding" state={{ from: path }} replace />;
    }
  }

  return children;
}
