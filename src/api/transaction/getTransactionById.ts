import { apiGet } from "@/lib/apiClient";

import { transactionSchema } from "./transaction.schema";
import type { TransactionDTO } from "./transaction.schema";

function unwrapOne(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const o = raw as Record<string, unknown>;
  const d = o.data;
  if (d !== undefined && d !== null && typeof d === "object" && !Array.isArray(d)) {
    return d;
  }
  return raw;
}

type Result =
  | { success: true; data: TransactionDTO }
  | { success: false; error: string };

/** `GET /transaction/{id}` (ENDPOINTS.md) */
export const getTransactionById = async (id: string): Promise<Result> => {
  const trimmed = id.trim();
  if (!trimmed) {
    return { success: false, error: "Missing transaction id" };
  }

  const result = await apiGet<unknown>(
    `/transaction/${encodeURIComponent(trimmed)}`,
  );

  if (!result.success) {
    return result;
  }

  try {
    const payload = unwrapOne(result.data);
    const parsed = transactionSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: "Invalid transaction response" };
    }
    return { success: true, data: parsed.data };
  } catch (e) {
    console.error("getTransactionById parse error:", e);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};
