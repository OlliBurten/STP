import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { apiPost, AUTH_INVALID_EVENT } from "../api/client.js";
import { fetchMe } from "../api/auth.js";

const AUTH_STORAGE_KEY = "drivermatch-auth";
const SESSION_MAX_MS = 24 * 60 * 60 * 1000; // 24h
const SESSION_INACTIVITY_MS = 15 * 60 * 1000; // 15 min
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
    setToken(raw.token || null);
    setIssuedAt(raw.issuedAt || null);
    setLastActivity(raw.lastActivity || null);
  }, [clearAuthState]);

  const commitAuthState = useCallback((nextUser, nextToken) => {
    const now = Date.now();
    const payload = {
      user: nextUser,
      token: nextToken,
      issuedAt: now,
      lastActivity: now,
    };
    writeStoredAuth(payload);
    setUser(nextUser);
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
        token,
        issuedAt: issuedAt || now,
        lastActivity: lastActivity || now,
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user, token, issuedAt, lastActivity]);

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
      clearAuthState();
    };
    window.addEventListener(AUTH_INVALID_EVENT, handleAuthInvalid);
    return () => window.removeEventListener(AUTH_INVALID_EVENT, handleAuthInvalid);
  }, [clearAuthState]);

  // Delad session-timeout: absolut max 24h och 15 min inaktivitet.
  useEffect(() => {
    if (!user || !token) return;
    const now = Date.now();
    const absoluteRemaining = issuedAt ? SESSION_MAX_MS - (now - issuedAt) : SESSION_MAX_MS;
    const inactivityRemaining = lastActivity
      ? SESSION_INACTIVITY_MS - (now - lastActivity)
      : SESSION_INACTIVITY_MS;
    const remaining = Math.min(absoluteRemaining, inactivityRemaining);
    if (remaining <= 0) {
      clearAuthState();
      return;
    }
    const id = window.setTimeout(() => {
      clearAuthState();
    }, remaining);
    return () => window.clearTimeout(id);
  }, [user, token, issuedAt, lastActivity, clearAuthState]);

  const loginWithApi = useCallback(async (email, password) => {
    const data = await apiPost("/api/auth/login", { email, password });
    const u = normalizeUser(data.user);
    commitAuthState(u, data.token);
    return u;
  }, [commitAuthState]);

  const registerWithApi = useCallback(
    async ({ email, password, role, name, companyName, companyOrgNumber }) => {
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
      });
      const u = normalizeUser(data.user);
      commitAuthState(u, data.token);
      return { user: u, emailVerificationSent: data.emailVerificationSent === true };
    },
    [commitAuthState]
  );

  const loginAsDriver = useCallback(() => {
    setUser({ role: "driver", name: "Chaufför" });
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
    setToken(null);
    setIssuedAt(null);
    setLastActivity(null);
  }, []);

  const logout = useCallback(() => {
    clearAuthState();
  }, [clearAuthState]);

  const loginWithOAuthResponse = useCallback(({ user: u, token: t }) => {
    const normalized = normalizeUser(u);
    commitAuthState(normalized, t);
    return normalized;
  }, [commitAuthState]);

  /** Uppdatera användardata (t.ex. efter createOrganization). */
  const refreshUser = useCallback(async () => {
    if (!token) return null;
    try {
      const u = await fetchMe();
      const normalized = normalizeUser(u);
      setUser(normalized);
      return normalized;
    } catch {
      return null;
    }
  }, [token]);

  // Uppdatera senaste aktivitet vid interaktion. Skriv inte på varje pixelrörelse.
  useEffect(() => {
    if (!user || !token) return;
    let lastMarkedAt = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastMarkedAt < 15000) return;
      lastMarkedAt = now;
      setLastActivity(now);
    };
    const events = ["click", "keydown", "mousemove", "scroll", "visibilitychange"];
    events.forEach((ev) => window.addEventListener(ev, handleActivity));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
    };
  }, [user, token]);

  const isDriver = user?.role === "driver";
  const isRecruiter = user?.role === "recruiter";
  const isCompany = isRecruiter;
  const isAdmin = Boolean(user?.isAdmin);
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
        hasApi,
        loginAsDriver,
        loginAsCompany,
        loginWithApi,
        loginWithOAuthResponse,
        registerWithApi,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
