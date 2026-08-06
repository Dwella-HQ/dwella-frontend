import Head from "next/head";
import * as React from "react";
import { Loader2, Plus, Shield, Trash2 } from "lucide-react";

import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/components/Toast";
import {
  ROLE_NAMES,
  assignPermissionsToRole,
  createPermission,
  createRole,
  deletePermission,
  getPermissions,
  getRoles,
  removePermissionsFromRole,
  type PermissionDTO,
  type RoleDTO,
  type RoleName,
} from "@/api/rbac";

const fieldCls =
  "h-9 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-[12px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-brand-main";

function roleLabel(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function permissionIdsOf(role: RoleDTO | null): Set<string> {
  return new Set((role?.permissions ?? []).map((p) => p.id));
}

const AdminRolesPermissionsPage: NextPageWithLayout = () => {
  const { showToast } = useToast();
  const [roles, setRoles] = React.useState<RoleDTO[]>([]);
  const [permissions, setPermissions] = React.useState<PermissionDTO[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = React.useState<string | null>(
    null,
  );
  const [togglingPermissionId, setTogglingPermissionId] = React.useState<
    string | null
  >(null);

  const [showNewRole, setShowNewRole] = React.useState(false);
  const [newRoleName, setNewRoleName] = React.useState<RoleName>("sub_admin");
  const [newRoleDescription, setNewRoleDescription] = React.useState("");
  const [creatingRole, setCreatingRole] = React.useState(false);

  const [showNewPermission, setShowNewPermission] = React.useState(false);
  const [newPermissionName, setNewPermissionName] = React.useState("");
  const [newPermissionDescription, setNewPermissionDescription] =
    React.useState("");
  const [creatingPermission, setCreatingPermission] = React.useState(false);
  const [deletingPermissionId, setDeletingPermissionId] = React.useState<
    string | null
  >(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const [rolesResult, permissionsResult] = await Promise.all([
      getRoles(),
      getPermissions(),
    ]);
    if (!rolesResult.success) {
      setError(rolesResult.error);
      setIsLoading(false);
      return;
    }
    if (!permissionsResult.success) {
      setError(permissionsResult.error);
      setIsLoading(false);
      return;
    }
    setRoles(rolesResult.data);
    setPermissions(permissionsResult.data);
    setSelectedRoleId((prev) =>
      prev && rolesResult.data.some((r) => r.id === prev)
        ? prev
        : rolesResult.data[0]?.id ?? null,
    );
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const selectedRole = React.useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );
  const assignedPermissionIds = React.useMemo(
    () => permissionIdsOf(selectedRole),
    [selectedRole],
  );

  const availableRoleNames = React.useMemo(() => {
    const taken = new Set(roles.map((r) => r.name));
    return ROLE_NAMES.filter((name) => !taken.has(name));
  }, [roles]);

  const handleTogglePermission = React.useCallback(
    async (permission: PermissionDTO) => {
      if (!selectedRole) return;
      setTogglingPermissionId(permission.id);
      const isAssigned = assignedPermissionIds.has(permission.id);
      const result = isAssigned
        ? await removePermissionsFromRole(selectedRole.id, [permission.id])
        : await assignPermissionsToRole(selectedRole.id, [permission.id]);
      setTogglingPermissionId(null);
      if (!result.success) {
        showToast(
          result.error ||
            `Failed to ${isAssigned ? "remove" : "assign"} permission`,
          "error",
        );
        return;
      }
      showToast(
        isAssigned
          ? `Removed "${permission.name}" from ${roleLabel(selectedRole.name)}`
          : `Assigned "${permission.name}" to ${roleLabel(selectedRole.name)}`,
        "success",
      );
      void load();
    },
    [assignedPermissionIds, load, selectedRole, showToast],
  );

  const handleCreateRole = React.useCallback(async () => {
    if (!newRoleDescription.trim()) {
      showToast("Please add a description for the role.", "error");
      return;
    }
    setCreatingRole(true);
    const result = await createRole({
      name: newRoleName,
      description: newRoleDescription.trim(),
    });
    setCreatingRole(false);
    if (!result.success) {
      showToast(result.error || "Failed to create role", "error");
      return;
    }
    showToast(`Role "${roleLabel(newRoleName)}" created.`, "success");
    setShowNewRole(false);
    setNewRoleDescription("");
    if (result.data) setSelectedRoleId(result.data.id);
    void load();
  }, [load, newRoleDescription, newRoleName, showToast]);

  const handleCreatePermission = React.useCallback(async () => {
    if (!newPermissionName.trim()) {
      showToast("Please enter a permission name.", "error");
      return;
    }
    setCreatingPermission(true);
    const result = await createPermission({
      name: newPermissionName.trim(),
      description: newPermissionDescription.trim() || undefined,
    });
    setCreatingPermission(false);
    if (!result.success) {
      showToast(result.error || "Failed to create permission", "error");
      return;
    }
    showToast(`Permission "${newPermissionName.trim()}" created.`, "success");
    setShowNewPermission(false);
    setNewPermissionName("");
    setNewPermissionDescription("");
    void load();
  }, [load, newPermissionDescription, newPermissionName, showToast]);

  const handleDeletePermission = React.useCallback(
    async (permission: PermissionDTO) => {
      const confirmed = window.confirm(
        `Delete permission "${permission.name}"? This removes it from every role that has it assigned.`,
      );
      if (!confirmed) return;
      setDeletingPermissionId(permission.id);
      const result = await deletePermission(permission.id);
      setDeletingPermissionId(null);
      if (!result.success) {
        showToast(result.error || "Failed to delete permission", "error");
        return;
      }
      showToast(`Permission "${permission.name}" deleted.`, "success");
      void load();
    },
    [load, showToast],
  );

  return (
    <>
      <Head>
        <title>Dwelliva · Roles &amp; Permissions</title>
      </Head>
      <AdminLayout title="Roles & Permissions" showHeaderSearch={false}>
        <section className="w-full min-w-0 space-y-4">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Roles", String(roles.length)],
              ["Permissions", String(permissions.length)],
              [
                "Assigned this role",
                String(selectedRole?.permissions?.length ?? 0),
              ],
              ["Unassigned roles", String(availableRoleNames.length)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-[#E2E8F0] bg-white p-3"
              >
                <p className="text-[11px] text-[#64748B]">{label}</p>
                <p className="text-xl font-semibold sm:text-2xl">{value}</p>
              </div>
            ))}
          </div>

          {error ? (
            <p className="rounded-md bg-red-50 p-3 text-xs text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[280px_1fr]">
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">Roles</p>
                <button
                  type="button"
                  onClick={() => setShowNewRole((prev) => !prev)}
                  disabled={availableRoleNames.length === 0}
                  className="inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] px-2 py-1 text-[11px] font-medium text-[#0F172A] hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-50"
                  title={
                    availableRoleNames.length === 0
                      ? "All system roles already exist"
                      : "Create a role"
                  }
                >
                  <Plus className="h-3 w-3" />
                  New
                </button>
              </div>

              {showNewRole ? (
                <div className="mb-3 space-y-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                  <select
                    value={newRoleName}
                    onChange={(event) =>
                      setNewRoleName(event.target.value as RoleName)
                    }
                    className={fieldCls}
                  >
                    {availableRoleNames.map((name) => (
                      <option key={name} value={name}>
                        {roleLabel(name)}
                      </option>
                    ))}
                  </select>
                  <input
                    value={newRoleDescription}
                    onChange={(event) =>
                      setNewRoleDescription(event.target.value)
                    }
                    placeholder="Description"
                    className={fieldCls}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCreateRole()}
                      disabled={creatingRole}
                      className="flex-1 rounded-md bg-[#111827] py-1.5 text-[11px] font-medium text-white disabled:opacity-60"
                    >
                      {creatingRole ? "Creating…" : "Create"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewRole(false)}
                      className="flex-1 rounded-md border border-[#E2E8F0] py-1.5 text-[11px] font-medium text-[#0F172A]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-[#1E66FF]" />
                </div>
              ) : roles.length === 0 ? (
                <p className="rounded-md bg-[#F8FAFC] p-3 text-xs text-[#64748B]">
                  No roles yet.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`w-full rounded-md border p-2.5 text-left text-xs transition ${
                        selectedRoleId === role.id
                          ? "border-[#BFDBFE] bg-[#EFF6FF]"
                          : "border-[#E2E8F0] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <p className="font-medium">{roleLabel(role.name)}</p>
                      <p className="mt-0.5 text-[11px] text-[#64748B]">
                        {(role.permissions ?? []).length} permission
                        {(role.permissions ?? []).length === 1 ? "" : "s"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-4">
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                {!selectedRole ? (
                  <div className="flex items-center justify-center p-6">
                    <p className="text-sm text-[#64748B]">
                      Select a role to manage its permissions.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="inline-flex items-center gap-1.5 text-base font-semibold">
                          <Shield className="h-4 w-4 text-[#1E66FF]" />
                          {roleLabel(selectedRole.name)}
                        </p>
                        <p className="mt-1 text-xs text-[#64748B]">
                          {selectedRole.description ||
                            "No description provided."}
                        </p>
                      </div>
                    </div>

                    <p className="mb-2 mt-4 text-xs font-semibold text-[#0F172A]">
                      Permissions
                    </p>
                    {permissions.length === 0 ? (
                      <p className="rounded-md bg-[#F8FAFC] p-3 text-xs text-[#64748B]">
                        No permissions created yet. Use “New permission” below
                        to add one, then assign it here.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {permissions.map((permission) => {
                          const isAssigned = assignedPermissionIds.has(
                            permission.id,
                          );
                          const isToggling =
                            togglingPermissionId === permission.id;
                          return (
                            <label
                              key={permission.id}
                              className={`flex cursor-pointer items-start gap-2 rounded-md border p-2.5 text-xs transition ${
                                isAssigned
                                  ? "border-[#BFDBFE] bg-[#EFF6FF]"
                                  : "border-[#E2E8F0]"
                              } ${isToggling ? "opacity-60" : ""}`}
                            >
                              <input
                                type="checkbox"
                                className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-brand-main focus:ring-brand-main"
                                checked={isAssigned}
                                disabled={isToggling}
                                onChange={() =>
                                  void handleTogglePermission(permission)
                                }
                              />
                              <span>
                                <span className="font-medium">
                                  {permission.name}
                                </span>
                                {permission.description ? (
                                  <span className="block text-[11px] text-[#64748B]">
                                    {permission.description}
                                  </span>
                                ) : null}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">All Permissions</p>
                  <button
                    type="button"
                    onClick={() => setShowNewPermission((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] px-2 py-1 text-[11px] font-medium text-[#0F172A] hover:bg-[#F1F5F9]"
                  >
                    <Plus className="h-3 w-3" />
                    New permission
                  </button>
                </div>

                {showNewPermission ? (
                  <div className="mt-3 grid grid-cols-1 gap-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 sm:grid-cols-[1fr_1fr_auto]">
                    <input
                      value={newPermissionName}
                      onChange={(event) =>
                        setNewPermissionName(event.target.value)
                      }
                      placeholder="e.g. manage_properties"
                      className={fieldCls}
                    />
                    <input
                      value={newPermissionDescription}
                      onChange={(event) =>
                        setNewPermissionDescription(event.target.value)
                      }
                      placeholder="Description (optional)"
                      className={fieldCls}
                    />
                    <button
                      type="button"
                      onClick={() => void handleCreatePermission()}
                      disabled={creatingPermission}
                      className="rounded-md bg-[#111827] px-4 text-[11px] font-medium text-white disabled:opacity-60"
                    >
                      {creatingPermission ? "Creating…" : "Create"}
                    </button>
                  </div>
                ) : null}

                <div className="mt-3 overflow-auto">
                  <table className="w-full min-w-[420px] text-xs">
                    <thead className="text-[#64748B]">
                      <tr>
                        <th className="py-2 text-left">Name</th>
                        <th className="py-2 text-left">Description</th>
                        <th className="py-2 text-left">Roles</th>
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {permissions.map((permission) => (
                        <tr
                          key={permission.id}
                          className="border-t border-[#F1F5F9]"
                        >
                          <td className="py-2 font-medium">
                            {permission.name}
                          </td>
                          <td className="py-2 text-[#64748B]">
                            {permission.description || "—"}
                          </td>
                          <td className="py-2 text-[#64748B]">
                            {
                              roles.filter((r) =>
                                permissionIdsOf(r).has(permission.id),
                              ).length
                            }
                          </td>
                          <td className="py-2 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                void handleDeletePermission(permission)
                              }
                              disabled={deletingPermissionId === permission.id}
                              className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {permissions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="py-4 text-center text-[#64748B]"
                          >
                            No permissions yet.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default AdminRolesPermissionsPage;
