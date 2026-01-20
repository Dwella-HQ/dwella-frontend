import * as React from "react";

export type UserRole = "landlord" | "manager" | "tenant";

export type User = {
  id: number;
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
      }
    }
  }, []);

  const logout = React.useCallback(() => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
    }
  }, [setUser]);

  const value = React.useMemo(
    () => ({
      user,
      isLoading: isLoading || !hasMounted,
      setUser,
      logout,
    }),
    [user, isLoading, hasMounted, setUser, logout]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};


