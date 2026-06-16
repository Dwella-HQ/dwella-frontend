import { apiGet } from "@/lib/apiClient";

import type { LandlordDTO } from "./landlord.schema";
import { parseLandlordListApiResponse } from "./parseLandlordApiResponse";

type GetLandlordsResult = 
  | { success: true; data: LandlordDTO[] }
  | { success: false; error: string };

export const getLandlords = async (): Promise<GetLandlordsResult> => {
  const result = await apiGet<unknown>("/landlord");

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = parseLandlordListApiResponse(result.data);
    const failed = parsed.find((item) => !item.success);
    if (failed && !failed.success) {
      throw new Error(failed.error);
    }
    const landlords = parsed.flatMap((item) =>
      item.success ? [item.data] : [],
    );
    return { success: true, data: landlords };
  } catch (parseError) {
    console.error("Get landlords schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};



