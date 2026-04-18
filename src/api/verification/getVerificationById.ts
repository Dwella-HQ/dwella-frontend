import { apiGet } from "@/lib/apiClient";

import { logVerificationDebug } from "./debugLog";
import type { VerificationDTO } from "./verification.schema";
import { parseVerificationDto } from "./parseVerification";

type GetVerificationByIdResult =
  | { success: true; data: VerificationDTO }
  | { success: false; error: string };

export const getVerificationById = async (
  id: string,
): Promise<GetVerificationByIdResult> => {
  const result = await apiGet<unknown>(`/verification/${id}`);

  if (!result.success) {
    logVerificationDebug(`GET /verification/${id} failed`, {
      error: result.error,
      statusCode: result.statusCode,
    });
    return result;
  }

  logVerificationDebug(`GET /verification/${id} raw response`, result.data);

  try {
    const verification = parseVerificationDto(result.data);
    logVerificationDebug(`GET /verification/${id} parsed`, verification);
    return { success: true, data: verification };
  } catch (parseError) {
    console.error(
      "Get verification by id schema validation error:",
      parseError,
    );
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};
