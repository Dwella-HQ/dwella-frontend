import { apiGet } from "@/lib/apiClient";
import type { PropertyManagersResponseDTO, PropertyManagerDTO } from "./propertyManagers.schema";
import { propertyManagersResponseSchema } from "./propertyManagers.schema";

type GetPropertyManagerByUserResult =
  | { success: true; data: PropertyManagerDTO[] }
  | { success: false; error: string };

/**
 * GET /property-manager/user/:userId
 * Returns property manager record(s) for the given user ID (e.g. logged-in property manager).
 * A user can be linked to multiple landlords, so response is an array.
 */
export const getPropertyManagerByUser = async (
  userId: string
): Promise<GetPropertyManagerByUserResult> => {
  const result = await apiGet<PropertyManagersResponseDTO>(`/property-manager/user/${userId}`);

  if (!result.success) {
    return result;
  }

  try {
    const parsed = propertyManagersResponseSchema.parse(result.data);
    const managers = Array.isArray(parsed) ? parsed : parsed.data ?? [];
    return { success: true, data: managers };
  } catch (parseError) {
    console.error("Get property manager by user schema validation error:", parseError);
    console.error("Received data:", result.data);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};
