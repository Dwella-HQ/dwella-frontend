import { apiGet } from "@/lib/apiClient";
import type { ApiResult, WithdrawalBankDTO } from "./withdrawal.schema";

export type GetWithdrawalBanksResult = ApiResult<WithdrawalBankDTO[]>;

export const getWithdrawalBanks = async (
  walletId: string,
): Promise<GetWithdrawalBanksResult> => {
  const result = await apiGet<unknown>(`/withdrawal/banks/${walletId}`);

  if (!result.success) return result;
  const payload = result.data as unknown as { data?: unknown };
  const maybeBanks =
    payload?.data ?? (result.data as unknown as WithdrawalBankDTO[]);
  return {
    success: true,
    data: maybeBanks as WithdrawalBankDTO[],
  };
};
