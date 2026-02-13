import { apiGet } from "@/lib/apiClient";

import type { VerificationsResponseDTO, VerificationDTO } from "./verification.schema";
import { verificationsResponseSchema } from "./verification.schema";

type GetVerificationsResult = 
  | { success: true; data: VerificationDTO[] }
  | { success: false; error: string };

export const getVerifications = async (): Promise<GetVerificationsResult> => {
  const result = await apiGet<VerificationsResponseDTO>("/verification");

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
    console.error("Get verifications schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





