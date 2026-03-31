import { apiGet } from "@/lib/apiClient";
import type {
  PropertyManagersResponseDTO,
  PropertyManagerDTO,
} from "./propertyManagers.schema";
import { propertyManagersResponseSchema } from "./propertyManagers.schema";

type GetPropertyManagersByLandlordResult =
  | { success: true; data: PropertyManagerDTO[] }
  | { success: false; error: string; statusCode?: number };

export const getPropertyManagersByLandlord = async (
  landlordId: string,
): Promise<GetPropertyManagersByLandlordResult> => {
  const result = await apiGet<PropertyManagersResponseDTO>(
    `/property-manager/landlord/${landlordId}`,
  );

  if (!result.success) {
    return result;
  }

  try {
    const parsed = propertyManagersResponseSchema.parse(result.data);
    const managers = Array.isArray(parsed) ? parsed : parsed.data ?? [];
    return { success: true, data: managers };
  } catch (parseError) {
    console.error(
      "Get property managers by landlord schema validation error:",
      parseError,
    );
    console.error("Received data:", result.data);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};

