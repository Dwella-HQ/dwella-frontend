import { apiPatch } from "@/lib/apiClient";

export type PropertyGracePeriodSettingsDTO = {
  monthlyRentGracePeriod: string;
  quarterlyRentGracePeriod: string;
  yearlyRentGracePeriod: string;
};

type UpdatePropertyGracePeriodSettingsResult =
  | { success: true; data: Record<string, unknown> }
  | { success: false; error: string; statusCode?: number };

export const updatePropertyGracePeriodSettings = async (
  id: string,
  body: PropertyGracePeriodSettingsDTO,
): Promise<UpdatePropertyGracePeriodSettingsResult> => {
  const result = await apiPatch<{
    success?: boolean;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/property/${id}/settings/grace-period`, body);

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data:
      (result.data as { data?: Record<string, unknown> })?.data ??
      (result.data as unknown as Record<string, unknown>),
  };
};
