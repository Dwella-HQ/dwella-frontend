import { createUrl } from "@/utils/createUrl";
import { apiGet } from "@/lib/apiClient";
import { mapAndSortRecentPayments } from "./mapRentPaymentItems";
import { rentPaymentItemSchema, type RentPaymentItemDTO } from "./rentPayment.schema";
import type { Payment } from "@/data/mockLandlordData";

export type GetRentPaymentsParams = {
  page?: number;
  limit?: number;
};

type GetRentPaymentsResult =
  | { success: true; data: Payment[] }
  | { success: false; error: string };

export type GetRentPaymentItemsResult =
  | { success: true; data: RentPaymentItemDTO[] }
  | { success: false; error: string };

function extractRawItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    const data = p.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      if (Array.isArray(d.items)) return d.items;
      if (Array.isArray(d.rentPayments)) return d.rentPayments;
      if (Array.isArray(d.data)) return d.data;
    }
  }
  return [];
}

function parseItems(raw: unknown[]): RentPaymentItemDTO[] {
  const out: RentPaymentItemDTO[] = [];
  for (const row of raw) {
    const parsed = rentPaymentItemSchema.safeParse(row);
    if (parsed.success) {
      out.push(parsed.data);
    }
  }
  return out;
}

/** Parsed rent-payment rows (not mapped to dashboard `Payment` UI shape). */
export const getRentPaymentItems = async (
  params?: GetRentPaymentsParams,
): Promise<GetRentPaymentItemsResult> => {
  const url = createUrl(
    "/rent-payment",
    params as Record<string, string | number>,
  );
  const result = await apiGet<unknown>(url);

  if (!result.success) {
    return result;
  }

  try {
    const rawItems = extractRawItems(result.data);
    const items = parseItems(rawItems);
    return { success: true, data: items };
  } catch (parseError) {
    console.error("Get rent payment items parse error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};

export const getRentPayments = async (
  params?: GetRentPaymentsParams,
): Promise<GetRentPaymentsResult> => {
  try {
    const itemsResult = await getRentPaymentItems(params);
    if (!itemsResult.success) {
      return itemsResult;
    }
    return {
      success: true,
      data: mapAndSortRecentPayments(itemsResult.data),
    };
  } catch (parseError) {
    console.error("Get rent payments parse error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};
