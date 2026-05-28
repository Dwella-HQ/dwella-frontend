import { apiGet } from "@/lib/apiClient";

export type GetRentPaymentByIdResult =
  | { success: true; data: unknown }
  | { success: false; error: string; statusCode?: number };

export const getRentPaymentById = async (
  id: string,
): Promise<GetRentPaymentByIdResult> => {
  return apiGet<unknown>(`/rent-payment/${encodeURIComponent(id)}`);
};
