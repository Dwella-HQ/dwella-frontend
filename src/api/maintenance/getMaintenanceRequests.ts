import { apiGet } from "@/lib/apiClient";
import type { MaintenanceRequestsResponseDTO, MaintenanceRequestItemDTO } from "./maintenance.schema";
import { maintenanceRequestsResponseSchema } from "./maintenance.schema";
import type { MaintenanceRequestWithDetails } from "@/data/mockLandlordData";

type GetMaintenanceRequestsResult =
  | { success: true; data: MaintenanceRequestWithDetails[] }
  | { success: false; error: string };

function mapItemToWithDetails(item: MaintenanceRequestItemDTO): MaintenanceRequestWithDetails {
  const status = (item.status ?? "new") as "new" | "in_progress" | "resolved";
  const priority = (item.priority ?? "medium") as "low" | "medium" | "high";
  return {
    id: item.id,
    requestId: item.requestId ?? item.request_id ?? item.id,
    propertyName: item.propertyName ?? item.property_name ?? "",
    unit: item.unit ?? "",
    tenantName: item.tenantName ?? item.tenant_name ?? "",
    type: item.type ?? "",
    subType: item.subType ?? item.sub_type ?? "",
    priority,
    status,
    reportedTime:
      item.reportedTime ??
      item.reported_time ??
      item.createdAt ??
      item.created_at ??
      "",
    description: item.description ?? "",
  };
}

export const getMaintenanceRequests = async (): Promise<GetMaintenanceRequestsResult> => {
  const result = await apiGet<MaintenanceRequestsResponseDTO>("/maintenance-request");

  if (!result.success) {
    return result;
  }

  try {
    const parsed = maintenanceRequestsResponseSchema.parse(result.data);
    const items = Array.isArray(parsed.data) ? parsed.data : [];
    const mapped = items.map(mapItemToWithDetails);
    return { success: true, data: mapped };
  } catch (parseError) {
    console.error("Get maintenance requests schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};
