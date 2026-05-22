import { apiGet, apiPatch } from "@/lib/apiClient";
import type { LandlordDTO } from "./landlord.schema";
import {
  parseLandlordApiResponse,
  resolveLandlordBusinessPhone,
} from "./parseLandlordApiResponse";
import type { LandlordBankAccountDTO } from "./updateLandlord";

/** GET /landlord/:id/settings — nested settings payload. */
export type LandlordSettingsDTO = {
  id?: string;
  notificationPreferences?: {
    paymentNotifications?: string[];
    maintenanceRequestNotifications?: string[];
    overDueNotifications?: string[];
    weeklyReportsNotifications?: string[];
  };
  platformPreferences?: {
    defaultCurrency?: string;
    defaultLateFeeAmount?: number;
    language?: string;
  };
  gracePeriodPeriods?: {
    monthlyRentDueDateGracePeriod?: string;
    quarterlyRentDueDateGracePeriod?: string;
    yearlyRentDueDateGracePeriod?: string;
  };
  lateFeeSettings?: {
    lateFeeAmount?: number;
    lateFeeType?: string;
  };
  bankAccount?: LandlordBankAccountDTO;
  createdAt?: string;
  updatedAt?: string;
};

/** Matches OpenAPI `UpdateLadlordProfileDto` + nested `CreateAddressDto`. */
export type LandlordSettingsProfileUpdateDTO = {
  businessName: string;
  businessEmail: string;
  businessPhoneNumber?: string;
  address: {
    address: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
  };
};

export type LandlordSettingsDocumentsUpdateDTO = {
  govermentIdDocumentId: string;
  landSurveyDocumentId: string;
  proofOfOwnershipDocumentId: string;
  taxIdentificationNumberDocumentId: string;
};

export type LandlordPlatformPreferencesUpdateDTO = {
  defaultCurrency: string;
  defaultLateFeeAmount: number;
  language: string;
};

export type LandlordNotificationPreferencesUpdateDTO = {
  paymentNotifications: string[];
  maintenanceRequestNotifications: string[];
  overDueNotifications: string[];
  weeklyReportsNotifications: string[];
};

export type LandlordGracePeriodsUpdateDTO = {
  monthlyRentGracePeriod: string;
  quarterlyRentGracePeriod: string;
  yearlyRentGracePeriod: string;
};

export type LandlordLateFeeUpdateDTO = {
  lateFeeAmount: number;
  lateFeeType: "fixed" | "percentage";
};

type LandlordSettingsResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number };

type LandlordSettingsResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export const getLandlordSettings = async (
  landlordId: string,
): Promise<LandlordSettingsResult<LandlordSettingsDTO>> => {
  const result = await apiGet<LandlordSettingsResponse<LandlordSettingsDTO>>(
    `/landlord/${landlordId}/settings`,
  );
  if (!result.success) return result;
  const envelope = result.data as LandlordSettingsResponse<LandlordSettingsDTO>;
  return {
    success: true,
    data: envelope.data ?? (result.data as unknown as LandlordSettingsDTO),
  };
};

export type LandlordProfilePatchResult =
  | {
      success: true;
      data: LandlordDTO | null;
      message?: string;
      raw: unknown;
    }
  | { success: false; error: string; statusCode?: number; raw?: unknown };

export const updateLandlordProfileSettings = async (
  landlordId: string,
  body: LandlordSettingsProfileUpdateDTO,
): Promise<LandlordProfilePatchResult> => {
  const result = await apiPatch<LandlordSettingsResponse<LandlordDTO | null>>(
    `/landlord/${landlordId}/profile`,
    body,
  );

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode,
      raw: null,
    };
  }

  const raw = result.data;
  if (
    raw &&
    typeof raw === "object" &&
    "success" in raw &&
    (raw as LandlordSettingsResponse<unknown>).success === false
  ) {
    const envelope = raw as LandlordSettingsResponse<unknown>;
    return {
      success: false,
      error: envelope.message || "Profile update failed",
      raw,
    };
  }

  if (raw === null || raw === undefined) {
    return { success: true, data: null, message: undefined, raw: null };
  }

  const parsed = parseLandlordApiResponse(raw);
  if (parsed.success) {
    const envelope = raw as LandlordSettingsResponse<LandlordDTO>;
    return {
      success: true,
      data: parsed.data,
      message: envelope.message,
      raw,
    };
  }

  const envelope = raw as LandlordSettingsResponse<LandlordDTO | null>;
  if (envelope.data && typeof envelope.data === "object") {
    const row = envelope.data;
    const resolved = resolveLandlordBusinessPhone(row);
    return {
      success: true,
      data: resolved
        ? { ...row, businessPhoneNumber: row.businessPhoneNumber ?? resolved }
        : row,
      message: envelope.message,
      raw,
    };
  }

  return {
    success: true,
    data: null,
    message: envelope.message,
    raw,
  };
};

export const updateLandlordDocumentsSettings = async (
  landlordId: string,
  body: LandlordSettingsDocumentsUpdateDTO,
): Promise<LandlordSettingsResult<Record<string, unknown>>> => {
  const result = await apiPatch<
    LandlordSettingsResponse<Record<string, unknown>>
  >(`/landlord/${landlordId}/documents`, body);
  if (!result.success) return result;
  return {
    success: true,
    data:
      (result.data as LandlordSettingsResponse<Record<string, unknown>>).data ??
      (result.data as unknown as Record<string, unknown>),
  };
};

export const updateLandlordPlatformPreferencesSettings = async (
  landlordId: string,
  body: LandlordPlatformPreferencesUpdateDTO,
): Promise<LandlordSettingsResult<Record<string, unknown>>> => {
  const result = await apiPatch<
    LandlordSettingsResponse<Record<string, unknown>>
  >(`/landlord/${landlordId}/settings/platform-preferences`, body);
  if (!result.success) return result;
  return {
    success: true,
    data:
      (result.data as LandlordSettingsResponse<Record<string, unknown>>).data ??
      (result.data as unknown as Record<string, unknown>),
  };
};

export const updateLandlordNotificationPreferencesSettings = async (
  landlordId: string,
  body: LandlordNotificationPreferencesUpdateDTO,
): Promise<LandlordSettingsResult<Record<string, unknown>>> => {
  const result = await apiPatch<
    LandlordSettingsResponse<Record<string, unknown>>
  >(`/landlord/${landlordId}/settings/notification-preferences`, body);
  if (!result.success) return result;
  return {
    success: true,
    data:
      (result.data as LandlordSettingsResponse<Record<string, unknown>>).data ??
      (result.data as unknown as Record<string, unknown>),
  };
};

export const updateLandlordGracePeriodsSettings = async (
  landlordId: string,
  body: LandlordGracePeriodsUpdateDTO,
): Promise<LandlordSettingsResult<Record<string, unknown>>> => {
  const result = await apiPatch<
    LandlordSettingsResponse<Record<string, unknown>>
  >(`/landlord/${landlordId}/settings/grace-periods`, body);
  if (!result.success) return result;
  return {
    success: true,
    data:
      (result.data as LandlordSettingsResponse<Record<string, unknown>>).data ??
      (result.data as unknown as Record<string, unknown>),
  };
};

export const updateLandlordLateFeeSettings = async (
  landlordId: string,
  body: LandlordLateFeeUpdateDTO,
): Promise<LandlordSettingsResult<Record<string, unknown>>> => {
  const result = await apiPatch<
    LandlordSettingsResponse<Record<string, unknown>>
  >(`/landlord/${landlordId}/settings/late-fee`, body);
  if (!result.success) return result;
  return {
    success: true,
    data:
      (result.data as LandlordSettingsResponse<Record<string, unknown>>).data ??
      (result.data as unknown as Record<string, unknown>),
  };
};
