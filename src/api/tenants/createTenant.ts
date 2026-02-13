import { apiPost } from "@/lib/apiClient";

import type { CreateTenantRequestDTO, TenantResponseDTO, TenantDTO } from "./tenants.schema";
import { tenantResponseSchema } from "./tenants.schema";

type CreateTenantResult = 
  | { success: true; data: TenantDTO }
  | { success: false; error: string };

export const createTenant = async (
  data: CreateTenantRequestDTO
): Promise<CreateTenantResult> => {
  const result = await apiPost<TenantResponseDTO>("/user", {
    ...data,
    roleName: "tenant",
  });

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
    console.error("Create tenant schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





