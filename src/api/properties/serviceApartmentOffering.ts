import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/apiClient";

export type UnitPricingDTO = {
  mode: string;
  price: string;
};

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

/** Prefer nightly/daily price from offering.pricing[]; falls back to first entry. */
export const nightlyPriceFromOffering = (
  offering: ServiceApartmentOfferingDTO | null | undefined,
): number => {
  if (!offering?.pricing?.length) return 0;
  const preferred =
    offering.pricing.find((p) =>
      /night|daily|day/i.test(String(p.mode || "")),
    ) ?? offering.pricing[0];
  const n = Number.parseFloat(String(preferred.price ?? "").replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
