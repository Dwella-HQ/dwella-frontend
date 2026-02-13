import { apiPost } from "@/lib/apiClient";

import type { LoginRequestDTO, NewLoginResponseDTO } from "./auth.schema";
import { newLoginResponseSchema } from "./auth.schema";

const LOGIN_ROUTE = "/auth/login";

type LoginResult = 
  | { success: true; data: NewLoginResponseDTO }
  | { success: false; error: string };

export const login = async (credentials: LoginRequestDTO): Promise<LoginResult> => {
  const result = await apiPost<NewLoginResponseDTO>(LOGIN_ROUTE, credentials, {
    skipAuth: true,
  });

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = newLoginResponseSchema.parse(result.data);
    // Store access token and user id in localStorage
    if (typeof window !== "undefined" && parsed.data.accessToken) {
      localStorage.setItem("accessToken", parsed.data.accessToken);
      localStorage.setItem("authToken", parsed.data.accessToken); // Keep for backward compatibility
      if (parsed.data.user?.id) {
        localStorage.setItem("userId", parsed.data.user.id);
      }
    }
    return { success: true, data: parsed };
  } catch (parseError) {
    console.error("Login schema validation error:", parseError);
    console.error("Received data:", JSON.stringify(result.data, null, 2));
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};

