import { apiPost } from "@/lib/apiClient";
import { parseResolveAccountResponse } from "./parseResolveAccountResponse";
import type {
  ApiResult,
  WithdrawalRecipientDetailsDTO,
  WithdrawalResolveAccountDTO,
} from "./withdrawal.schema";

export type ResolveWithdrawalAccountResult =
  ApiResult<WithdrawalRecipientDetailsDTO>;

export const resolveWithdrawalAccount = async (
  payload: WithdrawalResolveAccountDTO,
): Promise<ResolveWithdrawalAccountResult> => {
  const result = await apiPost<unknown>(`/withdrawal/resolve-account`, payload);
  if (!result.success) return result;

  const parsed = parseResolveAccountResponse(result.data);
  if (!parsed) {
    return {
      success: false,
      error:
        "Could not read account details from the server. Please try again.",
    };
  }

  return { success: true, data: parsed };
};
