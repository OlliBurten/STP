import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiPost, apiGet } from "../api/client.js";

const AUTH_STORAGE_KEY = "drivermatch-auth";
const SESSION_MAX_MS = 24 * 60 * 60 * 1000; // 24h
const SESSION_INACTIVITY_MS = 60 * 60 * 1000; // 60 min
const API_URL = (import.meta.env.VITE_API_URL || "").trim().replace(/\/$/, "");

function normalizeUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    role: u.role?.toLowerCase() === "company" ? "company" : "driver",
    isAdmin: Boolean(u.isAdmin),
    name: u.name,
    companyName: u.companyName,
    companyOrgNumber: u.companyOrgNumber || null,
    companyStatus: u.companyStatus || "VERIFIED",
    companySegmentDefaults: Array.isArray(u.companySegmentDefaults) ? u.companySegmentDefaults : [],
    emailVerifiedAt: u.emailVerifiedAt || null,
  };
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.user) return normalizeUser(data.user);
      }
    } catch (_) {}
    return null;
  });
  const [token, setToken] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) return JSON.parse(stored).token || null;
    } catch (_) {}
    return null;
  });
  const [issuedAt, setIssuedAt] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) return JSON.parse(stored).issuedAt || null;
    } catch (_) {}
    return null;
  });
  const [lastActivity, setLastActivity] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) return JSON.parse(stored).lastActivity || null;
    } catch (_) {}
    return null;
  });

  // Persistera auth + tidsstämplar
  useEffect(() => {
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

  // Vid mount: logga ut om sessionen redan är för gammal
  useEffect(() => {
    if (!user || !token) return;
    const now = Date.now();
    if (issuedAt && now - issuedAt > SESSION_MAX_MS) {
      setUser(null);
      setToken(null);
      setIssuedAt(null);
      setLastActivity(null);
      return;
    }
    if (lastActivity && now - lastActivity > SESSION_INACTIVITY_MS) {
      setUser(null);
      setToken(null);
      setIssuedAt(null);
      setLastActivity(null);
    }
  }, []); // körs bara vid första render

  const loginWithApi = useCallback(async (email, password) => {
    const data = await apiPost("/api/auth/login", { email, password });
    const u = normalizeUser(data.user);
    setUser(u);
    setToken(data.token);
    const now = Date.now();
    setIssuedAt(now);
    setLastActivity(now);
    return u;
  }, []);

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
      setUser(u);
      setToken(data.token);
      const now = Date.now();
      setIssuedAt(now);
      setLastActivity(now);
      return { user: u, emailVerificationSent: data.emailVerificationSent === true };
    },
    []
  );

  const loginAsDriver = useCallback(() => {
    setUser({ role: "driver", name: "Chaufför" });
    setToken(null);
    setIssuedAt(null);
    setLastActivity(null);
  }, []);

  const loginAsCompany = useCallback(() => {
    setUser({
      role: "company",
      name: "Företag",
      companyStatus: "VERIFIED",
      companySegmentDefaults: ["FULLTIME"],
    });
    setToken(null);
    setIssuedAt(null);
    setLastActivity(null);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setIssuedAt(null);
    setLastActivity(null);
  }, []);

  const loginWithOAuthResponse = useCallback(({ user: u, token: t }) => {
    const normalized = normalizeUser(u);
    setUser(normalized);
    setToken(t);
    const now = Date.now();
    setIssuedAt(now);
    setLastActivity(now);
    return normalized;
  }, []);

  // Uppdatera senaste aktivitet vid interaktion
  useEffect(() => {
    if (!user || !token) return;
    const handleActivity = () => {
      setLastActivity(Date.now());
    };
    const events = ["click", "keydown", "mousemove", "scroll", "visibilitychange"];
    events.forEach((ev) => window.addEventListener(ev, handleActivity));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
    };
  }, [user, token]);

  // Auto-logout vid inaktivitet
  useEffect(() => {
    if (!user || !token || !lastActivity) return;
    const now = Date.now();
    const elapsed = now - lastActivity;
    const remaining = SESSION_INACTIVITY_MS - elapsed;
    if (remaining <= 0) {
      setUser(null);
      setToken(null);
      setIssuedAt(null);
      setLastActivity(null);
      return;
    }
    const id = window.setTimeout(() => {
      setUser(null);
      setToken(null);
      setIssuedAt(null);
      setLastActivity(null);
    }, remaining);
    return () => window.clearTimeout(id);
  }, [user, token, lastActivity]);

  const isDriver = user?.role === "driver";
  const isCompany = user?.role === "company";
  const isAdmin = Boolean(user?.isAdmin);
  const hasApi = !!API_URL;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isDriver,
        isCompany,
        isAdmin,
        hasApi,
        loginAsDriver,
        loginAsCompany,
        loginWithApi,
        loginWithOAuthResponse,
        registerWithApi,
        logout,
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
