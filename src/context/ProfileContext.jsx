import { createContext, useContext, useState, useEffect } from "react";
import { defaultProfile, PROFILE_STORAGE_KEY } from "../data/profileData";
import { useAuth } from "./AuthContext";
import { fetchProfile as apiFetchProfile, updateProfile as apiUpdateProfile } from "../api/profile.js";
import { setPersonProperties } from "../utils/posthog.js";
import { getDriverMinimumChecklist } from "../utils/driverProfileRequirements.js";

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const { hasApi, isDriver, token, user } = useAuth();
  const [profile, setProfile] = useState(defaultProfile);
  const [profileLoaded, setProfileLoaded] = useState(!hasApi);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");

  useEffect(() => {
    if (hasApi) return;
    setProfileLoaded(true);
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
    setProfileLoaded(false);
    setProfileSaveError("");
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
          privateMatchNotes: data?.privateMatchNotes || "",
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
        setProfileLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setProfileLoaded(true);
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

  const mergeSavedProfile = (saved) => {
    setProfile((prev) => ({
      ...prev,
      ...saved,
      privateMatchNotes: saved?.privateMatchNotes || "",
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
  };

  const updateProfile = async (updates) => {
    const nextProfile = { ...profile, ...updates };
    if (!hasApi || !isDriver || !token) {
      setProfile(nextProfile);
      setProfileSaveError("");
      return nextProfile;
    }
    setProfileSaving(true);
    setProfileSaveError("");
    try {
      const saved = await apiUpdateProfile(nextProfile);
      mergeSavedProfile(saved);
      const checklist = getDriverMinimumChecklist(saved);
      const pct = Math.round(checklist.filter((c) => c.done).length / checklist.length * 100);
      setPersonProperties({ profile_completion_pct: pct });
      return saved;
    } catch (error) {
      setProfileSaveError(error?.message || "Kunde inte spara profilen.");
      throw error;
    } finally {
      setProfileSaving(false);
    }
  };

  const addExperience = (exp) => {
    const id = `exp-${Date.now()}`;
    updateProfile({ experience: [...(profile.experience || []), { ...exp, id }] }).catch(() => {});
  };

  const updateExperience = (id, updates) => {
    updateProfile({ experience: (profile.experience || []).map((e) => (e.id === id ? { ...e, ...updates } : e)) }).catch(() => {});
  };

  const removeExperience = (id) => {
    updateProfile({ experience: (profile.experience || []).filter((e) => e.id !== id) }).catch(() => {});
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        profileLoaded,
        profileSaving,
        profileSaveError,
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
