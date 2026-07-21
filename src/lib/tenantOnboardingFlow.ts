import { User, FileText } from "lucide-react";

import type { SignUpProgressStep } from "@/components/SignUpProgress";
import type { GovernmentIdType } from "@/lib/landlordOnboardingFlow";
import { readJsonSession } from "@/lib/landlordOnboardingFlow";

export { readJsonSession };
export type { GovernmentIdType };

export const tenantFlowSteps: SignUpProgressStep[] = [
  { number: 1, label: "Your Details", icon: User },
  { number: 2, label: "KYC", icon: FileText },
];

export const TENANT_ONBOARDING_KEYS = {
  started: "tenantOnboardingStarted",
  details: "tenantOnboardingDetails",
  kyc: "tenantOnboardingKyc",
  profilePictureId: "tenantOnboardingProfilePictureId",
  inviteTenantId: "tenantOnboardingInviteTenantId",
  complete: "tenantOnboardingComplete",
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

export type TenantOnboardingDetails = {
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

export const emptyTenantDetails: TenantOnboardingDetails = {
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

export type TenantOnboardingKyc = {
  idType: GovernmentIdType;
  idNumber: string;
  governmentIdDocumentId: string | null;
};

export const emptyTenantKyc: TenantOnboardingKyc = {
  idType: "",
  idNumber: "",
  governmentIdDocumentId: null,
};

export const clearTenantOnboardingSession = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TENANT_ONBOARDING_KEYS.started);
  sessionStorage.removeItem(TENANT_ONBOARDING_KEYS.details);
  sessionStorage.removeItem(TENANT_ONBOARDING_KEYS.kyc);
  sessionStorage.removeItem(TENANT_ONBOARDING_KEYS.profilePictureId);
  sessionStorage.removeItem(TENANT_ONBOARDING_KEYS.inviteTenantId);
};

export const markTenantOnboardingComplete = () => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TENANT_ONBOARDING_KEYS.complete, "true");
  clearTenantOnboardingSession();
};

type QueryLike = Record<string, string | string[] | undefined>;

const queryString = (query: QueryLike, key: string): string => {
  const raw = query[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" ? value.trim() : "";
};

export const getTenantInviteIdFromQuery = (query: QueryLike): string => {
  for (const key of [
    "tenant-id",
    "tenantId",
    "tenant_id",
    "inviteTenantId",
  ]) {
    const value = queryString(query, key);
    if (value) return value;
  }
  return "";
};

export const getTenantInvitePrefillFromQuery = (query: QueryLike) => {
  const email =
    queryString(query, "email") ||
    queryString(query, "tenantEmail") ||
    queryString(query, "inviteEmail");
  const fullName =
    queryString(query, "fullName") ||
    queryString(query, "name") ||
    queryString(query, "tenantName");
  const phoneNumber =
    queryString(query, "phoneNumber") ||
    queryString(query, "phone") ||
    queryString(query, "tenantPhone");
  return { email, fullName, phoneNumber };
};

export const hasTenantInviteContext = (query: QueryLike): boolean => {
  const prefill = getTenantInvitePrefillFromQuery(query);
  return (
    getTenantInviteIdFromQuery(query).length > 0 ||
    Boolean(prefill.email) ||
    Boolean(prefill.fullName)
  );
};

export const buildTenantInviteQueryString = (query: QueryLike): string => {
  const params = new URLSearchParams();
  const keys = [
    "tenant-id",
    "tenantId",
    "tenant_id",
    "inviteTenantId",
    "email",
    "tenantEmail",
    "inviteEmail",
    "fullName",
    "name",
    "tenantName",
    "phoneNumber",
    "phone",
    "tenantPhone",
    "token",
  ];
  for (const key of keys) {
    const value = queryString(query, key);
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};
