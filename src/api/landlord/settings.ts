import { apiGet, apiPatch } from "@/lib/apiClient";

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
): Promise<LandlordSettingsResult<Record<string, unknown>>> => {
  const result = await apiGet<
    LandlordSettingsResponse<Record<string, unknown>>
  >(`/landlord/${landlordId}/settings`);
  if (!result.success) return result;
  return {
    success: true,
    data:
      (result.data as LandlordSettingsResponse<Record<string, unknown>>).data ??
      (result.data as unknown as Record<string, unknown>),
  };
};

export const updateLandlordProfileSettings = async (
  landlordId: string,
  body: LandlordSettingsProfileUpdateDTO,
): Promise<LandlordSettingsResult<Record<string, unknown>>> => {
  const result = await apiPatch<
    LandlordSettingsResponse<Record<string, unknown>>
  >(`/landlord/${landlordId}/profile`, body);
  if (!result.success) return result;
  return {
    success: true,
    data:
      (result.data as LandlordSettingsResponse<Record<string, unknown>>).data ??
      (result.data as unknown as Record<string, unknown>),
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
