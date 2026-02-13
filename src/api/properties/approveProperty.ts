import { apiPost } from "@/lib/apiClient";

import type { ApprovePropertyResponseDTO, PropertyDTO } from "./properties.schema";
import { approvePropertyResponseSchema } from "./properties.schema";

type ApprovePropertyResult = 
  | { success: true; data?: PropertyDTO; message: string }
  | { success: false; error: string };

export const approveProperty = async (id: string): Promise<ApprovePropertyResult> => {
  const result = await apiPost<ApprovePropertyResponseDTO>(`/property/${id}/approve`, {});

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = approvePropertyResponseSchema.parse(result.data);
    return {
      success: true,
      data: parsed.data,
      message: parsed.message,
    };
  } catch (parseError) {
    console.error("Approve property schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





