import { createUrl } from "@/utils/createUrl";
import { apiGet } from "@/lib/apiClient";

import { logVerificationDebug } from "./debugLog";
import type { VerificationDTO } from "./verification.schema";
import { parseVerificationList } from "./parseVerification";

type QueryVerificationsParams = {
  landlordId?: string;
  status?: "VERIFIED" | "PENDING" | "REJECTED";
  page?: number;
  limit?: number;
};

type QueryVerificationsResult =
  | { success: true; data: VerificationDTO[] }
  | { success: false; error: string };

export const queryVerifications = async (
  params?: QueryVerificationsParams,
): Promise<QueryVerificationsResult> => {
  const url = createUrl("/verification/query", params);

  const result = await apiGet<unknown>(url);

  if (!result.success) {
    logVerificationDebug(`GET ${url} failed`, {
      error: result.error,
      statusCode: result.statusCode,
    });
    return result;
  }

  logVerificationDebug(`GET ${url} raw response`, result.data);

  try {
    const verifications = parseVerificationList(result.data);
    logVerificationDebug(`GET ${url} parsed rows`, {
      count: verifications.length,
      rows: verifications,
    });
    return { success: true, data: verifications };
  } catch (parseError) {
    console.error("Query verifications schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};
