import { apiPost } from "@/lib/apiClient";
import type { ApiResult, DepositCreateDTO } from "./deposit.schema";

function generateIdempotencyKey() {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export type CreateDepositResult = ApiResult<unknown>;

export const createDeposit = async (
  payload: DepositCreateDTO,
  options?: { idempotencyKey?: string; skipAuth?: boolean },
): Promise<CreateDepositResult> => {
  const idempotencyKey = options?.idempotencyKey || generateIdempotencyKey();

  return apiPost<unknown>("/deposit", payload, {
    skipAuth: options?.skipAuth,
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
  });
};
