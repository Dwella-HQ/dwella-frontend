import { apiPost } from "@/lib/apiClient";

export function generateRentPaymentIdempotencyKey() {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type CreateRentPaymentResult =
  | { success: true; data: unknown }
  | { success: false; error: string; statusCode?: number };

export const createRentPayment = async (
  rentId: string,
  options?: { idempotencyKey?: string },
): Promise<CreateRentPaymentResult> => {
  const idempotencyKey =
    options?.idempotencyKey || generateRentPaymentIdempotencyKey();
  return apiPost<unknown>(
    "/rent-payment",
    { rentId },
    { headers: { "Idempotency-Key": idempotencyKey } },
  );
};
