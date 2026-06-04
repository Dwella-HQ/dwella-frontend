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
  landlordId?: string;
  propertyId?: string;
  /** If the API supports it, scopes results server-side */
  tenantId?: string;
  unitId?: string;
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  type?: string;
  subType?: string;
  /**
   * Admin view must keep using legacy endpoint.
   * - true  => GET /maintenance-request
   * - false => GET /maintenance-request/query
   */
  useLegacyEndpoint?: boolean;
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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function extractId(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  const record = asRecord(value);
  const id = record.id;
  return typeof id === "string" || typeof id === "number" ? String(id) : "";
}

function extractPersonName(value: unknown): string {
  const record = asRecord(value);
  const user = asRecord(record.user);
  const candidates = [
    record.fullName,
    record.name,
    record.email,
    user.fullName,
    user.name,
    user.email,
  ];

  const match = candidates.find(
    (candidate) => typeof candidate === "string" && candidate.length > 0,
  );
  return typeof match === "string" ? match : "";
}

function formatLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\bac\b/gi, "AC")
    .replace(/\bhvac\b/gi, "HVAC")
    .replace(/\b[a-z]/g, (m) => m.toUpperCase());
}

export function mapMaintenanceRequestItem(
  item: MaintenanceRequestItemDTO,
): MaintenanceRequestWithDetails {
  const record = item as Record<string, unknown>;
  const property = record.property;
  const unit = record.unit;
  const tenant = record.tenant;
  const unitLabel = extractName(unit);
  const typeRaw = extractName(item.type);
  const subTypeRaw = extractName(item.subType ?? item.sub_type);
  const propertyId =
    (item.propertyId ?? item.property_id ?? extractId(property)) || undefined;
  const tenantId =
    (item.tenantId ?? item.tenant_id ?? extractId(tenant)) || undefined;

  return {
    id: item.id,
    requestId: item.requestId ?? item.request_id ?? item.id,
    propertyId,
    propertyName:
      item.propertyName ?? item.property_name ?? extractName(property),
    unit: unitLabel || "",
    tenantName:
      item.tenantName ?? item.tenant_name ?? extractPersonName(tenant),
    tenantId,
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
  const endpoint = params?.useLegacyEndpoint
    ? "/maintenance-request"
    : "/maintenance-request/query";
  const queryParams = { ...(params ?? {}) } as Record<string, string | number>;
  delete (queryParams as { useLegacyEndpoint?: boolean }).useLegacyEndpoint;
  const url = createUrl(
    endpoint,
    queryParams,
  );
  const result = await apiGet<MaintenanceRequestsResponseDTO>(url);

  if (!result.success) {
    return result;
  }

  try {
    const parsed = maintenanceRequestsResponseSchema.parse(result.data);
    const items = Array.isArray(parsed.data) ? parsed.data : [];
    const mapped = items.map(mapMaintenanceRequestItem);
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
