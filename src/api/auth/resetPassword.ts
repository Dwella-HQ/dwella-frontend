import { apiPost } from "@/lib/apiClient";

import type { ResetPasswordRequestDTO, ResetPasswordResponseDTO } from "./auth.schema";
import { resetPasswordResponseSchema } from "./auth.schema";

const RESET_PASSWORD_ROUTE = "/auth/reset-password";

type ResetPasswordResult = 
  | { success: true; data: ResetPasswordResponseDTO }
  | { success: false; error: string };

export const resetPassword = async (
  credentials: ResetPasswordRequestDTO
): Promise<ResetPasswordResult> => {
  const result = await apiPost<ResetPasswordResponseDTO>(
    RESET_PASSWORD_ROUTE,
    credentials,
    {
      skipAuth: true,
    }
  );

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = resetPasswordResponseSchema.parse(result.data);
    return { success: true, data: parsed };
  } catch (parseError) {
    console.error("Reset password schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};

