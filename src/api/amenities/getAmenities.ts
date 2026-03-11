import { apiGet } from "@/lib/apiClient";
import {
  amenitiesResponseSchema,
  type AmenityDTO,
  type AmenitiesResponseDTO,
} from "./amenities.schema";

export type GetAmenitiesResult =
  | { success: true; data: AmenityDTO[] }
  | { success: false; error: string };

export type GetAmenitiesOptions = {
  /** Set true for public pages (e.g. landing) where user may not be logged in */
  skipAuth?: boolean;
};

export const getAmenities = async (
  options?: GetAmenitiesOptions,
): Promise<GetAmenitiesResult> => {
  const result = await apiGet<AmenitiesResponseDTO>("/amenities", {
    skipAuth: options?.skipAuth ?? false,
  });

  if (!result.success) {
    return result;
  }

  try {
    const parsed = amenitiesResponseSchema.parse(result.data);
    const list = Array.isArray(parsed.data) ? parsed.data : [];
    return { success: true, data: list };
  } catch (parseError) {
    console.error("Get amenities schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};
