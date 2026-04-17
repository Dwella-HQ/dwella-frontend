import { apiPatch } from "@/lib/apiClient";
import type { PropertyManagerDTO } from "./propertyManagers.schema";
import { propertyManagerSchema } from "./propertyManagers.schema";

export type UpdatePropertyManagerRequestDTO = {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  propertyIds?: string[];
  permissions?: string[];
  isActive?: boolean;
};

type UpdatePropertyManagerResult =
  | { success: true; data: PropertyManagerDTO }
  | { success: false; error: string };

export const updatePropertyManager = async (
  id: string,
  body: UpdatePropertyManagerRequestDTO,
): Promise<UpdatePropertyManagerResult> => {
  const result = await apiPatch<unknown>(`/property-manager/${id}`, body);

  if (!result.success) {
    return result;
  }

  const payload =
    (result.data as { data?: unknown } | undefined)?.data ?? result.data;
  const parsed = propertyManagerSchema.safeParse(payload);
  if (!parsed.success) {
    console.error("Update property manager schema validation error:", parsed.error);
    console.error("Received data:", result.data);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }

  return { success: true, data: parsed.data };
};

