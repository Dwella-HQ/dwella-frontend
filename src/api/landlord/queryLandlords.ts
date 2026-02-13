import { createUrl } from "@/utils/createUrl";
import { apiGet } from "@/lib/apiClient";

import type { LandlordsResponseDTO, LandlordDTO } from "./landlord.schema";
import { landlordsResponseSchema } from "./landlord.schema";

type QueryLandlordsParams = {
  name?: string;
  email?: string;
  page?: number;
  limit?: number;
};

type QueryLandlordsResult = 
  | { success: true; data: LandlordDTO[] }
  | { success: false; error: string };

export const queryLandlords = async (params?: QueryLandlordsParams): Promise<QueryLandlordsResult> => {
  const url = createUrl("/landlord/query", params);

  const result = await apiGet<LandlordsResponseDTO>(url);

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
    console.error("Query landlords schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





