import { apiGet } from "@/lib/apiClient";

import type { PropertiesResponseDTO, PropertyDTO } from "./properties.schema";
import { propertiesResponseSchema } from "./properties.schema";

export type PropertiesQueryParams = {
  name?: string;
  landlordId?: string;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  parkingSpace?: boolean;
  city?: string;
  state?: string;
  country?: string;
  isOpenForServiceApartment?: boolean;
};

type GetPropertiesQueryResult =
  | { success: true; data: PropertyDTO[] }
  | { success: false; error: string };

function buildQueryString(params?: PropertiesQueryParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  if (params.name) search.set("name", params.name);
  if (params.landlordId) search.set("landlordId", params.landlordId);
  if (params.minYearBuilt != null)
    search.set("minYearBuilt", String(params.minYearBuilt));
  if (params.maxYearBuilt != null)
    search.set("maxYearBuilt", String(params.maxYearBuilt));
  if (params.parkingSpace != null)
    search.set("parkingSpace", String(params.parkingSpace));
  if (params.city) search.set("city", params.city);
  if (params.state) search.set("state", params.state);
  if (params.country) search.set("country", params.country);
  if (params.isOpenForServiceApartment != null) {
    search.set(
      "isOpenForServiceApartment",
      String(params.isOpenForServiceApartment),
    );
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Public catalog: GET /property/query (no auth).
 * Used by marketing / guest browse pages.
 */
export const getPropertiesQuery = async (
  params?: PropertiesQueryParams,
): Promise<GetPropertiesQueryResult> => {
  const result = await apiGet<PropertiesResponseDTO>(
    `/property/query${buildQueryString(params)}`,
    {
      skipAuth: true,
    },
  );

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
