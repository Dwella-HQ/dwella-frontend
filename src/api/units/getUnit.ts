import { apiGet } from "@/lib/apiClient";

import type { UnitResponseDTO, UnitDTO } from "./units.schema";
import { unitResponseSchema } from "./units.schema";

type GetUnitResult =
  | { success: true; data: UnitDTO }
  | { success: false; error: string };

/**
 * Fetch a single unit by ID (UUID).
 * GET /property/unit/:unitId
 * Response includes the unit with nested property.
 */
export const getUnit = async (unitId: string): Promise<GetUnitResult> => {
  const result = await apiGet<UnitResponseDTO>(`/property/unit/${unitId}`);

  if (!result.success) {
    return result;
  }

  try {
    const parsed = unitResponseSchema.parse(result.data);
    const unitData = parsed.data;
    if (!unitData) {
      return { success: false, error: "Unit not found" };
    }
    return { success: true, data: unitData };
  } catch (parseError) {
    console.error("Get unit schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};
