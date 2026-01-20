import * as React from "react";
import type { LandlordAccount } from "@/data/mockLandlordAccounts";

type SelectedLandlordContextType = {
  selectedLandlord: LandlordAccount | null;
  setSelectedLandlord: (landlord: LandlordAccount | null) => void;
};

const SelectedLandlordContext = React.createContext<SelectedLandlordContextType | undefined>(
  undefined
);

export const useSelectedLandlord = () => {
  const context = React.useContext(SelectedLandlordContext);
  if (!context) {
    throw new Error("useSelectedLandlord must be used within a SelectedLandlordProvider");
  }
  return context;
};

export const SelectedLandlordProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedLandlord, setSelectedLandlordState] = React.useState<LandlordAccount | null>(null);
  const [hasMounted, setHasMounted] = React.useState(false);

  // Load selected landlord from localStorage on mount
  React.useEffect(() => {
    setHasMounted(true);
    
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("selectedLandlord");
        if (stored) {
          setSelectedLandlordState(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Failed to load selected landlord from localStorage:", error);
      }
    }
  }, []);

  const setSelectedLandlord = React.useCallback((landlord: LandlordAccount | null) => {
    setSelectedLandlordState(landlord);
    
    if (typeof window !== "undefined") {
      if (landlord) {
        localStorage.setItem("selectedLandlord", JSON.stringify(landlord));
      } else {
        localStorage.removeItem("selectedLandlord");
      }
    }
  }, []);

  const value = React.useMemo(
    () => ({
      selectedLandlord,
      setSelectedLandlord,
    }),
    [selectedLandlord, setSelectedLandlord]
  );

  // Don't render until mounted to avoid hydration issues
  if (!hasMounted) {
    return null;
  }

  return (
    <SelectedLandlordContext.Provider value={value}>
      {children}
    </SelectedLandlordContext.Provider>
  );
};


