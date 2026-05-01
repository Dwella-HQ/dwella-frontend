import { apiGet } from "@/lib/apiClient";

export type PropertySettingsDTO = Record<string, unknown>;

type GetPropertySettingsResult =
  | { success: true; data: PropertySettingsDTO }
  | { success: false; error: string; statusCode?: number };

/**
 * `GET /property/{id}/settings` — grace periods, late fee, etc. (OpenAPI PropertySettings).
 */
export const getPropertySettings = async (
  propertyId: string,
): Promise<GetPropertySettingsResult> => {
  const result = await apiGet<{
    success?: boolean;
    message?: string;
    data?: PropertySettingsDTO;
  }>(`/property/${encodeURIComponent(propertyId)}/settings`);

  if (!result.success) {
    return result;
  }

  const raw = result.data as Record<string, unknown> | undefined;
  const inner =
    raw && typeof raw === "object" && "data" in raw
      ? (raw.data as PropertySettingsDTO)
      : (raw as PropertySettingsDTO);

  if (!inner || typeof inner !== "object") {
    return {
      success: false,
      error: "Invalid property settings response",
    };
  }

  return { success: true, data: inner as PropertySettingsDTO };
};
