import { apiGet } from "@/lib/apiClient";
import { amenitySchema, type AmenityDTO } from "./amenities.schema";

export type GetAmenityResult =
  | { success: true; data: AmenityDTO | unknown }
  | { success: false; error: string; statusCode?: number };

export const getAmenity = async (id: string): Promise<GetAmenityResult> => {
  const result = await apiGet<unknown>(`/amenities/${encodeURIComponent(id)}`);
  if (!result.success) return result;
  const parsed = amenitySchema.safeParse(
    (result.data as { data?: unknown })?.data ?? result.data,
  );
  return { success: true, data: parsed.success ? parsed.data : result.data };
};
