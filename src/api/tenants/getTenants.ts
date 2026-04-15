import { createUrl } from "@/utils/createUrl";
import { apiGet } from "@/lib/apiClient";

import type { TenantsResponseDTO, TenantDTO } from "./tenants.schema";
import { tenantSchema, tenantsResponseSchema } from "./tenants.schema";

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

const extractTenantLikeArray = (input: unknown): unknown[] => {
  if (Array.isArray(input)) return input;
  if (!input || typeof input !== "object") return [];

  const obj = input as Record<string, unknown>;
  const arrayKeys = ["users", "items", "results", "rows", "records", "data"];
  for (const key of arrayKeys) {
    const value = obj[key];
    if (Array.isArray(value)) return value;
  }

  // Some APIs nest one more level: { data: { users: [...] } }
  for (const key of arrayKeys) {
    const nested = obj[key];
    if (nested && typeof nested === "object") {
      const nestedObj = nested as Record<string, unknown>;
      for (const nestedKey of arrayKeys) {
        const nestedValue = nestedObj[nestedKey];
        if (Array.isArray(nestedValue)) return nestedValue;
      }
    }
  }

  return [];
};

export const getTenants = async (
  params?: GetTenantsParams,
): Promise<GetTenantsResult> => {
  const url = createUrl("/user/query", {
    ...params,
    roleName: "tenant",
  });

  const result = await apiGet<TenantsResponseDTO>(url);

  if (!result.success) {
    return result;
  }

  // Validate/normalize response with Zod.
  // The backend has returned multiple payload shapes for this endpoint.
  try {
    const parsed = tenantsResponseSchema.safeParse(result.data);

    const rawTenantList = parsed.success
      ? Array.isArray(parsed.data.data)
        ? parsed.data.data
        : parsed.data.data.users
      : extractTenantLikeArray(result.data);

    const tenants = rawTenantList
      .map((item) => tenantSchema.safeParse(item))
      .filter(
        (item): item is { success: true; data: TenantDTO } => item.success,
      )
      .map((item) => item.data);

    return { success: true, data: tenants };
  } catch (parseError) {
    console.error("Get tenants schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};
