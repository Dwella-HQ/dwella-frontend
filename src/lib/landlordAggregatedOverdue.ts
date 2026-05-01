/**
 * Landlord rent KPIs from the same sources as the Rent page:
 * GET /rent/lease/leaseId (aggregated rents) scoped to leases on the landlord's properties.
 * Includes overdue totals and rent collected in the current calendar month (paid rows).
 */

import { isValid, parse, parseISO } from "date-fns";
import {
  getAggregatedRents,
  isLeaseActiveFlag,
  resolveTenantActiveLeaseId,
} from "@/api/rent";
import type { RentItemDTO } from "@/api/rent";
import { getTenant, getTenantList } from "@/api/tenants";
import type { TenantRecordDTO } from "@/api/tenants";

type ScopedPick = {
  activeLeaseId: string;
  propertyId: string | null;
};

function propertyIdFromTenantRecord(
  rec: Record<string, unknown>,
): string | null {
  const cu = rec.currentUnit as Record<string, unknown> | undefined;
  const propFromUnit = cu?.property as Record<string, unknown> | undefined;
  if (propFromUnit && typeof propFromUnit.id === "string" && propFromUnit.id) {
    return propFromUnit.id;
  }
  const leases = Array.isArray(rec.leases)
    ? (rec.leases as Array<Record<string, unknown>>)
    : [];
  for (const lease of leases) {
    if (!isLeaseActiveFlag(lease)) continue;
    const u = lease.unit as Record<string, unknown> | undefined;
    const p = u?.property as Record<string, unknown> | undefined;
    if (p && typeof p.id === "string" && p.id) return p.id;
  }
  return null;
}

function tenantDetailToLandlordPick(
  tr: Record<string, unknown>,
  tenantId: string,
): ScopedPick | null {
  const leases = Array.isArray(tr.leases)
    ? (tr.leases as Array<Record<string, unknown>>)
    : [];
  const activeLeaseId = resolveTenantActiveLeaseId(leases, null);
  if (!activeLeaseId) return null;
  const propertyId = propertyIdFromTenantRecord(tr);
  return { activeLeaseId, propertyId };
}

function landlordPickFromListRecord(
  rec: Record<string, unknown>,
  tenantId: string,
): ScopedPick | null {
  const leases = rec.leases;
  if (!Array.isArray(leases) || leases.length === 0) return null;
  if (!leases.some((l) => isLeaseActiveFlag(l as Record<string, unknown>))) {
    return null;
  }
  const activeLeaseId = resolveTenantActiveLeaseId(
    leases as Array<Record<string, unknown>>,
    null,
  );
  if (!activeLeaseId) return null;
  const cu = rec.currentUnit as Record<string, unknown> | undefined;
  const prop = cu?.property as Record<string, unknown> | undefined;
  if (
    !cu ||
    typeof cu.name !== "string" ||
    !prop ||
    typeof prop.name !== "string"
  ) {
    return null;
  }
  const propertyId = propertyIdFromTenantRecord(rec);
  return { activeLeaseId, propertyId };
}

function parseRentDueDate(value: string): Date | null {
  if (!value || value === "—") return null;
  try {
    const iso = parseISO(value);
    if (isValid(iso)) return iso;
  } catch {
    /* ignore */
  }
  try {
    const formatted = parse(value, "dd MMM yyyy", new Date());
    if (isValid(formatted)) return formatted;
  } catch {
    /* ignore */
  }
  const fallback = new Date(value);
  return isValid(fallback) ? fallback : null;
}

/** Lease IDs for tenants whose active unit/property is in `allowedPropertyIds`. */
export async function fetchLeaseIdsScopedToLandlordProperties(
  allowedPropertyIds: Set<string>,
): Promise<Set<string>> {
  const leaseIds = new Set<string>();
  if (allowedPropertyIds.size === 0) return leaseIds;

  const tenantListResult = await getTenantList({ page: 1, limit: 200 });
  if (!tenantListResult.success) return leaseIds;

  const needDetail: TenantRecordDTO[] = [];
  const seenPickIds = new Set<string>();

  const considerPick = (pick: ScopedPick | null, tenantRowId: string) => {
    if (!pick?.propertyId || !allowedPropertyIds.has(pick.propertyId)) return;
    if (seenPickIds.has(tenantRowId)) return;
    seenPickIds.add(tenantRowId);
    leaseIds.add(pick.activeLeaseId);
  };

  for (const t of tenantListResult.data) {
    const rec = t as unknown as Record<string, unknown>;
    const id = String(rec.id ?? "");
    const leases = rec.leases;

    if (Array.isArray(leases) && leases.length > 0) {
      if (
        !leases.some((l) => isLeaseActiveFlag(l as Record<string, unknown>))
      ) {
        continue;
      }
      const quick = landlordPickFromListRecord(rec, id);
      if (quick) {
        considerPick(quick, id);
      } else {
        needDetail.push(t);
      }
    } else {
      needDetail.push(t);
    }
  }

  const BATCH = 12;
  for (let i = 0; i < needDetail.length; i += BATCH) {
    const chunk = needDetail.slice(i, i + BATCH);
    const details = await Promise.all(
      chunk.map((row) =>
        getTenant(String((row as unknown as Record<string, unknown>).id)),
      ),
    );
    for (let j = 0; j < chunk.length; j++) {
      const detail = details[j];
      if (!detail.success) continue;
      const tr = detail.data as unknown as Record<string, unknown>;
      const tid = String(tr.id ?? "");
      const pick = tenantDetailToLandlordPick(tr, tid);
      considerPick(pick, tid);
    }
  }

  return leaseIds;
}

export function summarizeOverdueFromAggregatedRents(
  rents: RentItemDTO[],
  scopedLeaseIds: Set<string>,
): { amount: number; count: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let amount = 0;
  let count = 0;

  for (const rent of rents) {
    if (!scopedLeaseIds.has(rent.leaseId)) continue;
    const paid = (rent.status || "").toLowerCase() === "paid";
    if (paid) continue;
    const dueRaw = rent.dueDate || "";
    const dueDateObj = parseRentDueDate(dueRaw);
    if (!dueDateObj) continue;
    if (dueDateObj < today) {
      count += 1;
      amount += rent.totalAmount ?? rent.amount ?? 0;
    }
  }

  return { amount, count };
}

function isDateInCurrentMonth(d: Date): boolean {
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  );
}

/** Paid rent charges with payment (or fallback due) date in the current calendar month. */
export function summarizeRentCollectedCurrentMonthFromAggregatedRents(
  rents: RentItemDTO[],
  scopedLeaseIds: Set<string>,
): number {
  let sum = 0;
  for (const rent of rents) {
    if (!scopedLeaseIds.has(rent.leaseId)) continue;
    const paid = (rent.status || "").toLowerCase() === "paid";
    if (!paid) continue;
    const payRaw =
      rent.paymentDate != null && String(rent.paymentDate).length > 0
        ? String(rent.paymentDate)
        : rent.dueDate || "";
    const payDate = parseRentDueDate(payRaw);
    if (!payDate || !isDateInCurrentMonth(payDate)) continue;
    sum += rent.totalAmount ?? rent.amount ?? 0;
  }
  return sum;
}

export type LandlordRentDashboardMetrics = {
  overdueAmount: number;
  overdueCount: number;
  rentCollectedThisMonth: number;
};

export async function fetchLandlordRentDashboardMetrics(
  allowedPropertyIds: Set<string>,
): Promise<LandlordRentDashboardMetrics> {
  if (allowedPropertyIds.size === 0) {
    return {
      overdueAmount: 0,
      overdueCount: 0,
      rentCollectedThisMonth: 0,
    };
  }

  const [scopedLeaseIds, rentsResult] = await Promise.all([
    fetchLeaseIdsScopedToLandlordProperties(allowedPropertyIds),
    getAggregatedRents(),
  ]);

  if (!rentsResult.success || scopedLeaseIds.size === 0) {
    return {
      overdueAmount: 0,
      overdueCount: 0,
      rentCollectedThisMonth: 0,
    };
  }

  const rents = rentsResult.data;
  const overdue = summarizeOverdueFromAggregatedRents(rents, scopedLeaseIds);
  const rentCollectedThisMonth =
    summarizeRentCollectedCurrentMonthFromAggregatedRents(
      rents,
      scopedLeaseIds,
    );

  return {
    overdueAmount: overdue.amount,
    overdueCount: overdue.count,
    rentCollectedThisMonth,
  };
}
