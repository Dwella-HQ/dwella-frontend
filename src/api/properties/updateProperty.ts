import { apiPatch } from "@/lib/apiClient";

import type { UpdatePropertyRequestDTO, PropertyResponseDTO, PropertyDTO } from "./properties.schema";
import { propertyResponseSchema } from "./properties.schema";

type UpdatePropertyResult = 
  | { success: true; data: PropertyDTO }
  | { success: false; error: string };

export const updateProperty = async (
  id: string,
  data: UpdatePropertyRequestDTO
): Promise<UpdatePropertyResult> => {
  const result = await apiPatch<PropertyResponseDTO>(`/property/${id}`, data);

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
    console.error("Update property schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





