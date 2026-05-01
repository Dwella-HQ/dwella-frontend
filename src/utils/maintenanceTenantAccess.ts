import type { MaintenanceRequestItemDTO } from "@/api/maintenance";

/** Tenant record id from GET maintenance list / single request. */
export function extractRequestTenantId(
  request: MaintenanceRequestItemDTO | null,
): string | null {
  if (!request) return null;
  const t = request as Record<string, unknown>;
  const flat = t.tenantId ?? t.tenant_id;
  if (typeof flat === "string" && flat.length > 0) return flat;
  const tenant = t.tenant as Record<string, unknown> | undefined;
  if (tenant && typeof tenant.id === "string" && tenant.id.length > 0) {
    return tenant.id;
  }
  return null;
}

function requestLinkedToAuthUser(
  request: MaintenanceRequestItemDTO,
  authUserId: string,
): boolean {
  const tenant = (
    request as {
      tenant?: {
        user?: { id?: unknown };
        userId?: unknown;
      };
    }
  ).tenant;
  if (!tenant || typeof tenant !== "object") return false;
  const u = tenant.user;
  if (u && typeof u === "object" && typeof u.id === "string" && u.id === authUserId)
    return true;
  if (typeof tenant.userId === "string" && tenant.userId === authUserId) return true;
  return false;
}

/** True if this maintenance row belongs to the signed-in tenant (record id or nested user). */
export function maintenanceRequestOwnedByTenant(
  request: MaintenanceRequestItemDTO,
  tenantRecordId: string | null | undefined,
  authUserId: string | undefined,
): boolean {
  const rid = extractRequestTenantId(request);
  if (tenantRecordId && rid && rid === tenantRecordId) return true;
  if (authUserId && requestLinkedToAuthUser(request, authUserId)) return true;
  return false;
}
