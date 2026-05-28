import { apiPost } from "@/lib/apiClient";
import { amenitySchema, type AmenityDTO } from "./amenities.schema";

export type AmenityBody = {
  name: string;
  description?: string;
};

export type AmenityMutationResult =
  | { success: true; data: AmenityDTO | unknown }
  | { success: false; error: string; statusCode?: number };

export const createAmenity = async (
  body: AmenityBody,
): Promise<AmenityMutationResult> => {
  const result = await apiPost<unknown>("/amenities", body);
  if (!result.success) return result;
  const parsed = amenitySchema.safeParse(
    (result.data as { data?: unknown })?.data ?? result.data,
  );
  return { success: true, data: parsed.success ? parsed.data : result.data };
};
