import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, isDriver, isCompany, isAdmin } = useAuth();
  const location = useLocation();

  const hasAccess =
    requiredRole === "driver"
      ? isDriver
      : requiredRole === "company"
        ? isCompany
        : requiredRole === "admin"
          ? isAdmin
          : false;

  if (!hasAccess) {
    return <Navigate to="/login" state={{ from: location.pathname, requiredRole }} replace />;
  }

  return children;
}
