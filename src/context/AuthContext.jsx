import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { apiPost, AUTH_INVALID_EVENT, getActiveOrgId, setActiveOrgId } from "../api/client.js";
import { fetchMe } from "../api/auth.js";
import { startViewAs as apiStartViewAs, stopViewAs as apiStopViewAs } from "../api/admin.js";
import { fetchMyOrganizations } from "../api/organizations.js";
import { identifyUser, resetUser, track, groupCompany } from "../utils/posthog.js";

const AUTH_STORAGE_KEY = "drivermatch-auth";
// Industristandard för konsumentplattform: ingen inaktivitetsutloggning,
// endast en absolut sessionsgräns (matchar backend-JWT på 7 dagar).
const SESSION_MAX_MS = 7 * 24 * 60 * 60 * 1000; // 7 dagar
// Login-sidan läser denna för att förklara varför man loggades ut.
export const LOGOUT_REASON_KEY = "stp-logout-reason";

function setLogoutReason(reason) {
  try { sessionStorage.setItem(LOGOUT_REASON_KEY, reason); } catch { /* */ }
}
const API_URL = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");

function readStoredAuth() {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (_) {
    return null;
  }
}

function writeStoredAuth(payload) {
  try {
    if (!payload?.user || !payload?.token) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  } catch (_) {}
}

function normalizeImpersonation(data) {
  if (!data?.active) return null;
  return {
    active: true,
    sessionId: data.sessionId || null,
    startedAt: data.startedAt || null,
    expiresAt: data.expiresAt || null,
  };
}

function normalizeUser(u) {
  if (!u) return null;
  const rawRole = String(u.role || "").trim().toUpperCase();
  const normalizedRole =
    rawRole === "COMPANY" || rawRole === "RECRUITER"
      ? "recruiter"
      : "driver";
  return {
    id: u.id,
    email: u.email,
    role: normalizedRole,
    rawRole,
    isAdmin: Boolean(u.isAdmin),
    hadLoggedInBefore: Boolean(u.hadLoggedInBefore),
    isDemo: Boolean(u.isDemo),
    demoBoth: Boolean(u.demoBoth),
    shouldShowOnboarding: Boolean(u.shouldShowOnboarding),
    name: u.name,
    companyName: u.companyName,
    companyOrgNumber: u.companyOrgNumber || null,
    companyStatus: u.companyStatus || "VERIFIED",
    companySegmentDefaults: Array.isArray(u.companySegmentDefaults) ? u.companySegmentDefaults : [],
    companyOwnerId: u.companyOwnerId || null,
    organizationId: u.organizationId || null,
    emailVerifiedAt: u.emailVerifiedAt || null,
  };
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const syncingFromStorageRef = useRef(false);
  const [user, setUser] = useState(() => {
    const data = readStoredAuth();
    if (data?.user) return normalizeUser(data.user);
    return null;
  });
  const [adminUser, setAdminUser] = useState(() => {
    const data = readStoredAuth();
    if (data?.adminUser) return normalizeUser(data.adminUser);
    return null;
  });
  const [impersonation, setImpersonation] = useState(() => normalizeImpersonation(readStoredAuth()?.impersonation));
  const [token, setToken] = useState(() => {
    return readStoredAuth()?.token || null;
  });
  const [issuedAt, setIssuedAt] = useState(() => {
    return readStoredAuth()?.issuedAt || null;
  });
  const [lastActivity, setLastActivity] = useState(() => {
    return readStoredAuth()?.lastActivity || null;
  });

  const clearAuthState = useCallback(() => {
    writeStoredAuth(null);
    setUser(null);
    setAdminUser(null);
    setImpersonation(null);
    setToken(null);
    setIssuedAt(null);
    setLastActivity(null);
  }, []);

  const applyStoredAuth = useCallback((raw) => {
    syncingFromStorageRef.current = true;
    if (!raw?.user || !raw?.token) {
      clearAuthState();
      return;
    }
    setUser(normalizeUser(raw.user));
    setAdminUser(raw.adminUser ? normalizeUser(raw.adminUser) : null);
    setImpersonation(normalizeImpersonation(raw.impersonation));
    setToken(raw.token || null);
    setIssuedAt(raw.issuedAt || null);
    setLastActivity(raw.lastActivity || null);
  }, [clearAuthState]);

  const commitAuthState = useCallback((nextUser, nextToken, extra = {}) => {
    const now = Date.now();
    const payload = {
      user: nextUser,
      adminUser: extra.adminUser || null,
      impersonation: extra.impersonation || null,
      token: nextToken,
      issuedAt: now,
      lastActivity: now,
    };
    writeStoredAuth(payload);
    setUser(nextUser);
    setAdminUser(extra.adminUser || null);
    setImpersonation(extra.impersonation || null);
    setToken(nextToken);
    setIssuedAt(now);
    setLastActivity(now);
    return payload;
  }, []);

  // Persistera auth + tidsstämplar
  useEffect(() => {
    if (syncingFromStorageRef.current) {
      syncingFromStorageRef.current = false;
      return;
    }
    if (user && token) {
      const now = Date.now();
      const payload = {
        user,
        adminUser,
        impersonation,
        token,
        issuedAt: issuedAt || now,
        lastActivity: lastActivity || now,
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user, adminUser, impersonation, token, issuedAt, lastActivity]);

  // Synka login/logout/activity mellan flera flikar.
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== AUTH_STORAGE_KEY) return;
      if (!event.newValue) {
        applyStoredAuth(null);
        return;
      }
      try {
        applyStoredAuth(JSON.parse(event.newValue));
      } catch {
        applyStoredAuth(null);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [applyStoredAuth]);

  // Central logout när API markerar sessionen som ogiltig.
  useEffect(() => {
    const handleAuthInvalid = () => {
      if (user) setLogoutReason("expired");
      clearAuthState();
    };
    window.addEventListener(AUTH_INVALID_EVENT, handleAuthInvalid);
    return () => window.removeEventListener(AUTH_INVALID_EVENT, handleAuthInvalid);
  }, [clearAuthState, user]);

  // Session-timeout: endast absolut gräns (7 dagar). Ingen inaktivitetsutloggning.
  useEffect(() => {
    if (!user || !token) return;
    const now = Date.now();
    const remaining = issuedAt ? SESSION_MAX_MS - (now - issuedAt) : SESSION_MAX_MS;
    if (remaining <= 0) {
      setLogoutReason("expired");
      clearAuthState();
      return;
    }
    const id = window.setTimeout(() => {
      setLogoutReason("expired");
      clearAuthState();
    }, remaining);
    return () => window.clearTimeout(id);
  }, [user, token, issuedAt, clearAuthState]);

  const loginWithApi = useCallback(async (email, password) => {
    const data = await apiPost("/api/auth/login", { email, password });
    const u = normalizeUser(data.user);
    commitAuthState(u, data.token, {
      adminUser: data.adminUser ? normalizeUser(data.adminUser) : null,
      impersonation: normalizeImpersonation(data.impersonation),
    });
    identifyUser(u);
    track("user_login", { method: "email", role: u.rawRole || u.role });
    return u;
  }, [commitAuthState]);

  const registerWithApi = useCallback(
    async ({ email, password, role, name, companyName, companyOrgNumber, claimToken }) => {
      const verificationBaseUrl =
        typeof window !== "undefined" && window.location?.origin ? window.location.origin : undefined;
      const data = await apiPost("/api/auth/register", {
        email,
        password,
        role: role === "company" ? "COMPANY" : "DRIVER",
        name,
        companyName: role === "company" ? companyName : undefined,
        companyOrgNumber: role === "company" ? companyOrgNumber : undefined,
        verificationBaseUrl,
        claimToken: claimToken || undefined,
      });
      const u = normalizeUser(data.user);
      identifyUser(u);
      track("user_registered", { role: u.rawRole || u.role, claimActivated: !!data.claimResult?.activated });
      return {
        user: u,
        emailVerificationSent: data.emailVerificationSent === true,
        claimResult: data.claimResult ?? null,
      };
    },
    []
  );

  const loginAsDriver = useCallback(() => {
    setUser({ role: "driver", name: "Förare" });
    setAdminUser(null);
    setImpersonation(null);
    setToken(null);
    setIssuedAt(null);
    setLastActivity(null);
  }, []);

  const loginAsCompany = useCallback(() => {
    setUser({
      role: "recruiter",
      rawRole: "COMPANY",
      name: "Rekryterare",
      companyStatus: "VERIFIED",
      companySegmentDefaults: ["FULLTIME"],
    });
    setAdminUser(null);
    setImpersonation(null);
    setToken(null);
    setIssuedAt(null);
    setLastActivity(null);
  }, []);

  const logout = useCallback(() => {
    resetUser();
    clearAuthState();
  }, [clearAuthState]);

  const loginWithOAuthResponse = useCallback(({ user: u, token: t }) => {
    const normalized = normalizeUser(u);
    commitAuthState(normalized, t, {
      adminUser: u?.adminUser ? normalizeUser(u.adminUser) : null,
      impersonation: normalizeImpersonation(u?.impersonation),
    });
    identifyUser(normalized);
    track(u?.shouldShowOnboarding ? "user_registered" : "user_login", { method: "oauth", role: normalized.rawRole || normalized.role });
    return normalized;
  }, [commitAuthState]);

  /** Uppdatera användardata (t.ex. efter createOrganization). */
  const refreshUser = useCallback(async () => {
    if (!token) return null;
    try {
      const u = await fetchMe();
      const normalized = normalizeUser(u);
      setUser(normalized);
      setAdminUser(u?.adminUser ? normalizeUser(u.adminUser) : null);
      setImpersonation(normalizeImpersonation(u?.impersonation));
      return normalized;
    } catch {
      return null;
    }
  }, [token]);

  const startViewAs = useCallback(async (userId) => {
    const data = await apiStartViewAs(userId);
    const normalized = normalizeUser(data.user);
    commitAuthState(normalized, data.token, {
      adminUser: data.adminUser ? normalizeUser(data.adminUser) : null,
      impersonation: normalizeImpersonation(data.impersonation),
    });
    return normalized;
  }, [commitAuthState]);

  const stopViewAs = useCallback(async () => {
    const data = await apiStopViewAs();
    const normalized = normalizeUser(data.user);
    commitAuthState(normalized, data.token, {
      adminUser: null,
      impersonation: null,
    });
    return normalized;
  }, [commitAuthState]);

  // Identifiera användare i PostHog vid sidladdning om redan inloggad
  useEffect(() => {
    if (user && !user.isAdmin) identifyUser(user);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [userOrgs, setUserOrgs] = useState([]);
  const [activeOrgId, setActiveOrgIdState] = useState(() => getActiveOrgId());

  const refreshOrgs = useCallback(async () => {
    try {
      const orgs = await fetchMyOrganizations();
      const list = Array.isArray(orgs) ? orgs : [];
      setUserOrgs(list);
      const currentActiveId = getActiveOrgId();
      if (!currentActiveId || !list.find((o) => o.id === currentActiveId)) {
        const firstId = list[0]?.id || null;
        setActiveOrgId(firstId);
        setActiveOrgIdState(firstId);
      }
    } catch {
      setUserOrgs([]);
    }
  }, []);

  const switchOrg = useCallback((orgId) => {
    setActiveOrgId(orgId);
    setActiveOrgIdState(orgId);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (user && (user.role === "recruiter") && token) {
      refreshOrgs();
    } else {
      setUserOrgs([]);
    }
  }, [user?.id, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeOrg = userOrgs.find((o) => o.id === activeOrgId) || userOrgs[0] || null;

  useEffect(() => {
    if (activeOrg?.id) groupCompany(activeOrg.id, activeOrg.name);
  }, [activeOrg?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDriver = user?.role === "driver";
  const isRecruiter = user?.role === "recruiter";
  const isCompany = isRecruiter;
  const isImpersonating = Boolean(impersonation?.active);
  const isReadOnlyView = isImpersonating;
  const effectiveAdminUser = adminUser || (user?.isAdmin ? user : null);
  const isAdmin = Boolean(effectiveAdminUser?.isAdmin);
  const hasApi = !!API_URL;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isDriver,
        isRecruiter,
        isCompany,
        isAdmin,
        adminUser: effectiveAdminUser,
        impersonation,
        isImpersonating,
        isReadOnlyView,
        hasApi,
        loginAsDriver,
        loginAsCompany,
        loginWithApi,
        loginWithOAuthResponse,
        registerWithApi,
        logout,
        refreshUser,
        startViewAs,
        stopViewAs,
        userOrgs,
        activeOrg,
        switchOrg,
        refreshOrgs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  // During Vite HMR the provider tree can be momentarily absent — return safe
  // defaults instead of throwing so hot-reload doesn't crash the whole page.
  if (!ctx) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn("useAuth called outside AuthProvider (likely HMR)");
      return { user: null, token: null, hasApi: false, isAdmin: false, isDriver: false };
    }
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
