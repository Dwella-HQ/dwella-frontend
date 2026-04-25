import { apiGet } from "@/lib/apiClient";

import type { PropertiesResponseDTO, PropertyDTO } from "./properties.schema";
import { propertiesResponseSchema } from "./properties.schema";

type GetPropertiesQueryResult =
  | { success: true; data: PropertyDTO[] }
  | { success: false; error: string };

/**
 * Public catalog: GET /property/query (no auth).
 * Used by the marketing landing page.
 */
export const getPropertiesQuery =
  async (): Promise<GetPropertiesQueryResult> => {
    const result = await apiGet<PropertiesResponseDTO>("/property/query", {
      skipAuth: true,
    });

    if (!result.success) {
      return result;
    }

    try {
      const parsed = propertiesResponseSchema.parse(result.data);
      const properties = Array.isArray(parsed) ? parsed : (parsed.data ?? []);
      return { success: true, data: properties };
    } catch (parseError) {
      console.error(
        "Get properties query schema validation error:",
        parseError,
      );
      return {
        success: false,
        error: "Invalid response data format received",
      };
    }
  };
