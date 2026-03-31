import { apiPatch } from "@/lib/apiClient";
import type { ApiResult, WithdrawalUpdateDTO } from "./withdrawal.schema";

export type UpdateWithdrawalResult = ApiResult<unknown>;

export const updateWithdrawal = async (
  id: string,
  payload: WithdrawalUpdateDTO,
  options?: { skipAuth?: boolean },
): Promise<UpdateWithdrawalResult> => {
  return apiPatch<unknown>(`/withdrawal/${id}`, payload, options);
};
