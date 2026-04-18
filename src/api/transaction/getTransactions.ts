import { apiGet } from "@/lib/apiClient";

import { parseTransactionList } from "./parseTransactions";
import type { TransactionDTO } from "./transaction.schema";

type GetTransactionsResult =
  | { success: true; data: TransactionDTO[] }
  | { success: false; error: string };

/** `GET /transaction` (see ENDPOINTS.md) */
export const getTransactions = async (): Promise<GetTransactionsResult> => {
  const result = await apiGet<unknown>("/transaction");

  if (!result.success) {
    return result;
  }

  try {
    const rows = parseTransactionList(result.data);
    return { success: true, data: rows };
  } catch (e) {
    console.error("Get transactions parse error:", e);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};
