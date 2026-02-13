import { createUrl } from "@/utils/createUrl";
import { apiGet } from "@/lib/apiClient";

import type { TenantsResponseDTO, TenantDTO } from "./tenants.schema";
import { tenantsResponseSchema } from "./tenants.schema";

type GetTenantsParams = {
  name?: string;
  email?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

type GetTenantsResult = 
  | { success: true; data: TenantDTO[] }
  | { success: false; error: string };

export const getTenants = async (params?: GetTenantsParams): Promise<GetTenantsResult> => {
  const url = createUrl("/user/query", {
    ...params,
    roleName: "tenant",
  });

  const result = await apiGet<TenantsResponseDTO>(url);

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = tenantsResponseSchema.parse(result.data);
    // Handle different response formats
    let tenants: TenantDTO[] = [];
    if (Array.isArray(parsed.data)) {
      tenants = parsed.data;
    } else if (parsed.data && typeof parsed.data === "object" && "users" in parsed.data) {
      tenants = parsed.data.users;
    }
    return { success: true, data: tenants };
  } catch (parseError) {
    console.error("Get tenants schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





