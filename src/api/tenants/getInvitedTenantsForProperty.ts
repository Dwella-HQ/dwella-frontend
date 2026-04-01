import { apiGet } from "@/lib/apiClient";

import {
  invitedTenantSchema,
  invitedTenantsListResponseSchema,
  type InvitedTenantDTO,
} from "./invitedTenants.schema";

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
 * GET /property/{propertyId}/tenant-invites
 * Returns pending tenant invitations for this property.
 */
export const getInvitedTenantsForProperty = async (
  propertyId: string,
): Promise<Result> => {
  const result = await apiGet<unknown>(
    `/property/${propertyId}/tenant-invites`,
  );

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
