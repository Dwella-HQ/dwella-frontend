import { apiPost } from "@/lib/apiClient";
import {
  extractRefreshTokenFromAuthPayload,
  persistLoginSessionTokens,
} from "@/lib/authRefresh";

import type {
  SocialLoginRequestDTO,
  SocialLoginResponseDTO,
  NewLoginResponseDTO,
} from "./auth.schema";
import { newLoginResponseSchema } from "./auth.schema";

type SocialLoginResult =
  | { success: true; data: SocialLoginResponseDTO }
  | { success: false; error: string };

function maskToken(token: string): string {
  if (!token) return "";
  if (token.length <= 10) return "***";
  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}

export const googleLogin = async (
  data: SocialLoginRequestDTO,
): Promise<SocialLoginResult> => {
  // Log (masked) request payload for debugging
  console.log("POST /auth/google-login payload:", {
    ...data,
    token: maskToken(data.token),
  });

  const result = await apiPost<NewLoginResponseDTO>(
    "/auth/google-login",
    data,
    {
      skipAuth: true,
    },
  );

  if (!result.success) {
    console.log("POST /auth/google-login response (error):", result);
    return result;
  }

  // Validate response with Zod
  try {
    console.log("POST /auth/google-login response (raw):", result.data);
    const parsed = newLoginResponseSchema.parse(result.data);
    if (typeof window !== "undefined" && parsed.data.accessToken) {
      const refreshToken = extractRefreshTokenFromAuthPayload(result.data);
      persistLoginSessionTokens(parsed.data.accessToken, refreshToken);
    }
    console.log("POST /auth/google-login response (parsed):", {
      success: parsed.success,
      message: parsed.message,
      accessToken: parsed.data.accessToken
        ? maskToken(parsed.data.accessToken)
        : "",
      userId: parsed.data.user?.id,
      roleName: parsed.data.user?.role?.name,
    });
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
  data: SocialLoginRequestDTO,
): Promise<SocialLoginResult> => {
  const result = await apiPost<NewLoginResponseDTO>(
    "/auth/facebook-login",
    data,
    {
      skipAuth: true,
    },
  );

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = newLoginResponseSchema.parse(result.data);
    if (typeof window !== "undefined" && parsed.data.accessToken) {
      const refreshToken = extractRefreshTokenFromAuthPayload(result.data);
      persistLoginSessionTokens(parsed.data.accessToken, refreshToken);
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
