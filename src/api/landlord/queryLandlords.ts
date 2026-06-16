import { createUrl } from "@/utils/createUrl";
import { apiGet } from "@/lib/apiClient";

import type { LandlordDTO } from "./landlord.schema";
import { parseLandlordListApiResponse } from "./parseLandlordApiResponse";

type QueryLandlordsParams = {
  name?: string;
  email?: string;
  userId?: string;
  landlordId?: string;
  landLordName?: string;
  isApproved?: boolean;
  isActive?: boolean;
  cursor?: string;
  page?: number;
  limit?: number;
};

type QueryLandlordsResult = 
  | { success: true; data: LandlordDTO[] }
  | { success: false; error: string };

export const queryLandlords = async (params?: QueryLandlordsParams): Promise<QueryLandlordsResult> => {
  const url = createUrl("/landlord/query", params);

  const result = await apiGet<unknown>(url);

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
    console.error("Query landlords schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};



