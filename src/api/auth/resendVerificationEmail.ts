import { apiPost } from "@/lib/apiClient";

type Body = { email: string };

type ResendResult =
  | { success: true; message?: string }
  | { success: false; error: string };

/**
 * POST /auth/resend-verification-email
 * Backend contract may vary; we treat 2xx with any JSON as success.
 */
export const resendVerificationEmail = async (
  body: Body,
): Promise<ResendResult> => {
  const result = await apiPost<{ success?: boolean; message?: string }>(
    "/auth/resend-verification-email",
    body,
    { skipAuth: true },
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const msg =
    result.data &&
    typeof result.data === "object" &&
    "message" in result.data &&
    typeof result.data.message === "string"
      ? result.data.message
      : undefined;

  return { success: true, message: msg };
};
