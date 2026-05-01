import { apiPost } from "@/lib/apiClient";

import type {
  VerificationDTO,
  VerificationResponseDTO,
} from "./verification.schema";
import { verificationResponseSchema } from "./verification.schema";

type Result =
  | { success: true; data: VerificationDTO }
  | { success: false; error: string; statusCode?: number };

/**
 * `POST /verification/property/{propertyId}` — start property verification flow (OpenAPI).
 */
export const createPropertyVerification = async (
  propertyId: string,
): Promise<Result> => {
  const result = await apiPost<VerificationResponseDTO>(
    `/verification/property/${encodeURIComponent(propertyId)}`,
    {},
  );

  if (!result.success) {
    return result;
  }

  try {
    const parsed = verificationResponseSchema.parse(result.data);
    const verification = parsed.data || (parsed as unknown as VerificationDTO);
    return { success: true, data: verification as VerificationDTO };
  } catch (e) {
    console.error("createPropertyVerification parse error:", e);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};
