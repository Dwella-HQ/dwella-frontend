import { apiDelete } from "@/lib/apiClient";

export type DeleteTransactionResult =
  | { success: true; data: unknown }
  | { success: false; error: string; statusCode?: number };

export const deleteTransaction = async (
  id: string,
): Promise<DeleteTransactionResult> => {
  return apiDelete<unknown>(`/transaction/${encodeURIComponent(id)}`);
};
