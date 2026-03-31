import { apiGet } from "@/lib/apiClient";
import type { ApiResult } from "./deposit.schema";

export type GetDepositByIdResult = ApiResult<unknown>;

export const getDepositById = async (
  id: string,
): Promise<GetDepositByIdResult> => {
  return apiGet<unknown>(`/deposit/${id}`);
};
