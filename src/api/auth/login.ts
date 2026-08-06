import { ZodError } from "zod";

import { apiPost } from "@/lib/apiClient";
import {
  extractRefreshTokenFromAuthPayload,
  setStoredRefreshToken,
} from "@/lib/authRefresh";

import type { LoginRequestDTO, NewLoginResponseDTO } from "./auth.schema";
import { newLoginResponseSchema } from "./auth.schema";

/**
 * Logs exactly what tripped up `newLoginResponseSchema.parse()` so a
 * recurrence of "Invalid response data format received" on login can be
 * root-caused from the console instead of re-diagnosed from scratch:
 * which field(s) failed, what was expected vs. received, and the full
 * raw/normalized payloads that produced the failure.
 */
function logLoginSchemaFailure(
  error: unknown,
  context: { raw: unknown; normalized: unknown },
): void {
  if (error instanceof ZodError) {
    const issues = error.issues.map((issue) => ({
      path: issue.path.join(".") || "(root)",
      code: issue.code,
      message: issue.message,
      ...("expected" in issue ? { expected: issue.expected } : {}),
      ...("received" in issue ? { received: issue.received } : {}),
    }));
    console.error("[login] Schema validation failed. Issues:", issues);
  } else {
    console.error("[login] Schema validation threw a non-Zod error:", error);
  }
  console.error(
    "[login] Raw API response:",
    JSON.stringify(context.raw, null, 2),
  );
  console.error(
    "[login] Normalized payload passed to schema.parse():",
    JSON.stringify(context.normalized, null, 2),
  );
}

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

  // Validate response with Zod. Declared outside the try block so the
  // catch handler below can still log exactly what was fed to `.parse()`.
  let normalized: unknown = result.data;
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
    normalized = (() => {
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
    logLoginSchemaFailure(parseError, {
      raw: result.data,
      normalized,
    });
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};
