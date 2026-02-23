import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiPost, apiGet } from "../api/client.js";

const AUTH_STORAGE_KEY = "drivermatch-auth";
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

  useEffect(() => {
    if (user && token) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user, token]);

  const loginWithApi = useCallback(async (email, password) => {
    const data = await apiPost("/api/auth/login", { email, password });
    const u = normalizeUser(data.user);
    setUser(u);
    setToken(data.token);
    return u;
  }, []);

  const registerWithApi = useCallback(
    async ({ email, password, role, name, companyName, companyOrgNumber }) => {
      const data = await apiPost("/api/auth/register", {
        email,
        password,
        role: role === "company" ? "COMPANY" : "DRIVER",
        name,
        companyName: role === "company" ? companyName : undefined,
        companyOrgNumber: role === "company" ? companyOrgNumber : undefined,
      });
      const u = normalizeUser(data.user);
      setUser(u);
      setToken(data.token);
      return u;
    },
    []
  );

  const loginAsDriver = useCallback(() => {
    setUser({ role: "driver", name: "Chaufför" });
    setToken(null);
  }, []);

  const loginAsCompany = useCallback(() => {
    setUser({
      role: "company",
      name: "Företag",
      companyStatus: "VERIFIED",
      companySegmentDefaults: ["FULLTIME"],
    });
    setToken(null);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

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
