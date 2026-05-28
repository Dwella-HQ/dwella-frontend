import { apiDelete } from "@/lib/apiClient";

export type DeleteAddressResult =
  | { success: true; data: unknown }
  | { success: false; error: string; statusCode?: number };

export const deleteAddress = async (
  id: string,
): Promise<DeleteAddressResult> => {
  return apiDelete<unknown>(`/address/${encodeURIComponent(id)}`);
};
