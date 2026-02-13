import { apiGet } from "@/lib/apiClient";

import type { PropertiesResponseDTO, PropertyDTO } from "./properties.schema";
import { propertiesResponseSchema } from "./properties.schema";

type GetPropertiesByLandlordResult = 
  | { success: true; data: PropertyDTO[] }
  | { success: false; error: string };

export const getPropertiesByLandlord = async (
  landlordId: string
): Promise<GetPropertiesByLandlordResult> => {
  const result = await apiGet<PropertiesResponseDTO>(`/property/landlord/${landlordId}`);

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = propertiesResponseSchema.parse(result.data);
    // Handle both array response and object with data array
    const properties = Array.isArray(parsed) ? parsed : parsed.data || [];
    return { success: true, data: properties };
  } catch (parseError) {
    console.error("Get properties by landlord schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};

