import { apiGet } from "@/lib/apiClient";

import type { PropertyResponseDTO, PropertyDTO } from "./properties.schema";
import { propertyResponseSchema } from "./properties.schema";

type GetPropertyResult = 
  | { success: true; data: PropertyDTO }
  | { success: false; error: string };

export const getProperty = async (id: string): Promise<GetPropertyResult> => {
  const result = await apiGet<PropertyResponseDTO>(`/property/${id}`);

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = propertyResponseSchema.parse(result.data);
    // Handle both direct property object and object with data property
    const property = parsed.data || (parsed as unknown as PropertyDTO);
    return { success: true, data: property };
  } catch (parseError) {
    console.error("Get property schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





