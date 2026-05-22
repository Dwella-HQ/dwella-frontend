import { apiGet } from "@/lib/apiClient";

import type { LandlordResponseDTO, LandlordDTO } from "./landlord.schema";
import { parseLandlordApiResponse } from "./parseLandlordApiResponse";

type GetLandlordByUserResult =
  | { success: true; data: LandlordDTO }
  | { success: false; error: string; statusCode?: number };

export const getLandlordByUser = async (
  userId: string,
): Promise<GetLandlordByUserResult> => {
  const result = await apiGet<LandlordResponseDTO>(`/landlord/user/${userId}`);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode,
    };
  }

  const parsed = parseLandlordApiResponse(result.data);
  if (!parsed.success) {
    console.error(
      "Get landlord by user schema validation error:",
      parsed.error,
    );
    return { success: false, error: parsed.error };
  }

  return { success: true, data: parsed.data };
};
