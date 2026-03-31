import { apiGet } from "@/lib/apiClient";
import type { ApiResult } from "./deposit.schema";

export type GetDepositByReferenceResult = ApiResult<unknown>;

export const getDepositByReference = async (
  reference: string,
): Promise<GetDepositByReferenceResult> => {
  return apiGet<unknown>(`/deposit/reference/${encodeURIComponent(reference)}`);
};
