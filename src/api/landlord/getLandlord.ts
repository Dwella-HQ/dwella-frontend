import { apiGet } from "@/lib/apiClient";

import type { LandlordResponseDTO, LandlordDTO } from "./landlord.schema";
import { parseLandlordApiResponse } from "./parseLandlordApiResponse";

type GetLandlordResult =
  | { success: true; data: LandlordDTO }
  | { success: false; error: string; statusCode?: number };

export const getLandlord = async (id: string): Promise<GetLandlordResult> => {
  const result = await apiGet<LandlordResponseDTO>(`/landlord/${id}`);

  if (!result.success) {
    return result;
  }

  const parsed = parseLandlordApiResponse(result.data);
  if (!parsed.success) {
    console.error("Get landlord schema validation error:", parsed.error);
    return { success: false, error: parsed.error };
  }

  return { success: true, data: parsed.data };
};
