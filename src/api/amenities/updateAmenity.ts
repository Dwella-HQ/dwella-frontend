import { apiPatch } from "@/lib/apiClient";
import { amenitySchema, type AmenityDTO } from "./amenities.schema";
import type { AmenityBody } from "./createAmenity";

export type UpdateAmenityResult =
  | { success: true; data: AmenityDTO | unknown }
  | { success: false; error: string; statusCode?: number };

export const updateAmenity = async (
  id: string,
  body: Partial<AmenityBody>,
): Promise<UpdateAmenityResult> => {
  const result = await apiPatch<unknown>(
    `/amenities/${encodeURIComponent(id)}`,
    body,
  );
  if (!result.success) return result;
  const parsed = amenitySchema.safeParse(
    (result.data as { data?: unknown })?.data ?? result.data,
  );
  return { success: true, data: parsed.success ? parsed.data : result.data };
};
