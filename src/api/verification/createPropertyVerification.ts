import { apiPost } from "@/lib/apiClient";

import type { VerificationDTO } from "./verification.schema";
import { parseVerificationDto } from "./parseVerification";

type Result =
  | { success: true; data: VerificationDTO }
  | { success: false; error: string; statusCode?: number };

/**
 * `POST /verification/property/{propertyId}` — start property verification flow (OpenAPI).
 */
export const createPropertyVerification = async (
  propertyId: string,
): Promise<Result> => {
  const result = await apiPost<unknown>(
    `/verification/property/${encodeURIComponent(propertyId)}`,
    {},
  );

  if (!result.success) {
    return result;
  }

  try {
    const verification = parseVerificationDto(result.data);
    return { success: true, data: verification };
  } catch (e) {
    console.warn("createPropertyVerification response was not a verification row:", e);
    return {
      success: true,
      data: {
        id: propertyId,
        propertyId,
        type: "PROPERTY_VERIFICATION",
        status: "PENDING",
      },
    };
  }
};
