import { apiPost } from "@/lib/apiClient";

import type { VerificationDTO } from "./verification.schema";
import { parseVerificationDto } from "./parseVerification";

type CreateVerificationResult = 
  | { success: true; data: VerificationDTO }
  | { success: false; error: string };

export const createVerification = async (
  landlordId: string
): Promise<CreateVerificationResult> => {
  // Note: API has typo "lanlord" instead of "landlord"
  const result = await apiPost<unknown>(`/verification/lanlord/${landlordId}`, {});

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const verification = parseVerificationDto(result.data);
    return { success: true, data: verification };
  } catch (parseError) {
    console.warn("Create verification response was not a verification row:", parseError);
    return {
      success: true,
      data: {
        id: landlordId,
        landlordId,
        type: "LANDLORD_VERIFICATION",
        status: "PENDING",
      },
    };
  }
};



