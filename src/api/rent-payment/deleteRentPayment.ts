import { apiDelete } from "@/lib/apiClient";

export type DeleteRentPaymentResult =
  | { success: true; data: unknown }
  | { success: false; error: string; statusCode?: number };

export const deleteRentPayment = async (
  id: string,
): Promise<DeleteRentPaymentResult> => {
  return apiDelete<unknown>(`/rent-payment/${encodeURIComponent(id)}`);
};
