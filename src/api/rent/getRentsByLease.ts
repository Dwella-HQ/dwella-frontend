import { apiGet } from "@/lib/apiClient";
import type { RentItemDTO } from "./rent.schema";
import { rentItemSchema, rentsResponseSchema } from "./rent.schema";
import { filterRentsForActiveLeaseId } from "./filterRentsForActiveLease";

/**
 * Dev API returns all rents from this fixed path (OpenAPI placeholder was never
 * wired as a real path param). Do not substitute the tenant's UUID here.
 */
export const RENT_LEASE_AGGREGATE_PATH = "/rent/lease/leaseId";

type GetRentsByLeaseResult =
  | { success: true; data: RentItemDTO[] }
  | { success: false; error: string; statusCode?: number };

function normalizeToRentItems(raw: unknown): RentItemDTO[] {
  const parsed = rentsResponseSchema.safeParse(raw);
  if (parsed.success) {
    const d = parsed.data.data;
    if (Array.isArray(d)) return d;
    if (d) return [d];
    return [];
  }

  let body: unknown = raw;
  if (
    body &&
    typeof body === "object" &&
    "data" in body &&
    !Array.isArray(body)
  ) {
    body = (body as { data: unknown }).data;
  }
  if (Array.isArray(body)) {
    return body
      .map((item) => rentItemSchema.safeParse(item))
      .filter((r): r is { success: true; data: RentItemDTO } => r.success)
      .map((r) => r.data);
  }
  const one = rentItemSchema.safeParse(body);
  return one.success ? [one.data] : [];
}

/**
 * Fetches the global rents list from the aggregate endpoint, then keeps rows
 * for `activeLeaseId` with an active nested lease when present.
 */
/** Full list from `GET /rent/lease/leaseId` (all leases); filter in the UI. */
export type GetAggregatedRentsResult =
  | { success: true; data: RentItemDTO[] }
  | { success: false; error: string; statusCode?: number };

export const getAggregatedRents =
  async (): Promise<GetAggregatedRentsResult> => {
    const result = await apiGet<unknown>(RENT_LEASE_AGGREGATE_PATH);
    if (!result.success) return result;

    try {
      const items = normalizeToRentItems(result.data);
      return { success: true, data: items };
    } catch (error) {
      console.error("Get aggregated rents parse error:", error);
      return {
        success: false,
        error: "Invalid response data format received",
      };
    }
  };

export const getRentsByLease = async (
  activeLeaseId: string,
): Promise<GetRentsByLeaseResult> => {
  const result = await getAggregatedRents();
  if (!result.success) return result;

  try {
    const filtered = filterRentsForActiveLeaseId(result.data, activeLeaseId);
    return { success: true, data: filtered };
  } catch (error) {
    console.error("Get rents by lease parse error:", error);
    return { success: false, error: "Invalid response data format received" };
  }
};
