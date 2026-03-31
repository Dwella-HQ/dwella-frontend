import { apiPost } from "@/lib/apiClient";
import type {
  ApiResult,
  WithdrawalResolveAccountDTO,
} from "./withdrawal.schema";

export type ResolveWithdrawalAccountResult = ApiResult<unknown>;

export const resolveWithdrawalAccount = async (
  payload: WithdrawalResolveAccountDTO,
): Promise<ResolveWithdrawalAccountResult> => {
  return apiPost<unknown>(`/withdrawal/resolve-account`, payload);
};
