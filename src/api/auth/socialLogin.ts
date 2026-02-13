import { apiPost } from "@/lib/apiClient";

import type { SocialLoginRequestDTO, SocialLoginResponseDTO, NewLoginResponseDTO } from "./auth.schema";
import { newLoginResponseSchema } from "./auth.schema";

type SocialLoginResult = 
  | { success: true; data: SocialLoginResponseDTO }
  | { success: false; error: string };

export const googleLogin = async (
  data: SocialLoginRequestDTO
): Promise<SocialLoginResult> => {
  const result = await apiPost<NewLoginResponseDTO>("/auth/google-login", data, {
    skipAuth: true,
  });

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = newLoginResponseSchema.parse(result.data);
    // Store access token in localStorage
    if (typeof window !== "undefined" && parsed.data.accessToken) {
      localStorage.setItem("accessToken", parsed.data.accessToken);
      localStorage.setItem("authToken", parsed.data.accessToken);
    }
    return { success: true, data: parsed };
  } catch (parseError) {
    console.error("Google login schema validation error:", parseError);
    console.error("Received data:", JSON.stringify(result.data, null, 2));
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};

export const facebookLogin = async (
  data: SocialLoginRequestDTO
): Promise<SocialLoginResult> => {
  const result = await apiPost<NewLoginResponseDTO>("/auth/facebook-login", data, {
    skipAuth: true,
  });

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = newLoginResponseSchema.parse(result.data);
    // Store access token in localStorage
    if (typeof window !== "undefined" && parsed.data.accessToken) {
      localStorage.setItem("accessToken", parsed.data.accessToken);
      localStorage.setItem("authToken", parsed.data.accessToken);
    }
    return { success: true, data: parsed };
  } catch (parseError) {
    console.error("Facebook login schema validation error:", parseError);
    console.error("Received data:", JSON.stringify(result.data, null, 2));
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};

