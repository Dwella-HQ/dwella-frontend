import { apiPost } from "@/lib/apiClient";

type Result =
  | { success: true }
  | { success: false; error: string; statusCode?: number };

/**
 * POST /landlord/{id}/verify — kicks off backend landlord verification
 * (KYC/KYB review) once onboarding data has been submitted.
 */
export const initiateLandlordVerification = async (
  landlordId: string,
): Promise<Result> => {
  const result = await apiPost<unknown>(
    `/landlord/${encodeURIComponent(landlordId)}/verify`,
    {},
  );
  if (!result.success) {
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode,
    };
  }
  return { success: true };
};
