import { createUrl } from "@/utils/createUrl";
import { apiGet } from "@/lib/apiClient";
import type {
  MaintenanceRequestsResponseDTO,
  MaintenanceRequestItemDTO,
} from "./maintenance.schema";
import { maintenanceRequestsResponseSchema } from "./maintenance.schema";
import type { MaintenanceRequestWithDetails } from "@/data/mockLandlordData";

export type GetMaintenanceRequestsParams = {
  page?: number;
  cursor?: string;
  limit?: number;
  /** If the API supports it, scopes results server-side */
  tenantId?: string;
};

type GetMaintenanceRequestsResult =
  | { success: true; data: MaintenanceRequestWithDetails[] }
  | { success: false; error: string };

function normalizeStatus(
  s: string | undefined,
): "new" | "in_progress" | "resolved" {
  const v = (s ?? "").toLowerCase();
  if (v === "in_progress" || v === "in progress") return "in_progress";
  if (v === "resolved" || v === "completed") return "resolved";
  return "new";
}

function normalizePriority(p: string | undefined): "low" | "medium" | "high" {
  const v = (p ?? "").toLowerCase();
  if (v === "high") return "high";
  if (v === "low") return "low";
  return "medium";
}

function extractName(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "name" in value) {
    const n = (value as { name?: unknown }).name;
    if (typeof n === "string") return n;
  }
  return "";
}

function formatLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\bac\b/gi, "AC")
    .replace(/\bhvac\b/gi, "HVAC")
    .replace(/\b[a-z]/g, (m) => m.toUpperCase());
}

function mapItemToWithDetails(
  item: MaintenanceRequestItemDTO,
): MaintenanceRequestWithDetails {
  const unitLabel = extractName(item.unit);
  const typeRaw = extractName(item.type);
  const subTypeRaw = extractName(item.subType ?? item.sub_type);

  return {
    id: item.id,
    requestId: item.requestId ?? item.request_id ?? item.id,
    propertyName: item.propertyName ?? item.property_name ?? "",
    unit: unitLabel || "",
    tenantName: item.tenantName ?? item.tenant_name ?? "",
    tenantId: item.tenantId ?? item.tenant_id ?? undefined,
    type: typeRaw ? formatLabel(typeRaw) : "",
    subType: subTypeRaw ? formatLabel(subTypeRaw) : "",
    priority: normalizePriority(item.priority),
    status: normalizeStatus(item.status),
    reportedTime:
      item.reportedTime ??
      item.reported_time ??
      item.createdAt ??
      item.created_at ??
      "",
    description: item.description ?? "",
    title: item.title,
  };
}

export const getMaintenanceRequests = async (
  params?: GetMaintenanceRequestsParams,
): Promise<GetMaintenanceRequestsResult> => {
  const url = createUrl(
    "/maintenance-request",
    params as Record<string, string | number>,
  );
  const result = await apiGet<MaintenanceRequestsResponseDTO>(url);

  if (!result.success) {
    return result;
  }

  try {
    const parsed = maintenanceRequestsResponseSchema.parse(result.data);
    const items = Array.isArray(parsed.data) ? parsed.data : [];
    const mapped = items.map(mapItemToWithDetails);
    return { success: true, data: mapped };
  } catch (parseError) {
    console.error(
      "Get maintenance requests schema validation error:",
      parseError,
    );
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};
