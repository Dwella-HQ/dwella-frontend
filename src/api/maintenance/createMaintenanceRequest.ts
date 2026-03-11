import { apiPost } from "@/lib/apiClient";
import type { MaintenanceRequestCreateDTO } from "./maintenance.schema";
import type { MaintenanceRequestItemDTO } from "./maintenance.schema";

type CreateMaintenanceRequestResult =
  | { success: true; data: MaintenanceRequestItemDTO }
  | { success: false; error: string };

export const createMaintenanceRequest = async (
  body: MaintenanceRequestCreateDTO,
): Promise<CreateMaintenanceRequestResult> => {
  console.log("[API] createMaintenanceRequest — request body:", body);
  const result = await apiPost<{
    data?: MaintenanceRequestItemDTO;
    success?: boolean;
    message?: string;
  }>("/maintenance-request", body);

  console.log("[API] createMaintenanceRequest — response:", result);
  if (!result.success) {
    return result;
  }

  const data =
    (result.data as { data?: MaintenanceRequestItemDTO })?.data ??
    (result.data as MaintenanceRequestItemDTO);
  if (!data?.id) {
    return {
      success: false,
      error: "Invalid response: missing maintenance request id",
    };
  }

  return { success: true, data };
};
