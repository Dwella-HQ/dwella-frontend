import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/apiClient";
import type { UnitPricingDTO } from "./serviceApartmentOffering";

/** POST /property/unit/{unitId}/rent-offering */
export type CreateRentOfferingDTO = {
  unitId: string;
  gracePeriod: number;
  securityDeposit: number;
  pricing?: UnitPricingDTO[];
};

/** PATCH /property/unit/{unitId}/rent-offering */
export type UpdateRentOfferingDTO = {
  gracePeriod?: number;
  securityDeposit?: number;
  pricing?: UnitPricingDTO[];
};

export type RentOfferingDTO = {
  id: string;
  gracePeriod: number;
  securityDeposit: number;
  pricing?: UnitPricingDTO[] | null;
  unit?: unknown;
  createdAt?: string;
  updatedAt?: string;
};

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number };

function unwrapOffering(raw: unknown): RentOfferingDTO | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const data =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : record;
  if (typeof data.id !== "string") return null;
  return data as unknown as RentOfferingDTO;
}

export const createRentOffering = async (
  unitId: string,
  body: CreateRentOfferingDTO,
): Promise<Result<RentOfferingDTO | null>> => {
  const result = await apiPost<unknown>(
    `/property/unit/${encodeURIComponent(unitId)}/rent-offering`,
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

export const getRentOffering = async (
  unitId: string,
): Promise<Result<RentOfferingDTO | null>> => {
  const result = await apiGet<unknown>(
    `/property/unit/${encodeURIComponent(unitId)}/rent-offering`,
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

export const updateRentOffering = async (
  unitId: string,
  body: UpdateRentOfferingDTO,
): Promise<Result<RentOfferingDTO | null>> => {
  const result = await apiPatch<unknown>(
    `/property/unit/${encodeURIComponent(unitId)}/rent-offering`,
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

export const deleteRentOffering = async (
  unitId: string,
): Promise<Result<null>> => {
  const result = await apiDelete<unknown>(
    `/property/unit/${encodeURIComponent(unitId)}/rent-offering`,
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
