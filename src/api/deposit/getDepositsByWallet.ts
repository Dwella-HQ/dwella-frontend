import { apiGet } from "@/lib/apiClient";
import type { ApiResult, DepositItemDTO } from "./deposit.schema";

export type GetDepositsByWalletResult = ApiResult<DepositItemDTO[]>;

export const getDepositsByWallet = async (
  walletId: string,
): Promise<GetDepositsByWalletResult> => {
  const result = await apiGet<unknown>(`/deposit/wallet/${walletId}`);
  if (!result.success) return result as GetDepositsByWalletResult;

  const payload = result.data as any;
  const list =
    (payload?.data && Array.isArray(payload.data) && payload.data) ||
    (payload?.transactions &&
      Array.isArray(payload.transactions) &&
      payload.transactions) ||
    (payload && Array.isArray(payload) && payload) ||
    [];

  return { success: true, data: list as DepositItemDTO[] };
};
