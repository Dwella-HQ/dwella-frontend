import { User, FileText, Banknote, Home } from "lucide-react";

import type { SignUpProgressStep } from "@/components/SignUpProgress";

export const landlordFlowSteps: SignUpProgressStep[] = [
  { number: 1, label: "Your Details", icon: User },
  { number: 2, label: "KYC", icon: FileText },
  { number: 3, label: "KYB", icon: Banknote },
  { number: 4, label: "First Property", icon: Home },
];

export const LANDLORD_ONBOARDING_KEYS = {
  started: "landlordOnboardingStarted",
  details: "landlordOnboardingDetails",
  kyc: "landlordOnboardingKyc",
  kyb: "landlordOnboardingKyb",
  profilePictureId: "landlordOnboardingProfilePictureId",
  /** Legacy keys cleared for migration */
  documentIds: "landlordOnboardingDocumentIds",
  finance: "landlordOnboardingFinance",
} as const;

export const BVN_LENGTH = 11;

export type LandlordOnboardingDetails = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  bvn: string;
  phoneNumber: string;
  address: string;
  country: string;
  state: string;
  city: string;
};

export const emptyLandlordDetails: LandlordOnboardingDetails = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  bvn: "",
  phoneNumber: "",
  address: "",
  country: "Nigeria",
  state: "",
  city: "",
};

export type GovernmentIdType =
  | "NATIONAL_ID"
  | "DRIVER_LICENSE"
  | "PASSPORT"
  | "OTHER"
  | "";

export type LandlordOnboardingKyc = {
  idType: GovernmentIdType;
  idNumber: string;
  tinNumber: string;
  governmentIdDocumentId: string | null;
  tinDocumentId: string | null;
  proofOfAddressDocumentId: string | null;
};

export const emptyLandlordKyc: LandlordOnboardingKyc = {
  idType: "",
  idNumber: "",
  tinNumber: "",
  governmentIdDocumentId: null,
  tinDocumentId: null,
  proofOfAddressDocumentId: null,
};

export type LandlordOnboardingKyb = {
  isBusiness: boolean | null;
  businessName: string;
  businessAddress: string;
  cacCertificateId: string | null;
  taxRegulatoryDocumentId: string | null;
  proofOfBusinessAddressId: string | null;
};

export const emptyLandlordKyb: LandlordOnboardingKyb = {
  isBusiness: null,
  businessName: "",
  businessAddress: "",
  cacCertificateId: null,
  taxRegulatoryDocumentId: null,
  proofOfBusinessAddressId: null,
};

export const clearLandlordOnboardingSession = () => {
  if (typeof window === "undefined") return;
  Object.values(LANDLORD_ONBOARDING_KEYS).forEach((key) => {
    sessionStorage.removeItem(key);
  });
};

export const readJsonSession = <T>(key: string): T | null => {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};
