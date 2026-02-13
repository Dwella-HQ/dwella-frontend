import { apiGet } from "@/lib/apiClient";

import type { UnitsResponseDTO, UnitDTO } from "./units.schema";
import { unitsResponseSchema } from "./units.schema";

type GetUnitsByPropertyResult = 
  | { success: true; data: UnitDTO[] }
  | { success: false; error: string };

export const getUnitsByProperty = async (
  propertyId: string
): Promise<GetUnitsByPropertyResult> => {
  const result = await apiGet<UnitsResponseDTO>(`/property/${propertyId}/units`);

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = unitsResponseSchema.parse(result.data);
    // Handle both array response and object with data array
    const units = Array.isArray(parsed) ? parsed : parsed.data || [];
    return { success: true, data: units };
  } catch (parseError) {
    console.error("Get units by property schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};

