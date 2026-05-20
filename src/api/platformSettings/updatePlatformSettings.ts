import { apiPatch } from "@/lib/apiClient";

type Result = { success: true } | { success: false; error: string };

/** `PATCH /settings/update` (ENDPOINTS.md) */
export const updatePlatformSettings = async (
  body: Record<string, unknown>,
): Promise<Result> => {
  const result = await apiPatch<unknown>("/settings/update", body);
  if (!result.success) {
    return result;
  }
  return { success: true };
};
