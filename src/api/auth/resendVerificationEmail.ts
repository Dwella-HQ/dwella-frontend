import { createUrl } from "@/utils/createUrl";
import { apiGet } from "@/lib/apiClient";

type Body = { email: string };

type ResendResult =
  | { success: true; message?: string }
  | { success: false; error: string };

/**
 * GET /auth/verify-email-token?email=...
 * Backend contract may vary; we treat 2xx with any JSON as success.
 */
export const resendVerificationEmail = async (
  body: Body,
): Promise<ResendResult> => {
  const url = createUrl("/auth/verify-email-token", { email: body.email });
  const result = await apiGet<{ success?: boolean; message?: string }>(url, {
    skipAuth: true,
  });

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
