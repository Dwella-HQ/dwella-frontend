import { apiDelete } from "@/lib/apiClient";

import { logVerificationDebug } from "./debugLog";

type DeleteVerificationResult =
  | { success: true }
  | { success: false; error: string };

export const deleteVerification = async (
  id: string,
): Promise<DeleteVerificationResult> => {
  logVerificationDebug(`DELETE /verification/${id} request`, { id });

  const result = await apiDelete<unknown>(`/verification/${id}`);

  if (!result.success) {
    logVerificationDebug(`DELETE /verification/${id} failed`, {
      error: result.error,
      statusCode: result.statusCode,
    });
    return result;
  }

  logVerificationDebug(`DELETE /verification/${id} raw response`, result.data);

  return { success: true };
};
