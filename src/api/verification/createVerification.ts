import { apiPost } from "@/lib/apiClient";

import type { CreateVerificationRequestDTO, VerificationResponseDTO, VerificationDTO } from "./verification.schema";
import { verificationResponseSchema } from "./verification.schema";

type CreateVerificationResult = 
  | { success: true; data: VerificationDTO }
  | { success: false; error: string };

export const createVerification = async (
  landlordId: string
): Promise<CreateVerificationResult> => {
  // Note: API has typo "lanlord" instead of "landlord"
  const result = await apiPost<VerificationResponseDTO>(`/verification/lanlord/${landlordId}`, {});

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = verificationResponseSchema.parse(result.data);
    // Handle both direct verification object and object with data property
    const verification = parsed.data || (parsed as unknown as VerificationDTO);
    return { success: true, data: verification };
  } catch (parseError) {
    console.error("Create verification schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





