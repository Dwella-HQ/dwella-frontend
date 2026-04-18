import { apiPatch } from "@/lib/apiClient";

import { logVerificationDebug } from "./debugLog";
import type {
  UpdateVerificationStatusRequestDTO,
  VerificationDTO,
} from "./verification.schema";
import { parseVerificationDto } from "./parseVerification";

type PatchVerificationStatusResult =
  | { success: true; data: VerificationDTO }
  | { success: false; error: string };

export const patchLandlordVerificationStatus = async (
  id: string,
  data: UpdateVerificationStatusRequestDTO,
): Promise<PatchVerificationStatusResult> => {
  logVerificationDebug(
    `PATCH /verification/${id}/landlord/status request body`,
    data,
  );

  const result = await apiPatch<unknown>(
    `/verification/${id}/landlord/status`,
    data,
  );

  if (!result.success) {
    logVerificationDebug(
      `PATCH /verification/${id}/landlord/status failed`,
      { error: result.error, statusCode: result.statusCode },
    );
    return result;
  }

  logVerificationDebug(
    `PATCH /verification/${id}/landlord/status raw response`,
    result.data,
  );

  try {
    const verification = parseVerificationDto(result.data);
    logVerificationDebug(
      `PATCH /verification/${id}/landlord/status parsed`,
      verification,
    );
    return { success: true, data: verification };
  } catch (parseError) {
    console.error(
      "Patch landlord verification status schema validation error:",
      parseError,
    );
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};

export const patchPropertyVerificationStatus = async (
  id: string,
  data: UpdateVerificationStatusRequestDTO,
): Promise<PatchVerificationStatusResult> => {
  logVerificationDebug(
    `PATCH /verification/${id}/property/status request body`,
    data,
  );

  const result = await apiPatch<unknown>(
    `/verification/${id}/property/status`,
    data,
  );

  if (!result.success) {
    logVerificationDebug(
      `PATCH /verification/${id}/property/status failed`,
      { error: result.error, statusCode: result.statusCode },
    );
    return result;
  }

  logVerificationDebug(
    `PATCH /verification/${id}/property/status raw response`,
    result.data,
  );

  try {
    const verification = parseVerificationDto(result.data);
    logVerificationDebug(
      `PATCH /verification/${id}/property/status parsed`,
      verification,
    );
    return { success: true, data: verification };
  } catch (parseError) {
    console.error(
      "Patch property verification status schema validation error:",
      parseError,
    );
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};

/** @deprecated Prefer `patchLandlordVerificationStatus` — name kept for existing imports. */
export const updateVerificationStatus = patchLandlordVerificationStatus;
