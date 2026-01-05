import { createUrl } from "@/utils/createUrl";

import type { PasswordResetRequestDTO, PasswordResetResponseDTO } from "./auth.schema";
import { passwordResetResponseSchema } from "./auth.schema";

const PASSWORD_RESET_ROUTE = "/partners/auth/password-request";

type PasswordResetResult = 
  | { success: true; data: PasswordResetResponseDTO }
  | { success: false; error: string };

export const requestPasswordReset = async (
  email: PasswordResetRequestDTO
): Promise<PasswordResetResult> => {
  try {
    const url = createUrl(PASSWORD_RESET_ROUTE);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(email),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Password reset request failed: ${response.statusText}`,
      };
    }

    const payload = await response.json();
    
    // Wrap Zod parsing in try-catch to handle schema validation errors
    try {
      const parsed = passwordResetResponseSchema.parse(payload);
      return { success: true, data: parsed };
    } catch (parseError) {
      console.error("Password reset request schema validation error:", parseError);
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

