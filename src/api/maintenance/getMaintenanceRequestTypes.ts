import { apiGet } from "@/lib/apiClient";
import { maintenanceRequestTypesResponseSchema } from "./maintenance.schema";
import type {
  MaintenanceRequestTypeDTO,
  MaintenanceRequestTypesResponseDTO,
} from "./maintenance.schema";

type GetMaintenanceRequestTypesResult =
  | { success: true; data: MaintenanceRequestTypeDTO[] }
  | { success: false; error: string };

export const getMaintenanceRequestTypes =
  async (): Promise<GetMaintenanceRequestTypesResult> => {
    const result = await apiGet<MaintenanceRequestTypesResponseDTO>(
      "/maintenance-request-types",
    );

    if (!result.success) {
      return result;
    }

    try {
      const parsed = maintenanceRequestTypesResponseSchema.parse(result.data);
      const types = Array.isArray(parsed.data) ? parsed.data : [];
      return { success: true, data: types };
    } catch (parseError) {
      console.error(
        "Get maintenance request types schema validation error:",
        parseError,
      );
      return {
        success: false,
        error: "Invalid response data format received",
      };
    }
  };
