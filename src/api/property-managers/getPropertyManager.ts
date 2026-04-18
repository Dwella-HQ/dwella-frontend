import { apiGet } from "@/lib/apiClient";

import type { PropertyManagerDTO } from "./propertyManagers.schema";
import { propertyManagerSchema } from "./propertyManagers.schema";

type GetPropertyManagerResult =
  | { success: true; data: PropertyManagerDTO }
  | { success: false; error: string };

function unwrapData(raw: unknown): unknown {
  if (
    raw &&
    typeof raw === "object" &&
    "data" in raw &&
    (raw as { data?: unknown }).data !== undefined &&
    (raw as { data?: unknown }).data !== null
  ) {
    return (raw as { data: unknown }).data;
  }
  return raw;
}

/** `GET /property-manager/{id}` — see ENDPOINTS.md */
export const getPropertyManager = async (
  id: string,
): Promise<GetPropertyManagerResult> => {
  const result = await apiGet<unknown>(`/property-manager/${id}`);

  if (!result.success) {
    return result;
  }

  try {
    const inner = unwrapData(result.data);
    const parsed = propertyManagerSchema.passthrough().safeParse(inner);
    if (parsed.success) {
      return { success: true, data: parsed.data };
    }
    return {
      success: true,
      data: inner as PropertyManagerDTO,
    };
  } catch (parseError) {
    return {
      success: false,
      error: "Could not read property manager response.",
    };
  }
};
