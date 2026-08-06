import { User, FileText, Home } from "lucide-react";

import type { SignUpProgressStep } from "@/components/SignUpProgress";
import type { GovernmentIdType } from "@/lib/landlordOnboardingFlow";
import { readJsonSession } from "@/lib/landlordOnboardingFlow";

export { readJsonSession };
export type { GovernmentIdType };

export const propertyManagerFlowSteps: SignUpProgressStep[] = [
  { number: 1, label: "Your Details", icon: User },
  { number: 2, label: "KYC", icon: FileText },
  { number: 3, label: "First Property", icon: Home },
];

export const PM_ONBOARDING_KEYS = {
  started: "propertyManagerOnboardingStarted",
  details: "propertyManagerOnboardingDetails",
  kyc: "propertyManagerOnboardingKyc",
  profilePictureId: "propertyManagerOnboardingProfilePictureId",
  complete: "propertyManagerOnboardingComplete",
} as const;

export type PropertyManagerOnboardingDetails = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  country: string;
  state: string;
  city: string;
  postalCode: string;
};

export const emptyPropertyManagerDetails: PropertyManagerOnboardingDetails = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  phoneNumber: "",
  address: "",
  country: "Nigeria",
  state: "",
  city: "",
  postalCode: "",
};

export type PropertyManagerOnboardingKyc = {
  idType: GovernmentIdType;
  idNumber: string;
  governmentIdDocumentId: string | null;
  tinDocumentId: string | null;
  proofOfAddressDocumentId: string | null;
};

export const emptyPropertyManagerKyc: PropertyManagerOnboardingKyc = {
  idType: "",
  idNumber: "",
  governmentIdDocumentId: null,
  tinDocumentId: null,
  proofOfAddressDocumentId: null,
};

export const clearPropertyManagerOnboardingSession = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PM_ONBOARDING_KEYS.started);
  sessionStorage.removeItem(PM_ONBOARDING_KEYS.details);
  sessionStorage.removeItem(PM_ONBOARDING_KEYS.kyc);
  sessionStorage.removeItem(PM_ONBOARDING_KEYS.profilePictureId);
};

export const isPropertyManagerOnboardingComplete = () => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PM_ONBOARDING_KEYS.complete) === "true";
};

export const markPropertyManagerOnboardingComplete = () => {
  if (typeof window === "undefined") return;
  localStorage.setItem(PM_ONBOARDING_KEYS.complete, "true");
  clearPropertyManagerOnboardingSession();
};

export const getPropertyManagerPostAuthPath = () => {
  if (isPropertyManagerOnboardingComplete()) {
    return "/dashboard/select-landlord";
  }
  return "/onboarding/property-manager/details";
};
