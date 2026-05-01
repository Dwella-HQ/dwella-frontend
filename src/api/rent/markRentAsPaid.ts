import { apiPatch } from "@/lib/apiClient";
import type { RentItemDTO } from "./rent.schema";
import { rentItemSchema } from "./rent.schema";

type MarkRentAsPaidResult =
  | { success: true; data?: RentItemDTO }
  | { success: false; error: string; statusCode?: number };

export const markRentAsPaid = async (
  rentId: string,
): Promise<MarkRentAsPaidResult> => {
  const result = await apiPatch<unknown>(
    `/rent/${encodeURIComponent(rentId)}/status/paid`,
    {},
  );
  if (!result.success) return result;

  try {
    const raw = result.data as Record<string, unknown> | undefined;
    const inner =
      raw && typeof raw === "object" && "data" in raw
        ? (raw as { data: unknown }).data
        : raw;
    if (inner && typeof inner === "object") {
      return { success: true, data: rentItemSchema.parse(inner) };
    }
  } catch {
    /* 200 with empty or non-standard body */
  }
  return { success: true, data: undefined };
};
