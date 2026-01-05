import { createUrl } from "@/utils/createUrl";

import type { ChangePasswordRequestDTO, ChangePasswordResponseDTO } from "./auth.schema";
import { changePasswordResponseSchema } from "./auth.schema";

const CHANGE_PASSWORD_ROUTE = "/partners/settings/change-password";

type ChangePasswordResult = 
  | { success: true; data: ChangePasswordResponseDTO }
  | { success: false; error: string };

export const changePassword = async (
  token: string,
  credentials: ChangePasswordRequestDTO
): Promise<ChangePasswordResult> => {
  try {
    const url = createUrl(CHANGE_PASSWORD_ROUTE);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Password change failed: ${response.statusText}`,
      };
    }

    const payload = await response.json();
    
    // Wrap Zod parsing in try-catch to handle schema validation errors
    try {
      const parsed = changePasswordResponseSchema.parse(payload);
      return { success: true, data: parsed };
    } catch (parseError) {
      console.error("Change password schema validation error:", parseError);
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

