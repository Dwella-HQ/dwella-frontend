import { createUrl } from "@/utils/createUrl";
import { apiGet } from "@/lib/apiClient";

import type { TenantRecordDTO } from "./tenants.schema";
import { tenantRecordSchema } from "./tenants.schema";

type GetTenantListParams = {
  page?: number;
  limit?: number;
};

type GetTenantListResult =
  | { success: true; data: TenantRecordDTO[] }
  | { success: false; error: string };

function extractArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && "data" in raw) {
    const d = (raw as { data: unknown }).data;
    if (Array.isArray(d)) return d;
    if (d && typeof d === "object" && "data" in d) {
      const inner = (d as { data: unknown }).data;
      if (Array.isArray(inner)) return inner;
    }
  }
  return [];
}

/**
 * `GET /tenant` — primary tenant list (ENDPOINTS.md).
 * Some environments also support `?page` / `limit` via `GET /tenant/query` if needed later.
 */
export const getTenantList = async (
  params?: GetTenantListParams,
): Promise<GetTenantListResult> => {
  const url = createUrl("/tenant", {
    page: params?.page,
    limit: params?.limit,
  });
  const result = await apiGet<unknown>(url);

  if (!result.success) {
    return result;
  }

  try {
    const items = extractArray(result.data).map((item) =>
      tenantRecordSchema.parse(item),
    );
    return { success: true, data: items };
  } catch (e) {
    console.error("getTenantList parse error:", e);
    return {
      success: false,
      error: "Invalid response data format received from GET /tenant",
    };
  }
};
