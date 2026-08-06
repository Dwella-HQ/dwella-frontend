import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/apiClient";

export type UnitPricingDTO = {
  mode: string;
  price: string;
};

/**
 * `pricing[].mode` is the stay DURATION a rate applies to — not a nightly
 * rate label. A service apartment is billed by week/two-weeks/month, so a
 * unit can carry up to three tiers (one per duration), each with its own
 * total price for that period.
 */
export type ServiceApartmentPricingMode = "weekly" | "biweekly" | "monthly";

export const SERVICE_APARTMENT_PRICING_MODES: {
  value: ServiceApartmentPricingMode;
  label: string;
  days: number;
}[] = [
  { value: "weekly", label: "Weekly", days: 7 },
  { value: "biweekly", label: "Biweekly", days: 14 },
  { value: "monthly", label: "Monthly", days: 30 },
];

/** POST /property/unit/{unitId}/service-apartment-offering */
export type CreateServiceApartmentOfferingDTO = {
  unitId: string;
  minimumStay?: number;
  maximumStay?: number;
  clockoutTime: string;
  pricing?: UnitPricingDTO[];
  rules: string;
  description: string;
};

/** PATCH /property/unit/{unitId}/service-apartment-offering */
export type UpdateServiceApartmentOfferingDTO = {
  minimumStay?: number;
  maximumStay?: number;
  clockoutTime?: string;
  pricing?: UnitPricingDTO[];
  rules?: string;
  description?: string;
};

export type ServiceApartmentOfferingDTO = {
  id: string;
  minimumStay?: number | null;
  maximumStay?: number | null;
  clockoutTime: string;
  pricing?: UnitPricingDTO[] | null;
  rules: string;
  description: string;
  unit?: unknown;
  createdAt?: string;
  updatedAt?: string;
};

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number };

function unwrapOffering(raw: unknown): ServiceApartmentOfferingDTO | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const data =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : record;
  if (typeof data.id !== "string") return null;
  return data as unknown as ServiceApartmentOfferingDTO;
}

export const createServiceApartmentOffering = async (
  unitId: string,
  body: CreateServiceApartmentOfferingDTO,
): Promise<Result<ServiceApartmentOfferingDTO | null>> => {
  const result = await apiPost<unknown>(
    `/property/unit/${encodeURIComponent(unitId)}/service-apartment-offering`,
    body,
  );
  if (!result.success) {
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode,
    };
  }
  return { success: true, data: unwrapOffering(result.data) };
};

export const getServiceApartmentOffering = async (
  unitId: string,
): Promise<Result<ServiceApartmentOfferingDTO | null>> => {
  const result = await apiGet<unknown>(
    `/property/unit/${encodeURIComponent(unitId)}/service-apartment-offering`,
  );
  if (!result.success) {
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode,
    };
  }
  return { success: true, data: unwrapOffering(result.data) };
};

export const updateServiceApartmentOffering = async (
  unitId: string,
  body: UpdateServiceApartmentOfferingDTO,
): Promise<Result<ServiceApartmentOfferingDTO | null>> => {
  const result = await apiPatch<unknown>(
    `/property/unit/${encodeURIComponent(unitId)}/service-apartment-offering`,
    body,
  );
  if (!result.success) {
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode,
    };
  }
  return { success: true, data: unwrapOffering(result.data) };
};

export const deleteServiceApartmentOffering = async (
  unitId: string,
): Promise<Result<null>> => {
  const result = await apiDelete<unknown>(
    `/property/unit/${encodeURIComponent(unitId)}/service-apartment-offering`,
  );
  if (!result.success) {
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode,
    };
  }
  return { success: true, data: null };
};

function parsePrice(value: unknown): number {
  const n = Number.parseFloat(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Total price set for a specific duration tier (weekly/biweekly/monthly), if any. */
export const pricingTierFromOffering = (
  offering: ServiceApartmentOfferingDTO | null | undefined,
  mode: ServiceApartmentPricingMode,
): number => {
  const entry = offering?.pricing?.find(
    (p) => String(p.mode || "").toLowerCase() === mode,
  );
  return entry ? parsePrice(entry.price) : 0;
};

/**
 * Estimated nightly-equivalent rate for guest-facing "from ₦X/night" style
 * summaries. Real billing is by duration tier (weekly/biweekly/monthly), not
 * per night, so this divides the shortest available tier's total price by
 * its number of days — it's an estimate for display only, not a bookable
 * nightly rate.
 */
export const nightlyPriceFromOffering = (
  offering: ServiceApartmentOfferingDTO | null | undefined,
): number => {
  if (!offering?.pricing?.length) return 0;
  for (const { value, days } of SERVICE_APARTMENT_PRICING_MODES) {
    const total = pricingTierFromOffering(offering, value);
    if (total > 0) return Math.round(total / days);
  }
  // Unrecognized mode label on legacy data — use it as-is rather than 0.
  return parsePrice(offering.pricing[0]?.price);
};

/** Actual monthly tier if the landlord set one, else derived from the nightly estimate. */
export const monthlyPriceFromOffering = (
  offering: ServiceApartmentOfferingDTO | null | undefined,
): number => {
  const monthly = pricingTierFromOffering(offering, "monthly");
  if (monthly > 0) return monthly;
  const nightly = nightlyPriceFromOffering(offering);
  return nightly > 0 ? nightly * 30 : 0;
};
