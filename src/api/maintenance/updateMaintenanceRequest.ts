import { apiPatch } from "@/lib/apiClient";
import type { MaintenanceRequestCreateDTO } from "./maintenance.schema";
import type { MaintenanceRequestItemDTO } from "./maintenance.schema";

type UpdateMaintenanceRequestResult =
  | { success: true; data: MaintenanceRequestItemDTO }
  | { success: false; error: string };

export const updateMaintenanceRequest = async (
  id: string,
  body: Partial<MaintenanceRequestCreateDTO>,
): Promise<UpdateMaintenanceRequestResult> => {
  const result = await apiPatch<{
    data?: MaintenanceRequestItemDTO;
    success?: boolean;
    message?: string;
  }>(`/maintenance-request/${id}`, body);

  if (!result.success) {
    return result;
  }

  const data =
    (result.data as { data?: MaintenanceRequestItemDTO })?.data ??
    (result.data as MaintenanceRequestItemDTO);
  if (!data?.id) {
    return {
      success: false,
      error: "Invalid response: maintenance request not found",
    };
  }

  return { success: true, data };
};
