import { apiGet } from "@/lib/apiClient";
import type { PropertyManagersResponseDTO, PropertyManagerDTO } from "./propertyManagers.schema";
import { propertyManagersResponseSchema } from "./propertyManagers.schema";

type GetPropertyManagersResult =
  | { success: true; data: PropertyManagerDTO[] }
  | { success: false; error: string };

export const getPropertyManagers = async (): Promise<GetPropertyManagersResult> => {
  const result = await apiGet<PropertyManagersResponseDTO>("/property-manager");

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = propertyManagersResponseSchema.parse(result.data);
    // Handle both array response and object with data array
    const managers = Array.isArray(parsed) ? parsed : parsed.data || [];
    return { success: true, data: managers };
  } catch (parseError) {
    console.error("Get property managers schema validation error:", parseError);
    console.error("Received data:", result.data);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};


