import { getTenantInvitesQuery } from "./getTenantInvitesQuery";
import {
  INVITE_STATUSES,
  type InviteStatus,
  type InvitedTenantDTO,
} from "./invitedTenants.schema";

type Result =
  | { success: true; data: InvitedTenantDTO[] }
  | { success: false; error: string; statusCode?: number };

/**
 * Backward-compatible helper for property-level invited tenants.
 * Uses GET /tenant/invite/query with status=pending and filters by property.
 */
export const getInvitedTenantsForProperty = async (
  propertyId: string,
  status: InviteStatus | "all" = "all",
): Promise<Result> => {
  const statuses = status === "all" ? INVITE_STATUSES : [status];
  const settled = await Promise.all(
    statuses.map((s) => getTenantInvitesQuery({ status: s })),
  );

  const failed = settled.find((r) => !r.success);
  if (failed && !failed.success) {
    return failed;
  }

  const merged = settled.flatMap((r) => (r.success ? r.data : []));
  const uniqueById = new Map<string, InvitedTenantDTO>();
  for (const inv of merged) uniqueById.set(inv.id, inv);

  const data = [...uniqueById.values()].filter((inv) => {
    const nestedPropertyId = inv.unit?.property?.id?.trim();
    const directPropertyIdRaw = (inv as { propertyId?: unknown }).propertyId;
    const directPropertyId =
      typeof directPropertyIdRaw === "string" ? directPropertyIdRaw.trim() : "";
    return nestedPropertyId === propertyId || directPropertyId === propertyId;
  });
  return { success: true, data };
};
