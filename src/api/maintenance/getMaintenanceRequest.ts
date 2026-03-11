import { apiGet } from "@/lib/apiClient";
import type { MaintenanceRequestItemDTO } from "./maintenance.schema";

type GetMaintenanceRequestResult =
  | { success: true; data: MaintenanceRequestItemDTO }
  | { success: false; error: string };

export const getMaintenanceRequest = async (
  id: string,
): Promise<GetMaintenanceRequestResult> => {
  const result = await apiGet<{
    data?: MaintenanceRequestItemDTO;
    success?: boolean;
    message?: string;
  }>(`/maintenance-request/${id}`);

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
