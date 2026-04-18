import { apiDelete } from "@/lib/apiClient";

type DeleteTenantEntityResult =
  | { success: true }
  | { success: false; error: string };

/** `DELETE /tenant/{id}` per ENDPOINTS.md (tenant record id, not necessarily user id). */
export const deleteTenantEntity = async (
  tenantId: string,
): Promise<DeleteTenantEntityResult> => {
  const result = await apiDelete<unknown>(`/tenant/${tenantId}`);

  if (!result.success) {
    return result;
  }

  return { success: true };
};
