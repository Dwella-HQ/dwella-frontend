import { apiPatch } from "@/lib/apiClient";

type PatchTenantEntityResult =
  | { success: true }
  | { success: false; error: string };

/**
 * `PATCH /tenant/{id}` (ENDPOINTS.md). Payload depends on backend (e.g. `{ isActive: boolean }`).
 */
export const patchTenantEntity = async (
  tenantId: string,
  body: Record<string, unknown>,
): Promise<PatchTenantEntityResult> => {
  const result = await apiPatch<unknown>(`/tenant/${tenantId}`, body);

  if (!result.success) {
    return result;
  }

  return { success: true };
};
