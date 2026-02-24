import { createContext, useContext, useState, useEffect } from "react";
import { defaultProfile, PROFILE_STORAGE_KEY } from "../data/profileData";
import { useAuth } from "./AuthContext";
import { fetchProfile as apiFetchProfile, updateProfile as apiUpdateProfile } from "../api/profile.js";

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const { hasApi, isDriver, token, user } = useAuth();
  const [profile, setProfile] = useState(defaultProfile);

  useEffect(() => {
    if (hasApi) return;
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        setProfile(JSON.parse(stored));
        return;
      }
    } catch (_) {}
    setProfile(defaultProfile);
  }, [hasApi]);

  useEffect(() => {
    if (hasApi) return;
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (_) {}
  }, [hasApi, profile]);

  useEffect(() => {
    if (!hasApi || !isDriver || !user?.id) return;
    // Avoid showing previous account's local/demo profile while API profile loads.
    setProfile((prev) => ({
      ...defaultProfile,
      ...(prev?.id === user.id ? prev : {}),
      id: user.id,
      name: user.name || "",
      email: user.email || "",
      licenses:
        prev?.id === user.id && Array.isArray(prev?.licenses) ? prev.licenses : [],
      certificates:
        prev?.id === user.id && Array.isArray(prev?.certificates) ? prev.certificates : [],
      secondarySegments:
        prev?.id === user.id && Array.isArray(prev?.secondarySegments)
          ? prev.secondarySegments
          : [],
      regionsWilling:
        prev?.id === user.id && Array.isArray(prev?.regionsWilling)
          ? prev.regionsWilling
          : [],
      experience:
        prev?.id === user.id && Array.isArray(prev?.experience) ? prev.experience : [],
    }));
  }, [hasApi, isDriver, user?.id, user?.name, user?.email]);

  useEffect(() => {
    if (!hasApi || !isDriver || !token) return;
    let active = true;
    apiFetchProfile()
      .then((data) => {
        if (!active) return;
        setProfile({
          ...defaultProfile,
          ...data,
          id: data?.id || user?.id || "",
          name: data?.name || user?.name || "",
          email: data?.email || user?.email || "",
          licenses: Array.isArray(data?.licenses) ? data.licenses : [],
          certificates: Array.isArray(data?.certificates) ? data.certificates : [],
          primarySegment: data?.primarySegment || "",
          secondarySegments: Array.isArray(data?.secondarySegments) ? data.secondarySegments : [],
          regionsWilling: Array.isArray(data?.regionsWilling) ? data.regionsWilling : [],
          experience: Array.isArray(data?.experience) ? data.experience : [],
          isGymnasieelev: Boolean(data?.isGymnasieelev),
          schoolName: data?.schoolName || "",
          physicalWorkOk: data?.physicalWorkOk ?? null,
          soloWorkOk: data?.soloWorkOk ?? null,
        });
      })
      .catch(() => {
        if (!active) return;
        setProfile((prev) => ({
          ...defaultProfile,
          ...prev,
          id: prev?.id || user?.id || "",
          name: prev?.name || user?.name || "",
          email: prev?.email || user?.email || "",
        }));
      });
    return () => {
      active = false;
    };
  }, [hasApi, isDriver, token, user?.id, user?.name, user?.email]);

  const syncProfileIfApi = (nextProfile) => {
    if (!hasApi || !isDriver || !token) return;
    apiUpdateProfile(nextProfile)
      .then((saved) => {
        setProfile((prev) => ({
          ...prev,
          ...saved,
          licenses: Array.isArray(saved?.licenses) ? saved.licenses : prev.licenses || [],
          certificates: Array.isArray(saved?.certificates) ? saved.certificates : prev.certificates || [],
          primarySegment: saved?.primarySegment || "",
          secondarySegments: Array.isArray(saved?.secondarySegments)
            ? saved.secondarySegments
            : prev.secondarySegments || [],
          regionsWilling: Array.isArray(saved?.regionsWilling)
            ? saved.regionsWilling
            : prev.regionsWilling || [],
          experience: Array.isArray(saved?.experience) ? saved.experience : prev.experience || [],
          isGymnasieelev: Boolean(saved?.isGymnasieelev),
          schoolName: saved?.schoolName || "",
          physicalWorkOk: saved?.physicalWorkOk ?? null,
          soloWorkOk: saved?.soloWorkOk ?? null,
        }));
      })
      .catch(() => {});
  };

  const updateProfile = (updates) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      syncProfileIfApi(next);
      return next;
    });
  };

  const addExperience = (exp) => {
    const id = `exp-${Date.now()}`;
    setProfile((prev) => {
      const next = {
        ...prev,
        experience: [...(prev.experience || []), { ...exp, id }],
      };
      syncProfileIfApi(next);
      return next;
    });
  };

  const updateExperience = (id, updates) => {
    setProfile((prev) => {
      const next = {
        ...prev,
        experience: (prev.experience || []).map((e) => (e.id === id ? { ...e, ...updates } : e)),
      };
      syncProfileIfApi(next);
      return next;
    });
  };

  const removeExperience = (id) => {
    setProfile((prev) => {
      const next = {
        ...prev,
        experience: (prev.experience || []).filter((e) => e.id !== id),
      };
      syncProfileIfApi(next);
      return next;
    });
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        updateProfile,
        addExperience,
        updateExperience,
        removeExperience,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
