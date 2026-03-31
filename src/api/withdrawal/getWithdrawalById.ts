import { apiGet } from "@/lib/apiClient";
import type { ApiResult } from "./withdrawal.schema";

export type GetWithdrawalByIdResult = ApiResult<unknown>;

export const getWithdrawalById = async (
  id: string,
): Promise<GetWithdrawalByIdResult> => {
  return apiGet<unknown>(`/withdrawal/${id}`);
};
