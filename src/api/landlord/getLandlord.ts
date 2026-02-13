import { apiGet } from "@/lib/apiClient";

import type { LandlordResponseDTO, LandlordDTO } from "./landlord.schema";
import { landlordResponseSchema } from "./landlord.schema";

type GetLandlordResult = 
  | { success: true; data: LandlordDTO }
  | { success: false; error: string; statusCode?: number };

export const getLandlord = async (id: string): Promise<GetLandlordResult> => {
  const result = await apiGet<LandlordResponseDTO>(`/landlord/${id}`);

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = landlordResponseSchema.parse(result.data);
    // Handle both direct landlord object and object with data property
    const landlord = parsed.data || (parsed as unknown as LandlordDTO);
    return { success: true, data: landlord };
  } catch (parseError) {
    console.error("Get landlord schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





