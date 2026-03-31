import { apiPost } from "@/lib/apiClient";
import type { ApiResult, WithdrawalCreateDTO } from "./withdrawal.schema";

function generateIdempotencyKey() {
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
  const idempotencyKey = options?.idempotencyKey || generateIdempotencyKey();

  const result = await apiPost<unknown>("/withdrawal", payload, {
    skipAuth: options?.skipAuth,
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
  });

  return result;
};
