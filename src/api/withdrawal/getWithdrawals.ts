import { apiGet } from "@/lib/apiClient";
import { parseWithdrawalList } from "./parseWithdrawals";
import type { ApiResult, WithdrawalItemDTO } from "./withdrawal.schema";

export type GetWithdrawalsResult = ApiResult<unknown>;
export type GetWithdrawalItemsResult = ApiResult<WithdrawalItemDTO[]>;

export const getWithdrawals = async (): Promise<GetWithdrawalsResult> => {
  return apiGet<unknown>("/withdrawal");
};

export const getWithdrawalItems =
  async (): Promise<GetWithdrawalItemsResult> => {
    const result = await getWithdrawals();

    if (!result.success) return result;

    try {
      return { success: true, data: parseWithdrawalList(result.data) };
    } catch (e) {
      console.error("Get withdrawals parse error:", e);
      return {
        success: false,
        error: "Invalid withdrawal response data format received",
      };
    }
  };
