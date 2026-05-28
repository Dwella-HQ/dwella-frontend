import { apiGet } from "@/lib/apiClient";

export type GetTransactionSuccessResult =
  | { success: true; data: unknown }
  | { success: false; error: string; statusCode?: number };

export const getTransactionSuccess = async (
  amount: string | number,
): Promise<GetTransactionSuccessResult> => {
  const qs = new URLSearchParams({ amount: String(amount) });
  return apiGet<unknown>(`/transaction/success?${qs.toString()}`);
};
