import { apiGet } from "@/lib/apiClient";
import type { ApiResult } from "./withdrawal.schema";

export type GetWithdrawalQueuesResult = ApiResult<unknown>;

/** Lists queued withdrawal requests — `GET {{baseUrl}}/queues` */
export const getWithdrawalQueues = async (
  walletId?: string,
): Promise<GetWithdrawalQueuesResult> => {
  const query =
    walletId != null && walletId !== ""
      ? `?walletId=${encodeURIComponent(walletId)}`
      : "";
  return apiGet<unknown>(`/queues${query}`);
};
