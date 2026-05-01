import Head from "next/head";
import { useRouter } from "next/router";
import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Check,
  Wrench,
  Trash2,
  Pencil,
  AlertCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  getMaintenanceRequest,
  deleteMaintenanceRequest,
  updateMaintenanceRequestStatus,
} from "@/api/maintenance";
import type { MaintenanceRequestItemDTO } from "@/api/maintenance";
import { getTenantByUser } from "@/api/tenants";
import { useUser } from "@/contexts/UserContext";
import { maintenanceRequestOwnedByTenant } from "@/utils/maintenanceTenantAccess";
import { EditMaintenanceRequestModal } from "@/components/EditMaintenanceRequestModal";
import type { NextPageWithLayout } from "../../_app";

function normalizeStatus(s: string | undefined): string {
  const v = (s ?? "").toLowerCase();
  if (v === "in_progress" || v === "in progress") return "In Progress";
  if (v === "resolved" || v === "completed") return "Resolved";
  if (v === "pending") return "Pending";
  return "New";
}

function normalizePriority(p: string | undefined): string {
  const v = (p ?? "").toLowerCase();
  if (v === "high") return "High";
  if (v === "low") return "Low";
  return "Medium";
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

function extractPropertyDisplay(
  request: MaintenanceRequestItemDTO | null,
): string {
  if (!request) return "";
  const flat =
    request.propertyName ??
    (request as { property_name?: string }).property_name;
  if (flat && typeof flat === "string") return flat;
  return extractName((request as { property?: unknown }).property);
}

function extractTenantDisplay(
  request: MaintenanceRequestItemDTO | null,
): string {
  if (!request) return "";
  const flat =
    request.tenantName ?? (request as { tenant_name?: string }).tenant_name;
  if (flat && typeof flat === "string") return flat;
  const tenant = (request as { tenant?: Record<string, unknown> }).tenant;
  if (!tenant || typeof tenant !== "object") return "";
  if (typeof (tenant as { name?: string }).name === "string")
    return (tenant as { name: string }).name;
  const user = tenant.user as Record<string, unknown> | undefined;
  if (user && typeof user === "object") {
    const fullName = user.fullName ?? user.full_name;
    if (typeof fullName === "string") return fullName;
    if (typeof (user as { name?: string }).name === "string")
      return (user as { name: string }).name;
  }
  const email = tenant.email;
  if (typeof email === "string") return email;
  // Fallbacks when API returns tenant without name/user: use employerName or id-based label
  const employerName = tenant.employerName ?? tenant.employer_name;
  if (typeof employerName === "string" && employerName.trim())
    return employerName.trim();
  const id = tenant.id;
  if (typeof id === "string") return `Tenant (${id.slice(-8)})`;
  return "Tenant";
}

const MaintenanceRequestDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { user } = useUser();
  const id = router.query.id as string | undefined;
  const [request, setRequest] =
    React.useState<MaintenanceRequestItemDTO | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isMarkingResolved, setIsMarkingResolved] = React.useState(false);
  const [tenantGate, setTenantGate] = React.useState<{
    loading: boolean;
    error: boolean;
    tenantId: string | null;
  }>({ loading: false, error: false, tenantId: null });

  const isTenant = user?.role === "tenant";
  const isLandlordOrManager =
    user?.role === "landlord" || user?.role === "property_manager";

  React.useEffect(() => {
    if (!user?.id || user.role !== "tenant") {
      setTenantGate({ loading: false, error: false, tenantId: null });
      return;
    }
    let cancelled = false;
    setTenantGate({ loading: true, error: false, tenantId: null });
    void getTenantByUser(String(user.id)).then((r) => {
      if (cancelled) return;
      if (r.success && r.data?.id) {
        setTenantGate({ loading: false, error: false, tenantId: r.data.id });
      } else {
        setTenantGate({ loading: false, error: true, tenantId: null });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  const tenantAllowedToViewRequest = React.useMemo(() => {
    if (!isTenant || !request) return true;
    if (tenantGate.error || !tenantGate.tenantId) return false;
    return maintenanceRequestOwnedByTenant(
      request,
      tenantGate.tenantId,
      user?.id != null ? String(user.id) : undefined,
    );
  }, [isTenant, request, tenantGate.error, tenantGate.tenantId, user?.id]);

  const canEdit = isTenant && tenantAllowedToViewRequest;
  const showMarkResolved =
    isLandlordOrManager &&
    request &&
    normalizeStatus(request.status) !== "Resolved";

  const pageLoading = loading || (isTenant && tenantGate.loading);

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMaintenanceRequest(id)
      .then((result) => {
        if (cancelled) return;
        if (result.success) setRequest(result.data);
        else setError(result.error ?? "Failed to load request");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleEditSuccess = React.useCallback(
    (updated: MaintenanceRequestItemDTO) => {
      setRequest(updated);
      setIsEditOpen(false);
    },
    [],
  );

  const handleDeleteConfirm = React.useCallback(async () => {
    if (!id || !canEdit) return;
    setIsDeleting(true);
    const result = await deleteMaintenanceRequest(id);
    setIsDeleting(false);
    setIsDeleteConfirmOpen(false);
    if (result.success) {
      router.push("/dashboard/maintenance");
    }
  }, [id, router, canEdit]);

  const handleMarkResolved = React.useCallback(async () => {
    if (!id || !request) return;
    setIsMarkingResolved(true);
    const result = await updateMaintenanceRequestStatus(id, {
      status: "COMPLETED",
    });
    setIsMarkingResolved(false);
    if (result.success && result.data) {
      setRequest(result.data);
    }
  }, [id, request]);

  const status = request?.status ? normalizeStatus(request.status) : "";
  const priority = request?.priority ? normalizePriority(request.priority) : "";
  const reportedTime =
    request?.reportedTime ??
    request?.reported_time ??
    request?.createdAt ??
    request?.created_at ??
    "";
  const typeLabel = request ? formatLabel(extractName(request.type)) : "";
  const subTypeLabel = request
    ? formatLabel(extractName(request.subType ?? request.sub_type))
    : "";
  const unitLabel =
    typeof request?.unit === "string"
      ? request.unit
      : extractName(request?.unit ?? "");
  const propertyLabel = extractPropertyDisplay(request ?? null);
  const tenantLabel = extractTenantDisplay(request ?? null);

  return (
    <>
      <Head>
        <title>Maintenance Request | DWELLA NG</title>
      </Head>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/dashboard/maintenance"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Maintenance
          </Link>
        </div>

        {pageLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        )}

        {!pageLoading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Could not load request
              </p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {!pageLoading &&
          !error &&
          isTenant &&
          tenantGate.error && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Could not verify your account
                </p>
                <p className="text-sm text-amber-800 mt-1">
                  Refresh the page or sign in again to view maintenance requests.
                </p>
              </div>
            </div>
          )}

        {!pageLoading &&
          !error &&
          isTenant &&
          !tenantGate.error &&
          request &&
          !tenantAllowedToViewRequest && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-900">
                You don&apos;t have access to this maintenance request
              </p>
              <p className="text-sm text-gray-600 mt-1">
                You can only open requests submitted under your tenant account.
              </p>
              <Link
                href="/dashboard/maintenance"
                className="inline-flex mt-4 text-sm font-medium text-brand-main hover:underline"
              >
                Back to Maintenance
              </Link>
            </div>
          )}

        {!pageLoading &&
          !error &&
          request &&
          (!isTenant ||
            (!tenantGate.error && tenantAllowedToViewRequest)) && (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-4 py-4 sm:px-6 sm:flex sm:items-center sm:justify-between">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {request.title ||
                    `${typeLabel || "Request"}${
                      subTypeLabel ? ` — ${subTypeLabel}` : ""
                    }`}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  ID: {request.requestId ?? request.request_id ?? request.id}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2 sm:mt-0">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    status === "Resolved"
                      ? "bg-green-100 text-green-700"
                      : status === "In Progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {status === "Resolved" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Clock className="h-3 w-3" />
                  )}
                  {status}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    priority === "High"
                      ? "bg-red-100 text-red-700"
                      : priority === "Low"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {priority}
                </span>
                {canEdit && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditOpen(true)}
                      disabled={status === "Resolved"}
                      title={
                        status === "Resolved"
                          ? "Resolved requests cannot be edited"
                          : undefined
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </>
                )}
                {showMarkResolved && (
                  <button
                    type="button"
                    onClick={handleMarkResolved}
                    disabled={isMarkingResolved}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-70"
                  >
                    <Check className="h-4 w-4" />
                    {isMarkingResolved ? "Marking…" : "Mark as Resolved"}
                  </button>
                )}
              </div>
            </div>

            <div className="px-4 py-4 sm:px-6 space-y-6">
              <div>
                <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Description
                </h2>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {request.description || "—"}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Type
                  </h2>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {typeLabel || "—"}
                  </p>
                </div>
                <div>
                  <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Sub-type
                  </h2>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {subTypeLabel || "—"}
                  </p>
                </div>
                <div>
                  <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Property
                  </h2>
                  <p className="mt-1 text-sm text-gray-900">
                    {propertyLabel || "—"}
                  </p>
                </div>
                <div>
                  <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Unit
                  </h2>
                  <p className="mt-1 text-sm text-gray-900">
                    {unitLabel || "—"}
                  </p>
                </div>
                <div>
                  <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Tenant
                  </h2>
                  <p className="mt-1 text-sm text-gray-900">
                    {tenantLabel || "—"}
                  </p>
                </div>
                <div>
                  <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Reported
                  </h2>
                  <p className="mt-1 text-sm text-gray-900">
                    {reportedTime
                      ? new Date(reportedTime).toLocaleString()
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirmation */}
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
            <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
              <p className="text-sm font-medium text-gray-900">
                Delete this maintenance request?
              </p>
              <p className="mt-1 text-xs text-gray-500">
                This action cannot be undone.
              </p>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70"
                >
                  {isDeleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {request && canEdit && status !== "Resolved" && (
        <EditMaintenanceRequestModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          requestId={request.id}
          initialRequest={request}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};

MaintenanceRequestDetailPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default MaintenanceRequestDetailPage;
