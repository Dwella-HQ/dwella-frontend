import { createUrl } from "@/utils/createUrl";
import { apiGet } from "@/lib/apiClient";

import {
  invitedTenantSchema,
  invitedTenantsListResponseSchema,
  type InviteStatus,
  type InvitedTenantDTO,
} from "./invitedTenants.schema";

export type GetTenantInvitesQueryParams = {
  status: InviteStatus;
  unitId?: string;
  email?: string;
  fullName?: string;
  search?: string;
};

type Result =
  | { success: true; data: InvitedTenantDTO[] }
  | { success: false; error: string; statusCode?: number };

function normalizeList(raw: unknown): InvitedTenantDTO[] {
  const parsed = invitedTenantsListResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return [];
  }
  const v = parsed.data;
  const rows = Array.isArray(v) ? v : v.data || [];
  const out: InvitedTenantDTO[] = [];
  for (const row of rows) {
    const one = invitedTenantSchema.safeParse(row);
    if (one.success) out.push(one.data);
  }
  return out;
}

/**
 * GET /tenant/invite/query
 * All query params are optional except `status`.
 */
export const getTenantInvitesQuery = async (
  params: GetTenantInvitesQueryParams,
): Promise<Result> => {
  const url = createUrl("/tenant/invite/query", params);
  const result = await apiGet<unknown>(url);

  if (!result.success) {
    if (result.statusCode === 404) {
      return { success: true, data: [] };
    }
    return result;
  }

  try {
    const data = normalizeList(result.data);
    return { success: true, data };
  } catch {
    return { success: true, data: [] };
  }
};
