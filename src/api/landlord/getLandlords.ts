import { apiGet } from "@/lib/apiClient";

import type { LandlordsResponseDTO, LandlordDTO } from "./landlord.schema";
import { landlordsResponseSchema } from "./landlord.schema";

type GetLandlordsResult = 
  | { success: true; data: LandlordDTO[] }
  | { success: false; error: string };

export const getLandlords = async (): Promise<GetLandlordsResult> => {
  const result = await apiGet<LandlordsResponseDTO>("/landlord");

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = landlordsResponseSchema.parse(result.data);
    // Handle both array response and object with data array
    const landlords = Array.isArray(parsed.data) ? parsed.data : parsed.data || [];
    return { success: true, data: landlords };
  } catch (parseError) {
    console.error("Get landlords schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





