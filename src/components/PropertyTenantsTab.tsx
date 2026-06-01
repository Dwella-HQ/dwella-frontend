import * as React from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { MessageSquare, User, Users, Plus, Mail, Loader2 } from "lucide-react";
import { AddTenantModal } from "@/components/AddTenantModal";
import {
  INVITE_STATUSES,
  getInvitedTenantsForProperty,
  type InviteStatus,
  type InvitedTenantDTO,
} from "@/api/tenants";
import type { Tenant } from "@/data/mockLandlordData";

export type PropertyTenantsTabProps = {
  tenants: Tenant[];
  propertyId: string;
};

function displayName(inv: InvitedTenantDTO): string {
  return (
    inv.fullName?.trim() ||
    inv.name?.trim() ||
    inv.email?.split("@")[0] ||
    "Invited tenant"
  );
}

function formatInvitedDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusPillClass(status?: string): string {
  const normalized = (status ?? "").trim().toLowerCase();
  if (normalized === "accepted") return "bg-green-100 text-green-800";
  if (normalized === "rejected") return "bg-red-100 text-red-800";
  if (normalized === "expired") return "bg-gray-200 text-gray-700";
  return "bg-amber-100 text-amber-900";
}

const messageTenantHref = (tenantId: string | number) =>
  `/dashboard/messages?role=tenant&roleId=${encodeURIComponent(String(tenantId))}`;

export const PropertyTenantsTab = ({
  tenants,
  propertyId,
}: PropertyTenantsTabProps) => {
  const router = useRouter();
  const [isAddTenantOpen, setIsAddTenantOpen] = React.useState(false);
  const [invited, setInvited] = React.useState<InvitedTenantDTO[]>([]);
  const [inviteStatusFilter, setInviteStatusFilter] = React.useState<
    InviteStatus | "all"
  >("all");
  const [invitedLoading, setInvitedLoading] = React.useState(true);
  const [invitedError, setInvitedError] = React.useState<string | null>(null);

  const loadInvited = React.useCallback(async () => {
    if (!propertyId) return;
    setInvitedLoading(true);
    setInvitedError(null);
    const result = await getInvitedTenantsForProperty(
      propertyId,
      inviteStatusFilter,
    );
    if (result.success) {
      setInvited(result.data);
    } else {
      setInvited([]);
      setInvitedError(result.error);
    }
    setInvitedLoading(false);
  }, [propertyId, inviteStatusFilter]);

  React.useEffect(() => {
    loadInvited();
  }, [loadInvited]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-6 lg:items-start">
        {/* Current tenants */}
        <div className="min-w-0 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Current Tenants</h2>
            <p className="mt-1 text-sm text-gray-600">
              Tenants currently assigned to this property.
            </p>
          </div>

          {tenants.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-1 xl:grid-cols-2">
              {tenants.map((tenant, index) => (
                <motion.div
                  key={tenant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-main text-sm font-semibold text-white">
                      {getInitials(tenant.name)}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        {tenant.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {tenant.phone}
                      </p>
                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">UNIT:</span>{" "}
                          {tenant.unitId}
                        </p>
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">RENT/LEASE ENDS:</span>{" "}
                          {tenant.leaseEnd}
                        </p>
                      </div>
                      <div className="mt-3">
                        <span className="inline-flex rounded-full bg-brand-green px-3 py-1 text-xs font-medium text-white">
                          Paid
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <motion.button
                      type="button"
                      onClick={() => router.push(messageTenantHref(tenant.id))}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Message
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() =>
                        router.push(`/dashboard/tenants/${tenant.id}`)
                      }
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 rounded-lg bg-brand-main px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-main/90 flex items-center justify-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-12 px-6 rounded-lg border border-gray-200 bg-white"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                No Tenants
              </p>
              <p className="text-xs text-gray-500 text-center mb-4">
                No tenants are currently assigned to this property.
              </p>
              <motion.button
                type="button"
                onClick={() => setIsAddTenantOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
                Add Tenant
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* Invited tenants */}
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Invited Tenants
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Invitations sent to potential tenants.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Status
              </label>
              <select
                value={inviteStatusFilter}
                onChange={(e) =>
                  setInviteStatusFilter(e.target.value as InviteStatus | "all")
                }
                className="h-9 w-[150px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
              >
                <option value="all">All</option>
                {INVITE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {invitedLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-12 text-sm text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              Loading invitations…
            </div>
          ) : invitedError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Could not load invitations. {invitedError}
            </div>
          ) : invited.length > 0 ? (
            <ul className="space-y-3">
              {invited.map((inv, index) => {
                const name = displayName(inv);
                const email = inv.email ?? "—";
                const unitLabel =
                  inv.unitName?.trim() ||
                  inv.unit?.name?.trim() ||
                  (inv.unitId ? `Unit ref. ${inv.unitId.slice(0, 8)}…` : "—");
                const when = formatInvitedDate(inv.invitedAt || inv.createdAt);
                const statusLabel = inv.status?.trim()
                  ? `${inv.status.trim().slice(0, 1).toUpperCase()}${inv.status
                      .trim()
                      .slice(1)}`
                  : "Pending";

                return (
                  <motion.li
                    key={inv.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                        {getInitials(name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-600 truncate">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                          <span className="truncate">{email}</span>
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-gray-500">
                            <span className="font-medium text-gray-600">
                              Unit:
                            </span>{" "}
                            {unitLabel}
                          </span>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPillClass(
                              inv.status,
                            )}`}
                          >
                            {statusLabel}
                          </span>
                          {when && (
                            <span className="text-xs text-gray-400">
                              Invited {when}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/50 py-10 px-4 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                <Mail className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900">
                No pending invites
              </p>
              <p className="mt-1 max-w-sm text-xs text-gray-500">
                No invitations found for the selected status.
              </p>
            </div>
          )}
        </div>
      </div>

      <AddTenantModal
        isOpen={isAddTenantOpen}
        onClose={() => setIsAddTenantOpen(false)}
        propertyId={propertyId}
        onSuccess={loadInvited}
      />
    </div>
  );
};
