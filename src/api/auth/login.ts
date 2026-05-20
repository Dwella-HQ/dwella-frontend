import { apiPost } from "@/lib/apiClient";
import {
  extractRefreshTokenFromAuthPayload,
  setStoredRefreshToken,
} from "@/lib/authRefresh";

import type { LoginRequestDTO, NewLoginResponseDTO } from "./auth.schema";
import { newLoginResponseSchema } from "./auth.schema";

const LOGIN_ROUTE = "/auth/login";

type LoginResult =
  | { success: true; data: NewLoginResponseDTO }
  | { success: false; error: string };

export const login = async (
  credentials: LoginRequestDTO,
): Promise<LoginResult> => {
  const result = await apiPost<NewLoginResponseDTO>(LOGIN_ROUTE, credentials, {
    skipAuth: true,
  });

  if (!result.success) {
    const normalizedError = (() => {
      const message = String(result.error || "").toLowerCase();
      // Some backend responses incorrectly return password-strength copy on login.
      if (message.includes("password is not strong enough")) {
        return "Incorrect password";
      }
      return result.error;
    })();
    return { ...result, error: normalizedError };
  }

  // Validate response with Zod
  try {
    const raw = result.data as {
      refreshToken?: unknown;
      authorization?: { token?: unknown };
      data?: {
        refreshToken?: unknown;
        accessToken?: unknown;
        user?: unknown;
        authorization?: { token?: unknown };
      };
    };

    // Support both current and legacy login payloads:
    // - Current: { data: { accessToken, user } }
    // - Legacy:  { data: { ...userFields, authorization: { token } } }
    const normalized = (() => {
      if (
        raw?.data &&
        typeof raw.data === "object" &&
        typeof raw.data.accessToken === "string" &&
        raw.data.user &&
        typeof raw.data.user === "object"
      ) {
        return result.data;
      }

      const legacyUser =
        raw?.data && typeof raw.data === "object" ? raw.data : null;
      const legacyToken =
        (typeof raw?.data?.authorization?.token === "string" &&
          raw.data.authorization.token) ||
        (typeof raw?.authorization?.token === "string" &&
          raw.authorization.token) ||
        (typeof raw?.data?.accessToken === "string" && raw.data.accessToken) ||
        (typeof (result.data as { accessToken?: unknown })?.accessToken ===
          "string" &&
          (result.data as { accessToken?: string }).accessToken) ||
        null;

      if (legacyUser && legacyToken) {
        return {
          success:
            (result.data as { success?: unknown })?.success === true
              ? true
              : true,
          message:
            ((result.data as { message?: unknown })?.message as string) ||
            "Login successful",
          data: {
            accessToken: legacyToken,
            user: legacyUser,
          },
        };
      }

      return result.data;
    })();

    const refreshToken = extractRefreshTokenFromAuthPayload(normalized);
    if (typeof window !== "undefined" && refreshToken) {
      setStoredRefreshToken(refreshToken);
    }

    const parsed = newLoginResponseSchema.parse(normalized);
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
