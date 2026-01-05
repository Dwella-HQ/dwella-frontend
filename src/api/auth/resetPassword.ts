import { createUrl } from "@/utils/createUrl";

import type { ResetPasswordRequestDTO, ResetPasswordResponseDTO } from "./auth.schema";
import { resetPasswordResponseSchema } from "./auth.schema";

const RESET_PASSWORD_ROUTE = "/partners/auth/password-reset";

type ResetPasswordResult = 
  | { success: true; data: ResetPasswordResponseDTO }
  | { success: false; error: string };

export const resetPassword = async (
  credentials: ResetPasswordRequestDTO
): Promise<ResetPasswordResult> => {
  try {
    const url = createUrl(RESET_PASSWORD_ROUTE);

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Password reset failed: ${response.statusText}`,
      };
    }

    const payload = await response.json();
    
    // Wrap Zod parsing in try-catch to handle schema validation errors
    try {
      const parsed = resetPasswordResponseSchema.parse(payload);
      return { success: true, data: parsed };
    } catch (parseError) {
      console.error("Reset password schema validation error:", parseError);
      return {
        success: false,
        error: "Invalid response data format received",
      };
    }
  } catch (error) {
    // Handle network errors, fetch failures, etc.
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      return {
        success: false,
        error: "Network error: Unable to connect to server",
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};

