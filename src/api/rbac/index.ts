import { apiClient, apiDelete, apiGet, apiPost } from "@/lib/apiClient";

export type RoleName =
  | "super_admin"
  | "admin"
  | "sub_admin"
  | "landlord"
  | "property_manager"
  | "agent"
  | "maintenance_staff"
  | "tenant"
  | "user";

export const ROLE_NAMES: RoleName[] = [
  "super_admin",
  "admin",
  "sub_admin",
  "landlord",
  "property_manager",
  "agent",
  "maintenance_staff",
  "tenant",
  "user",
];

export type PermissionDTO = {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type RoleDTO = {
  id: string;
  name: RoleName | string;
  description?: string | null;
  permissions?: PermissionDTO[] | null;
  createdAt?: string;
  updatedAt?: string;
};

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number };

export type CreatePermissionBody = {
  name: string;
  description?: string;
};

export type CreateRoleBody = {
  name: RoleName;
  description?: string;
  permissionIds?: string[];
};

export type CreateRoleWithPermissionsBody = {
  name: RoleName;
  description: string;
  permissions: CreatePermissionBody[];
};

/** Backend wraps most responses as `{ success, message, data }`; unwrap defensively. */
function unwrap<T>(raw: unknown, fallback: T): T {
  if (raw && typeof raw === "object" && "data" in (raw as Record<string, unknown>)) {
    return (raw as { data: T }).data ?? fallback;
  }
  return (raw as T) ?? fallback;
}

async function unwrapResult<T>(
  result: ApiResult<unknown>,
  fallback: T,
): Promise<ApiResult<T>> {
  if (!result.success) return result;
  return { success: true, data: unwrap<T>(result.data, fallback) };
}

export const createPermission = async (
  body: CreatePermissionBody,
): Promise<ApiResult<PermissionDTO | null>> =>
  unwrapResult(await apiPost<unknown>("/rbac/permission", body), null);

export const getPermissions = async (): Promise<ApiResult<PermissionDTO[]>> =>
  unwrapResult(await apiGet<unknown>("/rbac/permissions"), []);

export const getPermission = async (
  id: string,
): Promise<ApiResult<PermissionDTO | null>> =>
  unwrapResult(
    await apiGet<unknown>(`/rbac/permissions/${encodeURIComponent(id)}`),
    null,
  );

export const deletePermission = (
  id: string,
): Promise<ApiResult<unknown>> =>
  apiDelete<unknown>(`/rbac/permissions/${encodeURIComponent(id)}`);

export const createRole = async (
  body: CreateRoleBody,
): Promise<ApiResult<RoleDTO | null>> =>
  unwrapResult(await apiPost<unknown>("/rbac/roles", body), null);

export const createRoleWithPermissions = async (
  body: CreateRoleWithPermissionsBody,
): Promise<ApiResult<RoleDTO | null>> =>
  unwrapResult(
    await apiPost<unknown>("/rbac/roles/with-permissions", body),
    null,
  );

export const getRoles = async (): Promise<ApiResult<RoleDTO[]>> =>
  unwrapResult(await apiGet<unknown>("/rbac/roles"), []);

export const getRole = async (
  id: string,
): Promise<ApiResult<RoleDTO | null>> =>
  unwrapResult(await apiGet<unknown>(`/rbac/roles/${encodeURIComponent(id)}`), null);

export const deleteRole = (id: string): Promise<ApiResult<unknown>> =>
  apiDelete<unknown>(`/rbac/roles/${encodeURIComponent(id)}`);

export const assignPermissionsToRole = async (
  roleId: string,
  permissionIds: string[],
): Promise<ApiResult<RoleDTO | null>> =>
  unwrapResult(
    await apiPost<unknown>(
      `/rbac/roles/${encodeURIComponent(roleId)}/permissions`,
      { permissionIds },
    ),
    null,
  );

export const removePermissionsFromRole = async (
  roleId: string,
  permissionIds: string[],
): Promise<ApiResult<RoleDTO | null>> =>
  unwrapResult(
    await apiClient<unknown>(
      `/rbac/roles/${encodeURIComponent(roleId)}/permissions`,
      {
        method: "DELETE",
        data: { permissionIds },
      },
    ),
    null,
  );
