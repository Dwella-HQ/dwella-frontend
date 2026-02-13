import { createUrl } from "@/utils/createUrl";
import { apiGet } from "@/lib/apiClient";

import type { VerificationsResponseDTO, VerificationDTO } from "./verification.schema";
import { verificationsResponseSchema } from "./verification.schema";

type QueryVerificationsParams = {
  landlordId?: string;
  status?: "VERIFIED" | "PENDING" | "REJECTED";
  page?: number;
  limit?: number;
};

type QueryVerificationsResult = 
  | { success: true; data: VerificationDTO[] }
  | { success: false; error: string };

export const queryVerifications = async (
  params?: QueryVerificationsParams
): Promise<QueryVerificationsResult> => {
  const url = createUrl("/verification/query", params);

  const result = await apiGet<VerificationsResponseDTO>(url);

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = verificationsResponseSchema.parse(result.data);
    // Handle both array response and object with data array
    const verifications = Array.isArray(parsed.data) ? parsed.data : parsed.data || [];
    return { success: true, data: verifications };
  } catch (parseError) {
    console.error("Query verifications schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





