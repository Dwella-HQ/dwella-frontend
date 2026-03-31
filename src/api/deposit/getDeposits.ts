import { apiGet } from "@/lib/apiClient";
import type { ApiResult, DepositItemDTO } from "./deposit.schema";

export type GetDepositsResult = ApiResult<DepositItemDTO[]>;

export const getDeposits = async (): Promise<GetDepositsResult> => {
  const result = await apiGet<unknown>("/deposit");
  if (!result.success)
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode,
    };

  const payload = result.data as any;
  const list =
    (payload?.data && Array.isArray(payload.data) && payload.data) ||
    (payload?.deposits &&
      Array.isArray(payload.deposits) &&
      payload.deposits) ||
    (payload?.transactions &&
      Array.isArray(payload.transactions) &&
      payload.transactions) ||
    (Array.isArray(payload) ? payload : []) ||
    [];

  return { success: true, data: list as DepositItemDTO[] };
};
