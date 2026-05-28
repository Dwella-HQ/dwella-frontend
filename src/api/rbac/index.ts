import { apiClient, apiDelete, apiGet, apiPost } from "@/lib/apiClient";

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number };

export type CreatePermissionBody = {
  name: string;
  description?: string;
};

export type CreateRoleBody = {
  name: string;
  description?: string;
  permissionIds?: string[];
};

export type CreateRoleWithPermissionsBody = {
  name: string;
  description: string;
  permissions: CreatePermissionBody[];
};

export const createPermission = (
  body: CreatePermissionBody,
): Promise<ApiResult<unknown>> => apiPost<unknown>("/rbac/permission", body);

export const getPermissions = (): Promise<ApiResult<unknown>> =>
  apiGet<unknown>("/rbac/permissions");

export const getPermission = (id: string): Promise<ApiResult<unknown>> =>
  apiGet<unknown>(`/rbac/permissions/${encodeURIComponent(id)}`);

export const deletePermission = (id: string): Promise<ApiResult<unknown>> =>
  apiDelete<unknown>(`/rbac/permissions/${encodeURIComponent(id)}`);

export const createRole = (body: CreateRoleBody): Promise<ApiResult<unknown>> =>
  apiPost<unknown>("/rbac/roles", body);

export const createRoleWithPermissions = (
  body: CreateRoleWithPermissionsBody,
): Promise<ApiResult<unknown>> =>
  apiPost<unknown>("/rbac/roles/with-permissions", body);

export const getRoles = (): Promise<ApiResult<unknown>> =>
  apiGet<unknown>("/rbac/roles");

export const getRole = (id: string): Promise<ApiResult<unknown>> =>
  apiGet<unknown>(`/rbac/roles/${encodeURIComponent(id)}`);

export const deleteRole = (id: string): Promise<ApiResult<unknown>> =>
  apiDelete<unknown>(`/rbac/roles/${encodeURIComponent(id)}`);

export const assignPermissionsToRole = (
  roleId: string,
  permissionIds: string[],
): Promise<ApiResult<unknown>> =>
  apiPost<unknown>(
    `/rbac/roles/${encodeURIComponent(roleId)}/permissions`,
    { permissionIds },
  );

export const removePermissionsFromRole = (
  roleId: string,
  permissionIds: string[],
): Promise<ApiResult<unknown>> =>
  apiClient<unknown>(`/rbac/roles/${encodeURIComponent(roleId)}/permissions`, {
    method: "DELETE",
    data: { permissionIds },
  });
