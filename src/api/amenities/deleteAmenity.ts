import { apiDelete } from "@/lib/apiClient";

export type DeleteAmenityResult =
  | { success: true; data: unknown }
  | { success: false; error: string; statusCode?: number };

export const deleteAmenity = async (
  id: string,
): Promise<DeleteAmenityResult> => {
  return apiDelete<unknown>(`/amenities/${encodeURIComponent(id)}`);
};
