import * as React from "react";
import {
  AUTH_ACCESS_TOKEN_UPDATED_EVENT,
  getStoredRefreshToken,
  REFRESH_TOKEN_STORAGE_KEY,
  tryRefreshAccessToken,
} from "@/lib/authRefresh";

export type UserRole =
  | "landlord"
  | "property_manager"
  | "tenant"
  | "super_admin";

export type User = {
  id: string | number;
  name: string;
  email: string;
  role: UserRole;
  token?: string;
};

type UserContextType = {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
};

const UserContext = React.createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUserState] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasMounted, setHasMounted] = React.useState(false);

  // Load user from localStorage on mount
  React.useEffect(() => {
    setHasMounted(true);

    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("authToken");

        if (storedUser && token) {
          const parsedUser = JSON.parse(storedUser);
          setUserState({ ...parsedUser, token });
        }
      } catch (error) {
        console.error("Failed to load user from localStorage:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // When the access token is refreshed in the background, localStorage is updated
  // but React state was stale — sync so hooks depending on `user.token` stay current.
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const syncUserFromStorage = () => {
      try {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("authToken");
        if (!storedUser || !token) return;
        const parsedUser = JSON.parse(storedUser) as Omit<User, "token"> &
          Partial<Pick<User, "token">>;
        const next: User = { ...parsedUser, token };
        setUserState((prev) => {
          if (
            prev &&
            prev.id === next.id &&
            prev.token === next.token &&
            prev.email === next.email &&
            prev.role === next.role
          ) {
            return prev;
          }
          return next;
        });
      } catch {
        /* ignore */
      }
    };

    const onTokenUpdated = () => syncUserFromStorage();
    window.addEventListener(AUTH_ACCESS_TOKEN_UPDATED_EVENT, onTokenUpdated);
    window.addEventListener("storage", onTokenUpdated);
    return () => {
      window.removeEventListener(
        AUTH_ACCESS_TOKEN_UPDATED_EVENT,
        onTokenUpdated,
      );
      window.removeEventListener("storage", onTokenUpdated);
    };
  }, []);

  /** Proactively refresh the access token so short-lived JWTs rarely expire during active use. */
  React.useEffect(() => {
    if (typeof window === "undefined" || !user?.token) return;
    if (!getStoredRefreshToken()) return;

    const tick = () => void tryRefreshAccessToken();
    const intervalMs = 8 * 60 * 1000;
    const intervalId = window.setInterval(tick, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user?.token]);

  const setUser = React.useCallback((newUser: User | null) => {
    setUserState(newUser);

    if (typeof window !== "undefined") {
      if (newUser) {
        localStorage.setItem("user", JSON.stringify(newUser));
        if (newUser.token) {
          localStorage.setItem("authToken", newUser.token);
        }
      } else {
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
        localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
        localStorage.removeItem("userId");
        localStorage.removeItem("landlordId");
        localStorage.removeItem("tenantId");
        localStorage.removeItem("leaseId");
        localStorage.removeItem("lastCreatedPropertyId");
        localStorage.removeItem("selectedLandlord");
        localStorage.removeItem("selectedLandlordId");
        document.cookie =
          "selectedLandlord=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        document.cookie =
          "selectedLandlordId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        document.cookie =
          "accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      }
    }
  }, []);

  const logout = React.useCallback(() => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      localStorage.removeItem("userId");
      localStorage.removeItem("landlordId");
      localStorage.removeItem("tenantId");
      localStorage.removeItem("leaseId");
      localStorage.removeItem("lastCreatedPropertyId");
      localStorage.removeItem("selectedLandlord");
      localStorage.removeItem("selectedLandlordId");
      document.cookie =
        "selectedLandlord=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      document.cookie =
        "selectedLandlordId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      document.cookie =
        "accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    }
  }, [setUser]);

  const value = React.useMemo(
    () => ({
      user,
      isLoading: isLoading || !hasMounted,
      setUser,
      logout,
    }),
    [user, isLoading, hasMounted, setUser, logout],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
