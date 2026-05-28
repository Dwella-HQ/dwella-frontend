import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/apiClient";
import {
  maintenanceRequestSubTypeSchema,
  maintenanceRequestTypeSchema,
  type MaintenanceRequestSubTypeDTO,
  type MaintenanceRequestTypeDTO,
} from "./maintenance.schema";

export type MaintenanceTypeBody = {
  name: string;
  description?: string;
};

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number };

const unwrap = (value: unknown) =>
  value && typeof value === "object" && "data" in value
    ? (value as { data?: unknown }).data
    : value;

export const createMaintenanceRequestType = async (
  body: MaintenanceTypeBody,
): Promise<ApiResult<MaintenanceRequestTypeDTO | unknown>> => {
  const result = await apiPost<unknown>("/maintenance-request-types", body);
  if (!result.success) return result;
  const parsed = maintenanceRequestTypeSchema.safeParse(unwrap(result.data));
  return { success: true, data: parsed.success ? parsed.data : result.data };
};

export const getMaintenanceRequestType = async (
  id: string,
): Promise<ApiResult<MaintenanceRequestTypeDTO | unknown>> => {
  const result = await apiGet<unknown>(
    `/maintenance-request-types/${encodeURIComponent(id)}`,
  );
  if (!result.success) return result;
  const parsed = maintenanceRequestTypeSchema.safeParse(unwrap(result.data));
  return { success: true, data: parsed.success ? parsed.data : result.data };
};

export const getMaintenanceRequestTypeByName = async (
  name: string,
): Promise<ApiResult<MaintenanceRequestTypeDTO | unknown>> => {
  const result = await apiGet<unknown>(
    `/maintenance-request-types/name/${encodeURIComponent(name)}`,
  );
  if (!result.success) return result;
  const parsed = maintenanceRequestTypeSchema.safeParse(unwrap(result.data));
  return { success: true, data: parsed.success ? parsed.data : result.data };
};

export const updateMaintenanceRequestType = async (
  id: string,
  body: Partial<MaintenanceTypeBody>,
): Promise<ApiResult<MaintenanceRequestTypeDTO | unknown>> => {
  const result = await apiPatch<unknown>(
    `/maintenance-request-types/${encodeURIComponent(id)}`,
    body,
  );
  if (!result.success) return result;
  const parsed = maintenanceRequestTypeSchema.safeParse(unwrap(result.data));
  return { success: true, data: parsed.success ? parsed.data : result.data };
};

export const deleteMaintenanceRequestType = async (
  id: string,
): Promise<ApiResult<unknown>> =>
  apiDelete<unknown>(`/maintenance-request-types/${encodeURIComponent(id)}`);

export const addMaintenanceRequestSubType = async (
  typeId: string,
  body: MaintenanceTypeBody,
): Promise<ApiResult<MaintenanceRequestSubTypeDTO | unknown>> => {
  const result = await apiPost<unknown>(
    `/maintenance-request-types/${encodeURIComponent(typeId)}/subtype`,
    body,
  );
  if (!result.success) return result;
  const parsed = maintenanceRequestSubTypeSchema.safeParse(unwrap(result.data));
  return { success: true, data: parsed.success ? parsed.data : result.data };
};

export const getMaintenanceRequestSubTypes = async (
  typeId: string,
): Promise<ApiResult<MaintenanceRequestSubTypeDTO[] | unknown>> =>
  apiGet<unknown>(
    `/maintenance-request-types/${encodeURIComponent(typeId)}/subtypes`,
  );

export const updateMaintenanceRequestSubType = async (
  subTypeId: string,
  body: Partial<MaintenanceTypeBody>,
): Promise<ApiResult<MaintenanceRequestSubTypeDTO | unknown>> => {
  const result = await apiPatch<unknown>(
    `/maintenance-request-types/subtype/${encodeURIComponent(subTypeId)}`,
    body,
  );
  if (!result.success) return result;
  const parsed = maintenanceRequestSubTypeSchema.safeParse(unwrap(result.data));
  return { success: true, data: parsed.success ? parsed.data : result.data };
};

export const deleteMaintenanceRequestSubType = async (
  subTypeId: string,
): Promise<ApiResult<unknown>> =>
  apiDelete<unknown>(
    `/maintenance-request-types/subtype/${encodeURIComponent(subTypeId)}`,
  );

export const deleteMaintenanceRequestSubTypesByTypeId = async (
  typeId: string,
): Promise<ApiResult<unknown>> =>
  apiDelete<unknown>(
    `/maintenance-request-types/subtype/${encodeURIComponent(typeId)}`,
  );
