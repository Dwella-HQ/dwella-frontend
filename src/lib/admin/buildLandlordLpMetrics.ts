import type { PropertyDTO } from "@/api/properties/properties.schema";
import type { RentPaymentItemDTO } from "@/api/rent-payment/rentPayment.schema";

function coerceAmount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number.parseFloat(value.replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function sumUnitMonthlyRent(property: PropertyDTO): number {
  const units = Array.isArray(property.units) ? property.units : [];
  let sum = 0;
  for (const u of units) {
    if (!u || typeof u !== "object") continue;
    const record = u as Record<string, unknown>;
    const raw = record.rentAmount ?? record.monthlyRent ?? record.rent;
    const n =
      typeof raw === "number"
        ? raw
        : typeof raw === "string"
          ? Number.parseFloat(String(raw).replace(/,/g, ""))
          : NaN;
    if (Number.isFinite(n) && n > 0) sum += n;
  }
  return sum;
}

function unitCount(property: PropertyDTO): number {
  const units = Array.isArray(property.units) ? property.units : [];
  return units.length > 0 ? units.length : property.numberOfUnits ?? 0;
}

export type LandlordLpMetrics = {
  propertyCount: number;
  unitCount: number;
  monthlyRevenue: number;
  totalRevenue: number;
};

/** Per-landlord aggregates from property list + rent payments (attributed via propertyId). */
export function buildLandlordMetricsMap(
  properties: PropertyDTO[],
  payments: RentPaymentItemDTO[],
): Map<string, LandlordLpMetrics> {
  const map = new Map<string, LandlordLpMetrics>();

  const bump = (landlordId: string): LandlordLpMetrics => {
    let row = map.get(landlordId);
    if (!row) {
      row = {
        propertyCount: 0,
        unitCount: 0,
        monthlyRevenue: 0,
        totalRevenue: 0,
      };
      map.set(landlordId, row);
    }
    return row;
  };

  const propertyIdToLandlordId = new Map<string, string>();

  for (const p of properties) {
    const lid = p.landlordId ?? p.landlord?.id;
    if (!lid) continue;
    propertyIdToLandlordId.set(p.id, lid);
    const m = bump(lid);
    m.propertyCount += 1;
    m.unitCount += unitCount(p);
    m.monthlyRevenue += sumUnitMonthlyRent(p);
  }

  for (const item of payments) {
    const pid = item.propertyId ?? item.property_id;
    if (!pid || typeof pid !== "string") continue;
    const lid = propertyIdToLandlordId.get(pid);
    if (!lid) continue;
    const m = bump(lid);
    m.totalRevenue += coerceAmount(
      item.amount ?? item.paidAmount ?? item.paid_amount ?? item.total,
    );
  }

  return map;
}

export function sumLandlordLpPortfolioTotals(
  byLandlord: Map<string, LandlordLpMetrics>,
): {
  propertiesManaged: number;
  totalUnits: number;
  totalRevenue: number;
} {
  let propertiesManaged = 0;
  let totalUnits = 0;
  let totalRevenue = 0;
  for (const m of byLandlord.values()) {
    propertiesManaged += m.propertyCount;
    totalUnits += m.unitCount;
    totalRevenue += m.totalRevenue;
  }
  return { propertiesManaged, totalUnits, totalRevenue };
}
