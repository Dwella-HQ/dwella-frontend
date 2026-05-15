import { apiGet } from "@/lib/apiClient";
import type { ApiResult, WithdrawalBankDTO } from "./withdrawal.schema";

export type GetWithdrawalBanksResult = ApiResult<WithdrawalBankDTO[]>;

function normalizeBanksPayload(raw: unknown): WithdrawalBankDTO[] {
  if (Array.isArray(raw)) return raw as WithdrawalBankDTO[];
  const payload = raw as { data?: unknown } | null | undefined;
  const inner = payload?.data ?? raw;
  if (Array.isArray(inner)) return inner as WithdrawalBankDTO[];
  return [];
}

/** OpenAPI: `GET /withdrawal/banks?currency=` (currency required, e.g. `NGN`). */
export const getWithdrawalBanksByCurrency = async (
  currency: string = "NGN",
): Promise<GetWithdrawalBanksResult> => {
  const query = new URLSearchParams({ currency });
  const result = await apiGet<unknown>(
    `/withdrawal/banks?${query.toString()}`,
  );

  if (!result.success) return result;
  return {
    success: true,
    data: normalizeBanksPayload(result.data),
  };
};

/** OpenAPI: `GET /withdrawal/banks/{walletId}` — wallet-scoped bank list when supported. */
export const getWithdrawalBanks = async (
  walletId: string,
): Promise<GetWithdrawalBanksResult> => {
  const result = await apiGet<unknown>(`/withdrawal/banks/${walletId}`);

  if (!result.success) return result;
  return {
    success: true,
    data: normalizeBanksPayload(result.data),
  };
};
