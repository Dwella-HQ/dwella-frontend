import { apiPost } from "@/lib/apiClient";

// Local ApiResult shape (keeps this file dependency-free).
type ApiResultLocal<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number };

export type SubmitWalletBvnResult = ApiResultLocal<unknown>;

export const submitWalletBvn = async (
  walletId: string,
  payload: { bvn: string },
): Promise<SubmitWalletBvnResult> => {
  // Contract: POST /wallet/{id}/bvn with { bvn }
  return apiPost<unknown>(`/wallet/${walletId}/bvn`, payload);
};
