import { apiPost } from "@/lib/apiClient";

import type { CreatePropertyRequestDTO, CreatePropertyResponseDTO, PropertyDTO, PropertyResponseDTO } from "./properties.schema";
import { createPropertyResponseSchema } from "./properties.schema";

type CreatePropertyResult = 
  | { success: true; data: PropertyDTO }
  | { success: false; error: string };

export const createProperty = async (
  data: CreatePropertyRequestDTO
): Promise<CreatePropertyResult> => {
  const result = await apiPost<PropertyResponseDTO>("/property", data);

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = createPropertyResponseSchema.parse(result.data);
    // Handle both direct property object and object with data property
    const propertyData = parsed.data || (parsed as unknown as PropertyDTO);
    
    // Ensure photos and documents arrays are properly set
    const property: PropertyDTO = {
      ...propertyData,
      photos: Array.isArray(propertyData.photos) ? propertyData.photos : [],
      documents: Array.isArray(propertyData.documents) ? propertyData.documents : [],
      units: Array.isArray(propertyData.units) ? propertyData.units : [],
    } as PropertyDTO;
    
    return { success: true, data: property };
  } catch (parseError) {
    console.error("Create property schema validation error:", parseError);
    console.error("Received data:", result.data);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





