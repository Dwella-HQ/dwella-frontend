import { format, isValid, parseISO } from "date-fns";
import type { UnitDTO } from "./units.schema";
import type { Unit } from "@/data/mockLandlordData";

export type UnitRentStatus = Unit["rentStatus"];

function pickString(
  source: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number.parseFloat(value.replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Rent status must not default to "paid". Only mark paid when the API explicitly
 * indicates payment (boolean or status string). Otherwise use pending, or overdue
 * when the next due date is in the past (see ENDPOINTS: rent/payment lives on
 * `/rent-payment`, not inferred from `/property/{id}/units`).
 */
export function deriveUnitRentStatus(dto: UnitDTO): UnitRentStatus {
  const root = dto as unknown as Record<string, unknown>;

  const explicitPaid =
    root.isRentPaid === true ||
    root.rentPaid === true ||
    root.hasPaidRent === true ||
    root.isPaid === true;
  if (explicitPaid) return "paid";

  const explicitUnpaid =
    root.isRentPaid === false ||
    root.rentPaid === false ||
    root.hasPaidRent === false ||
    root.isPaid === false;
  if (explicitUnpaid) return "pending";

  const statusStr = pickString(root, [
    "rentPaymentStatus",
    "paymentStatus",
    "rentStatus",
    "leasePaymentStatus",
  ]);
  if (statusStr) {
    const lower = statusStr.toLowerCase();
    if (/\b(paid|complete|completed|success|cleared|confirmed)\b/.test(lower)) {
      return "paid";
    }
    if (/\b(overdue|past\s*due|late|arrears)\b/.test(lower)) {
      return "overdue";
    }
    if (/\b(pending|due|unpaid|outstanding|partial|awaiting)\b/.test(lower)) {
      return "pending";
    }
  }

  const outstanding =
    coerceNumber(root.outstandingRent) ??
    coerceNumber(root.balance) ??
    coerceNumber(root.amountDue) ??
    coerceNumber(root.rentOwed);
  if (outstanding !== null && outstanding > 0) {
    return "pending";
  }

  const dueStr = pickString(root, [
    "nextRentDueDate",
    "nextDueDate",
    "nextPaymentDueDate",
    "rentDueDate",
    "dueDate",
    "leasePaymentDueDate",
  ]);
  if (dueStr) {
    try {
      const due = parseISO(dueStr);
      if (isValid(due)) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDay = new Date(due);
        dueDay.setHours(0, 0, 0, 0);
        if (dueDay < today) return "overdue";
      }
    } catch {
      /* ignore */
    }
  }

  return "pending";
}

export function formatUnitNextDueDate(dto: UnitDTO): string {
  const root = dto as unknown as Record<string, unknown>;
  const raw =
    pickString(root, [
      "nextRentDueDate",
      "nextDueDate",
      "nextPaymentDueDate",
      "rentDueDate",
      "dueDate",
      "leaseEndDate",
    ]) ?? null;
  if (!raw) return "—";
  try {
    const parsed = parseISO(raw);
    if (isValid(parsed)) return format(parsed, "dd MMM yyyy");
  } catch {
    /* ignore */
  }
  const fallback = new Date(raw);
  return isValid(fallback) ? format(fallback, "dd MMM yyyy") : raw;
}

/**
 * Maps API UnitDTO to frontend Unit type
 */
export const mapUnitDTOToUnit = (dto: UnitDTO, propertyId: string): Unit => {
  const tenant = (dto as unknown as { tenant?: Record<string, unknown> | null })
    .tenant;
  const hasTenant = Boolean(tenant && typeof tenant === "object");
  const status: "occupied" | "vacant" | "maintenance" =
    !dto.isAvailable || hasTenant ? "occupied" : "vacant";

  const rentStatus = deriveUnitRentStatus(dto);
  const nextDueDate = formatUnitNextDueDate(dto);

  const unitType = `${dto.numberOfBedrooms}BR Apt`;

  const unitId = dto.name;

  const dtoImages = dto as unknown as {
    images?: Array<{ url?: string | null }> | null;
    property?: { photos?: Array<{ url?: string | null }> };
  };
  const image =
    dtoImages.images?.find((img) => typeof img?.url === "string" && img.url)
      ?.url ??
    dtoImages.property?.photos?.find(
      (photo) => typeof photo?.url === "string" && photo.url,
    )?.url ??
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop";

  const resolvedPropertyId =
    (dto as { propertyId?: string }).propertyId ?? propertyId;

  const tenantId =
    typeof tenant?.id === "string" && tenant.id ? tenant.id : undefined;
  const tenantUser =
    tenant && typeof tenant.user === "object" && tenant.user !== null
      ? (tenant.user as Record<string, unknown>)
      : null;
  const tenantName =
    (typeof tenantUser?.fullName === "string" && tenantUser.fullName) ||
    (typeof tenant?.fullName === "string" && tenant.fullName) ||
    undefined;
  const tenantEmail =
    (typeof tenantUser?.email === "string" && tenantUser.email) ||
    (typeof tenant?.email === "string" && tenant.email) ||
    undefined;
  const tenantPhone =
    (typeof tenantUser?.phoneNumber === "string" && tenantUser.phoneNumber) ||
    (typeof tenant?.phoneNumber === "string" && tenant.phoneNumber) ||
    undefined;

  return {
    id: dto.id,
    propertyId: resolvedPropertyId,
    unitId,
    type: unitType,
    bedrooms: dto.numberOfBedrooms,
    bathrooms: dto.numberOfBathrooms,
    size: 0,
    floor: "N/A",
    monthlyRent: dto.rentAmount,
    cautionFee: 0,
    status,
    rentStatus,
    amenities:
      dto.amenities && Array.isArray(dto.amenities) ? dto.amenities : [],
    image,
    tenantId,
    tenantName,
    tenantEmail,
    tenantPhone,
    leaseEndDate:
      pickString(dto as unknown as Record<string, unknown>, [
        "leaseEndDate",
        "nextLeaseEndDate",
      ]) ?? undefined,
    nextDueDate,
  };
};
