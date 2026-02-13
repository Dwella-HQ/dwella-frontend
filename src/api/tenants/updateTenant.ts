import { apiPatch } from "@/lib/apiClient";

import type { UpdateTenantRequestDTO, TenantResponseDTO, TenantDTO } from "./tenants.schema";
import { tenantResponseSchema } from "./tenants.schema";

type UpdateTenantResult = 
  | { success: true; data: TenantDTO }
  | { success: false; error: string };

export const updateTenant = async (
  id: string | number,
  data: UpdateTenantRequestDTO
): Promise<UpdateTenantResult> => {
  const result = await apiPatch<TenantResponseDTO>(`/user/${id}`, data);

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = tenantResponseSchema.parse(result.data);
    // Handle both direct tenant object and object with data property
    const tenant = parsed.data || (parsed as unknown as TenantDTO);
    return { success: true, data: tenant };
  } catch (parseError) {
    console.error("Update tenant schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





