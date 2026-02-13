import { createUrl } from "@/utils/createUrl";
import { apiGet } from "@/lib/apiClient";

import type { PasswordResetRequestDTO, PasswordResetResponseDTO } from "./auth.schema";
import { passwordResetResponseSchema } from "./auth.schema";

type PasswordResetResult = 
  | { success: true; data: PasswordResetResponseDTO }
  | { success: false; error: string };

export const requestPasswordReset = async (
  email: PasswordResetRequestDTO
): Promise<PasswordResetResult> => {
  const url = createUrl("/auth/forgot-password", {
    email: email.email,
  });

  const result = await apiGet<PasswordResetResponseDTO>(url, {
    skipAuth: true,
  });

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = passwordResetResponseSchema.parse(result.data);
    return { success: true, data: parsed };
  } catch (parseError) {
    console.error("Password reset request schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};

