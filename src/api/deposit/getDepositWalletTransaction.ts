import { apiGet } from "@/lib/apiClient";
import type { ApiResult } from "./deposit.schema";

export type GetDepositWalletTransactionResult = ApiResult<unknown>;

export const getDepositWalletTransaction = async (
  walletTransactionId: string,
): Promise<GetDepositWalletTransactionResult> => {
  return apiGet<unknown>(
    `/deposit/wallet-transaction/${encodeURIComponent(walletTransactionId)}`,
  );
};
