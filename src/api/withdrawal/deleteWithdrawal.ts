import { apiDelete } from "@/lib/apiClient";
import type { ApiResult } from "./withdrawal.schema";

export type DeleteWithdrawalResult = ApiResult<unknown>;

export const deleteWithdrawal = async (
  id: string,
): Promise<DeleteWithdrawalResult> => {
  return apiDelete<unknown>(`/withdrawal/${id}`);
};
