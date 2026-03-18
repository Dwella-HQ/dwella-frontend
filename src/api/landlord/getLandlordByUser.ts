import { apiGet } from "@/lib/apiClient";

import type { LandlordResponseDTO, LandlordDTO } from "./landlord.schema";
import { landlordResponseSchema } from "./landlord.schema";

type GetLandlordByUserResult =
  | { success: true; data: LandlordDTO }
  | { success: false; error: string; statusCode?: number };

export const getLandlordByUser = async (
  userId: string,
): Promise<GetLandlordByUserResult> => {
  const result = await apiGet<LandlordResponseDTO>(`/landlord/user/${userId}`);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode,
    };
  }

  // Validate response with Zod
  const parsed = landlordResponseSchema.safeParse(result.data);
  if (parsed.success) {
    const landlord =
      parsed.data.data || (parsed.data as unknown as LandlordDTO);
    return { success: true, data: landlord };
  }

  // Defensive normalization for inconsistent backend payloads.
  // Some responses omit `landLordName`; default it before parsing again.
  const normalizedPayload = {
    ...(result.data as Record<string, unknown>),
    data: {
      ...(((result.data as Record<string, unknown>)?.data as
        | Record<string, unknown>
        | undefined) ?? {}),
      landLordName:
        ((
          (result.data as Record<string, unknown>)?.data as
            | Record<string, unknown>
            | undefined
        )?.landLordName as string | undefined) ?? "",
    },
  };

  const reparsed = landlordResponseSchema.safeParse(normalizedPayload);
  if (reparsed.success) {
    const landlord =
      reparsed.data.data || (reparsed.data as unknown as LandlordDTO);
    return { success: true, data: landlord };
  }

  console.error(
    "Get landlord by user schema validation error:",
    reparsed.error.issues,
  );
  return {
    success: false,
    error: "Invalid response data format received",
  };
};
