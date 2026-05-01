import type { RentItemDTO } from "./rent.schema";

/** Matches API quirks where `isActive` may be boolean, string, or number. */
export function isLeaseActiveFlag(lease: Record<string, unknown>): boolean {
  const v = lease.isActive;
  return v === true || v === "true" || v === 1;
}

/**
 * Prefer the lease marked active on the tenant profile over a possibly stale
 * `localStorage` lease id (e.g. after switching accounts or lease renewal).
 */
export function resolveTenantActiveLeaseId(
  leases: Array<Record<string, unknown>> | undefined,
  storedLeaseId: string | null,
): string | null {
  const list = Array.isArray(leases) ? leases : [];
  const leaseIdSet = new Set(
    list
      .map((l) => (typeof l.id === "string" ? l.id : String(l.id ?? "")))
      .filter(Boolean),
  );

  const profileActive = list.find((lease) => isLeaseActiveFlag(lease));
  const profileActiveId =
    profileActive && typeof profileActive.id === "string"
      ? profileActive.id
      : profileActive
        ? String(profileActive.id ?? "")
        : null;

  if (profileActiveId) return profileActiveId;
  if (storedLeaseId && leaseIdSet.has(storedLeaseId)) return storedLeaseId;
  return null;
}

/**
 * Aggregate `GET /rent/lease/leaseId` returns rents for many leases; keep only
 * rows for this tenant lease with an active nested `lease` when present.
 */
export function filterRentsForActiveLeaseId(
  rents: RentItemDTO[],
  activeLeaseId: string,
): RentItemDTO[] {
  if (!activeLeaseId) return [];
  return rents.filter((r) => {
    if (r.leaseId !== activeLeaseId) return false;
    const raw = r as Record<string, unknown>;
    const nested = raw.lease as Record<string, unknown> | undefined;
    if (nested && typeof nested === "object") {
      if (String(nested.id ?? "") !== activeLeaseId) return false;
      return isLeaseActiveFlag(nested);
    }
    return true;
  });
}
