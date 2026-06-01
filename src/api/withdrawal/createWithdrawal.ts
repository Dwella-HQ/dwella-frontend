import { apiPost } from "@/lib/apiClient";
import type { ApiResult, WithdrawalCreateDTO } from "./withdrawal.schema";

/** Filter DevTools by this string when debugging withdrawal creates. */
export const WITHDRAWAL_CREATE_LOG = "[Dwelliva · POST /withdrawal]";

export function generateWithdrawalIdempotencyKey() {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export type CreateWithdrawalResult = ApiResult<unknown>;

export const createWithdrawal = async (
  payload: WithdrawalCreateDTO,
  options?: { idempotencyKey?: string; skipAuth?: boolean },
): Promise<CreateWithdrawalResult> => {
  const idempotencyKey =
    options?.idempotencyKey?.trim() || generateWithdrawalIdempotencyKey();

  if (typeof window !== "undefined") {
    console.info(WITHDRAWAL_CREATE_LOG, "request", {
      body: payload,
      headers: { "Idempotency-Key": idempotencyKey },
    });
  }

  const result = await apiPost<unknown>("/withdrawal", payload, {
    skipAuth: options?.skipAuth,
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
  });

  if (typeof window !== "undefined") {
    console.info(
      WITHDRAWAL_CREATE_LOG,
      "response",
      result.success
        ? { success: true, data: result.data }
        : {
            success: false,
            error: result.error,
            statusCode: result.statusCode,
          },
    );
  }

  return result;
};
