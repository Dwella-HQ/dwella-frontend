import { User, FileText } from "lucide-react";

import type { SignUpProgressStep } from "@/components/SignUpProgress";
import type { GovernmentIdType } from "@/lib/landlordOnboardingFlow";
import { readJsonSession } from "@/lib/landlordOnboardingFlow";

export { readJsonSession };
export type { GovernmentIdType };

/** Backend OpenAPI uses role `user` for public short-stay accounts (guests). */
export const GUEST_API_ROLE_NAME = "user" as const;

export const guestFlowSteps: SignUpProgressStep[] = [
  { number: 1, label: "Your Details", icon: User },
  { number: 2, label: "KYC", icon: FileText },
];

export const GUEST_ONBOARDING_KEYS = {
  started: "guestOnboardingStarted",
  details: "guestOnboardingDetails",
  kyc: "guestOnboardingKyc",
  profilePictureId: "guestOnboardingProfilePictureId",
  profilePreview: "guestOnboardingProfilePreview",
  complete: "guestOnboardingComplete",
  userId: "guestOnboardingUserId",
} as const;

export const EMERGENCY_RELATIONSHIPS = [
  "Parent",
  "Sibling",
  "Spouse",
  "Child",
  "Friend",
  "Other",
] as const;

export type EmergencyRelationship =
  (typeof EMERGENCY_RELATIONSHIPS)[number] | "";

export type GuestOnboardingDetails = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phoneNumber: string;
  occupation: string;
  emergencyContactName: string;
  emergencyContactRelationship: EmergencyRelationship;
  emergencyContactPhone: string;
  password: string;
  confirmPassword: string;
};

export const emptyGuestDetails: GuestOnboardingDetails = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  email: "",
  phoneNumber: "",
  occupation: "",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactPhone: "",
  password: "",
  confirmPassword: "",
};

export type GuestOnboardingKyc = {
  idType: GovernmentIdType;
  idNumber: string;
  governmentIdDocumentId: string | null;
  governmentIdFileName: string | null;
};

export const emptyGuestKyc: GuestOnboardingKyc = {
  idType: "",
  idNumber: "",
  governmentIdDocumentId: null,
  governmentIdFileName: null,
};

export const clearGuestOnboardingSession = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(GUEST_ONBOARDING_KEYS.started);
  sessionStorage.removeItem(GUEST_ONBOARDING_KEYS.details);
  sessionStorage.removeItem(GUEST_ONBOARDING_KEYS.kyc);
  sessionStorage.removeItem(GUEST_ONBOARDING_KEYS.profilePictureId);
  sessionStorage.removeItem(GUEST_ONBOARDING_KEYS.profilePreview);
  sessionStorage.removeItem(GUEST_ONBOARDING_KEYS.userId);
};

export const markGuestOnboardingComplete = () => {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_ONBOARDING_KEYS.complete, "true");
  clearGuestOnboardingSession();
};
