import { apiGet } from "@/lib/apiClient";

import type { LandlordResponseDTO, LandlordDTO } from "./landlord.schema";
import { landlordResponseSchema } from "./landlord.schema";

type GetLandlordByUserResult = 
  | { success: true; data: LandlordDTO }
  | { success: false; error: string; statusCode?: number };

export const getLandlordByUser = async (userId: string): Promise<GetLandlordByUserResult> => {
  const result = await apiGet<LandlordResponseDTO>(`/landlord/user/${userId}`);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode,
    };
  }

  // Validate response with Zod
  try {
    const parsed = landlordResponseSchema.parse(result.data);
    // Handle both direct landlord object and object with data property
    const landlord = parsed.data || (parsed as unknown as LandlordDTO);
    return { success: true, data: landlord };
  } catch (parseError) {
    console.error("Get landlord by user schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





