import { apiPatch } from "@/lib/apiClient";
import type { MaintenanceRequestStatusDTO } from "./maintenance.schema";
import type { MaintenanceRequestItemDTO } from "./maintenance.schema";

type UpdateMaintenanceRequestStatusResult =
  | { success: true; data?: MaintenanceRequestItemDTO }
  | { success: false; error: string };

export const updateMaintenanceRequestStatus = async (
  id: string,
  body: MaintenanceRequestStatusDTO,
): Promise<UpdateMaintenanceRequestStatusResult> => {
  const result = await apiPatch<{
    data?: MaintenanceRequestItemDTO;
    success?: boolean;
    message?: string;
  }>(`/maintenance-request/${id}/status`, body);

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: (result.data as { data?: MaintenanceRequestItemDTO })?.data,
  };
};
