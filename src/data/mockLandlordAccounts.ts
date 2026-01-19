// Mock data for Landlord Accounts that managers can manage

export type LandlordAccount = {
  id: string;
  name: string;
  email: string;
  properties: {
    id: string;
    name: string;
  }[];
  totalUnits: number;
  avatar?: string;
};

// Mock landlord accounts that a manager can manage
// Note: Property IDs match the mockProperties in mockLandlordData.ts
export const mockLandlordAccounts: LandlordAccount[] = [
  {
    id: "landlord-1",
    name: "John Smith",
    email: "john.smith@email.com",
    properties: [
      { id: "1", name: "Harmony Court — 3BR Duplex" }, // Matches property id "1"
      { id: "2", name: "Garden View Apartments" }, // Matches property id "2"
    ],
    totalUnits: 28, // 20 + 8
  },
  {
    id: "landlord-2",
    name: "Sarah Williams",
    email: "sarah.w@email.com",
    properties: [
      { id: "3", name: "Palm Estate" }, // Matches property id "3"
    ],
    totalUnits: 6,
  },
  {
    id: "landlord-3",
    name: "Michael Chen",
    email: "michael.c@email.com",
    properties: [
      { id: "4", name: "Sunset Apartments" }, // Matches property id "4"
      { id: "5", name: "Ocean View Residence" }, // Matches property id "5"
      { id: "6", name: "Riverside Plaza" }, // Matches property id "6" (if exists)
    ],
    totalUnits: 68,
  },
];

// Helper function to get landlord by ID
export const getLandlordById = (id: string): LandlordAccount | undefined => {
  return mockLandlordAccounts.find((landlord) => landlord.id === id);
};

