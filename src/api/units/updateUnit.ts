import { apiPatch } from "@/lib/apiClient";

import type { UnitResponseDTO, UnitDTO, UpdateUnitRequestDTO } from "./units.schema";
import { unitResponseSchema } from "./units.schema";

type UpdateUnitResult =
  | { success: true; data: UnitDTO }
  | { success: false; error: string };

/**
 * PATCH /property/unit/{unitId}
 */
export const updateUnit = async (
  unitId: string,
  data: UpdateUnitRequestDTO,
): Promise<UpdateUnitResult> => {
  const result = await apiPatch<UnitResponseDTO>(`/property/unit/${unitId}`, data);

  if (!result.success) {
    return result;
  }

  try {
    const parsed = unitResponseSchema.parse(result.data);
    const unit = parsed.data || (parsed as unknown as UnitDTO);
    return { success: true, data: unit };
  } catch (parseError) {
    console.error("Update unit schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};
