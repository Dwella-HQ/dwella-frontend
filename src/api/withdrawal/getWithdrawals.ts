import { apiGet } from "@/lib/apiClient";
import type { ApiResult, WithdrawalCreateDTO } from "./withdrawal.schema";

export type GetWithdrawalsResult = ApiResult<unknown>;

export const getWithdrawals = async (): Promise<GetWithdrawalsResult> => {
  return apiGet<unknown>("/withdrawal");
};
