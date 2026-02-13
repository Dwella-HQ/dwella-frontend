import { apiPatch } from "@/lib/apiClient";

import type { UpdateVerificationStatusRequestDTO, VerificationResponseDTO, VerificationDTO } from "./verification.schema";
import { verificationResponseSchema } from "./verification.schema";

type UpdateVerificationStatusResult = 
  | { success: true; data: VerificationDTO }
  | { success: false; error: string };

export const updateVerificationStatus = async (
  id: string,
  data: UpdateVerificationStatusRequestDTO
): Promise<UpdateVerificationStatusResult> => {
  const result = await apiPatch<VerificationResponseDTO>(`/verification/${id}/landlord/status`, data);

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
    console.error("Update verification status schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





