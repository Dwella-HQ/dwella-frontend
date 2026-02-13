import { createUrl } from "@/utils/createUrl";
import { apiGet } from "@/lib/apiClient";

import type { VerifyEmailRequestDTO, VerifyEmailResponseDTO } from "./auth.schema";
import { verifyEmailResponseSchema } from "./auth.schema";

type VerifyEmailResult = 
  | { success: true; data: VerifyEmailResponseDTO }
  | { success: false; error: string };

export const verifyEmail = async (
  params: VerifyEmailRequestDTO
): Promise<VerifyEmailResult> => {
  const url = createUrl("/auth/verify-email", {
    token: params.token,
    email: params.email,
  });

  // Log the payload and URL
  console.log("=== Email Verification API Call ===");
  console.log("Backend URL:", url);
  console.log("Payload (query params):", {
    token: params.token,
    email: params.email,
  });

  const result = await apiGet<VerifyEmailResponseDTO>(url, {
    skipAuth: true,
  });

  // Log the response
  console.log("Response from backend:", result);
  console.log("================================");

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = verifyEmailResponseSchema.parse(result.data);
    return { success: true, data: parsed };
  } catch (parseError) {
    console.error("Verify email schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





