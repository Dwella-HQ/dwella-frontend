import { apiGet } from "@/lib/apiClient";

import type { TenantResponseDTO, TenantRecordDTO } from "./tenants.schema";
import { tenantResponseSchema } from "./tenants.schema";

type GetTenantResult =
  | { success: true; data: TenantRecordDTO }
  | { success: false; error: string };

export const getTenant = async (
  id: string | number,
): Promise<GetTenantResult> => {
  const result = await apiGet<TenantResponseDTO>(`/tenant/${id}`);

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = tenantResponseSchema.parse(result.data);
    const tenant = parsed.data ?? (parsed as unknown as TenantRecordDTO);
    return { success: true, data: tenant };
  } catch (parseError) {
    console.error("Get tenant schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};
