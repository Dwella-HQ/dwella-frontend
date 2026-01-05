import * as React from "react";
import { getProfile } from "@/api/auth";
import type { ProfileDataDTO } from "@/api/auth";

type ProfileContextType = {
  profile: ProfileDataDTO | null;
  isLoading: boolean;
  error: string | null;
  refetchProfile: () => Promise<void>;
};

const ProfileContext = React.createContext<ProfileContextType | undefined>(
  undefined
);

export const useProfile = () => {
  const context = React.useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = React.useState<ProfileDataDTO | null>(null);
  // Initialize loading to false for SSR safety
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasMounted, setHasMounted] = React.useState(false);

  const fetchProfile = React.useCallback(async () => {
    // Only run on client side after mount
    if (typeof window === "undefined" || !hasMounted) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        setIsLoading(false);
        // Don't set error if there's no token - user might not be logged in
        return;
      }

      setIsLoading(true);
      setError(null);

      const result = await getProfile(token);

      if (result.success) {
        setProfile(result.data.data);
        setError(null);
      } else {
        // Don't set profile to null on error - keep previous data if available
        // Only set error for display purposes
        setError(result.error);
      }
    } catch (err) {
      // Silently handle errors - don't break the app
      console.error("Failed to fetch profile:", err);
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [hasMounted]);

  // Only run effects on client side
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  React.useEffect(() => {
    if (hasMounted) {
      fetchProfile();
    }
  }, [fetchProfile, hasMounted]);

  const value = React.useMemo(
    () => ({
      profile,
      isLoading,
      error,
      refetchProfile: fetchProfile,
    }),
    [profile, isLoading, error, fetchProfile]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};

