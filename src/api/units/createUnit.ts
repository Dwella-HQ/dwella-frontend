import { apiPost } from "@/lib/apiClient";

import type { CreateUnitRequestDTO, UnitResponseDTO, UnitDTO } from "./units.schema";
import { unitResponseSchema } from "./units.schema";

type CreateUnitResult = 
  | { success: true; data: UnitDTO }
  | { success: false; error: string };

export const createUnit = async (
  propertyId: string,
  data: CreateUnitRequestDTO
): Promise<CreateUnitResult> => {
  const result = await apiPost<UnitResponseDTO>(`/property/${propertyId}/unit`, data);

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = unitResponseSchema.parse(result.data);
    // Handle both direct unit object and object with data property
    const unit = parsed.data || (parsed as unknown as UnitDTO);
    return { success: true, data: unit };
  } catch (parseError) {
    console.error("Create unit schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





