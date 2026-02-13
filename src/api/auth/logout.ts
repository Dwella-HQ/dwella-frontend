import { apiDelete } from "@/lib/apiClient";

import type { LogoutResponseDTO } from "./auth.schema";
import { logoutResponseSchema } from "./auth.schema";

type LogoutResult = 
  | { success: true; data: LogoutResponseDTO }
  | { success: false; error: string };

export const logout = async (userId: string | number): Promise<LogoutResult> => {
  const result = await apiDelete<LogoutResponseDTO>(`/auth/logout/${userId}`);

  if (!result.success) {
    return result;
  }

  // Clear tokens from localStorage
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authToken");
  }

  // Validate response with Zod
  try {
    const parsed = logoutResponseSchema.parse(result.data);
    return { success: true, data: parsed };
  } catch (parseError) {
    console.error("Logout schema validation error:", parseError);
    // Even if schema validation fails, logout is successful if we cleared tokens
    return {
      success: true,
      data: { success: true, message: "Logged out successfully" },
    };
  }
};





