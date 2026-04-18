import { apiGet } from "@/lib/apiClient";

import { logVerificationDebug } from "./debugLog";
import type { VerificationDTO } from "./verification.schema";
import { parseVerificationList } from "./parseVerification";

type GetVerificationsResult =
  | { success: true; data: VerificationDTO[] }
  | { success: false; error: string };

export const getVerifications = async (): Promise<GetVerificationsResult> => {
  const result = await apiGet<unknown>("/verification");

  if (!result.success) {
    logVerificationDebug("GET /verification failed", {
      error: result.error,
      statusCode: result.statusCode,
    });
    return result;
  }

  logVerificationDebug("GET /verification raw response", result.data);

  try {
    const verifications = parseVerificationList(result.data);
    logVerificationDebug("GET /verification parsed rows", {
      count: verifications.length,
      rows: verifications,
    });
    return { success: true, data: verifications };
  } catch (parseError) {
    console.error("Get verifications schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};
