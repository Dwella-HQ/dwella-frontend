import Head from "next/head";
import { useRouter } from "next/router";
import * as React from "react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/components/Toast";
import { uploadFile } from "@/api/files";
import { useUser } from "@/contexts/UserContext";
import {
  deriveVerificationKind,
  entityLandlordId,
  entityPropertyId,
  formatReason,
  getLandlordNested,
  getPropertyNested,
  getVerifiedByNested,
  getVerificationById,
  getVerifications,
  patchLandlordVerificationStatus,
  patchPropertyVerificationStatus,
  type VerificationDTO,
  type VerificationFileRef,
  verificationSubjectLabel,
} from "@/api/verification";
import {
  BadgeCheck,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Paperclip,
  RefreshCw,
  XCircle,
} from "lucide-react";

function formatShortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

function formatWhen(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusBadgeClass(status: string): string {
  const u = status.toUpperCase();
  if (u === "VERIFIED") return "bg-emerald-100 text-emerald-800";
  if (u === "REJECTED") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-900";
}

function kindLabel(kind: "landlord" | "property"): string {
  return kind === "property" ? "Property" : "Landlord";
}

const QUEUE_PAGE_SIZE = 10;

function dateMs(value?: string | null): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function verificationSortTime(row: VerificationDTO): number {
  return dateMs(row.updatedAt) || dateMs(row.createdAt) || dateMs(row.verifiedAt);
}

function DocLink({
  label,
  file,
}: {
  label: string;
  file?: VerificationFileRef | null;
}) {
  if (!file?.url) return null;
  const titleAttr =
    file.fileName != null ? `${label}: ${file.fileName}` : label;
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      title={titleAttr}
      className="flex min-h-0 min-w-0 w-full max-w-full items-center gap-2 overflow-hidden rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[12px] text-[#1E66FF] transition hover:bg-[#F8FAFC]"
    >
      <FileText className="h-3.5 w-3.5 shrink-0 opacity-70" />
      <span className="min-w-0 flex-1 overflow-hidden">
        <span className="block truncate font-medium text-[#0F172A]">
          {label}
        </span>
        {file.fileName ? (
          <span
            className="block truncate text-[11px] leading-snug text-[#64748B]"
            title={file.fileName}
          >
            {file.fileName}
          </span>
        ) : null}
      </span>
      <ExternalLink className="h-3 w-3 shrink-0 opacity-50" aria-hidden />
    </a>
  );
}

const AdminVerificationsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { user } = useUser();
  const { showToast } = useToast();
  const [rows, setRows] = React.useState<VerificationDTO[]>([]);
  const [listLoading, setListLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<VerificationDTO | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  const [filterStatus, setFilterStatus] = React.useState<
    "all" | "PENDING" | "VERIFIED" | "REJECTED"
  >("all");
  const [filterKind, setFilterKind] = React.useState<
    "all" | "landlord" | "property"
  >("all");
  const [queuePage, setQueuePage] = React.useState(1);

  const [actionBusy, setActionBusy] = React.useState<
    "verify" | "reject" | null
  >(null);
  const [pendingAction, setPendingAction] = React.useState<
    "VERIFIED" | "REJECTED" | null
  >(null);
  const [actionReason, setActionReason] = React.useState("");
  const [supportingFiles, setSupportingFiles] = React.useState<File[]>([]);
  const [modalError, setModalError] = React.useState<string | null>(null);

  const queryPropertyId = React.useMemo(() => {
    const value = router.query.propertyId;
    return Array.isArray(value) ? value[0] : value;
  }, [router.query.propertyId]);

  const loadList = React.useCallback(async () => {
    setListLoading(true);
    setListError(null);
    const result = await getVerifications();
    setListLoading(false);
    if (!result.success) {
      setListError(result.error);
      setRows([]);
      return;
    }
    setRows(result.data);
  }, []);

  React.useEffect(() => {
    void loadList();
  }, [loadList]);

  const loadDetail = React.useCallback(
    async (id: string) => {
      setDetailLoading(true);
      setDetail(null);
      const result = await getVerificationById(id);
      setDetailLoading(false);
      if (!result.success) {
        showToast(result.error || "Could not load verification", "error");
        return;
      }
      setDetail(result.data);
    },
    [showToast],
  );

  React.useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const filteredRows = React.useMemo(() => {
    return rows
      .filter((row) => {
        const kind = deriveVerificationKind(row);
        if (filterKind !== "all" && kind !== filterKind) return false;
        const st = String(row.status).toUpperCase();
        if (filterStatus !== "all" && st !== filterStatus) return false;
        return true;
      })
      .sort((a, b) => verificationSortTime(b) - verificationSortTime(a));
  }, [rows, filterKind, filterStatus]);

  const queuePageCount = Math.max(
    1,
    Math.ceil(filteredRows.length / QUEUE_PAGE_SIZE),
  );
  const safeQueuePage = Math.min(queuePage, queuePageCount);
  const paginatedRows = React.useMemo(() => {
    const start = (safeQueuePage - 1) * QUEUE_PAGE_SIZE;
    return filteredRows.slice(start, start + QUEUE_PAGE_SIZE);
  }, [filteredRows, safeQueuePage]);
  const firstQueueRecord =
    filteredRows.length === 0 ? 0 : (safeQueuePage - 1) * QUEUE_PAGE_SIZE + 1;
  const lastQueueRecord = Math.min(
    safeQueuePage * QUEUE_PAGE_SIZE,
    filteredRows.length,
  );

  const queuePaginationItems = React.useMemo<(number | "ellipsis")[]>(() => {
    if (queuePageCount <= 5) {
      return Array.from({ length: queuePageCount }, (_, index) => index + 1);
    }
    const pages = new Set([
      1,
      queuePageCount,
      safeQueuePage - 1,
      safeQueuePage,
      safeQueuePage + 1,
    ]);
    const sorted = [...pages]
      .filter((pageNumber) => pageNumber >= 1 && pageNumber <= queuePageCount)
      .sort((a, b) => a - b);
    const items: (number | "ellipsis")[] = [];
    sorted.forEach((pageNumber, index) => {
      const previous = sorted[index - 1];
      if (previous && pageNumber - previous > 1) items.push("ellipsis");
      items.push(pageNumber);
    });
    return items;
  }, [queuePageCount, safeQueuePage]);

  React.useEffect(() => {
    setQueuePage(1);
  }, [filterKind, filterStatus, rows.length]);

  React.useEffect(() => {
    setQueuePage((current) => Math.min(current, queuePageCount));
  }, [queuePageCount]);

  React.useEffect(() => {
    if (!router.isReady || !queryPropertyId || listLoading) return;
    const match = rows.find((row) => {
      return (
        deriveVerificationKind(row) === "property" &&
        entityPropertyId(row) === queryPropertyId
      );
    });
    setFilterKind("property");
    setFilterStatus("all");
    if (match) {
      setSelectedId((current) => (current === match.id ? current : match.id));
      const matchingRows = rows
        .filter((row) => deriveVerificationKind(row) === "property")
        .sort((a, b) => verificationSortTime(b) - verificationSortTime(a));
      const matchIndex = matchingRows.findIndex((row) => row.id === match.id);
      if (matchIndex >= 0) {
        setQueuePage(Math.floor(matchIndex / QUEUE_PAGE_SIZE) + 1);
      }
    }
  }, [listLoading, queryPropertyId, router.isReady, rows]);

  const selectedKind = detail ? deriveVerificationKind(detail) : null;

  const openActionModal = React.useCallback(
    (status: "VERIFIED" | "REJECTED") => {
      if (!detail) return;
      const st = String(detail.status).toUpperCase();
      if (st === status) {
        showToast(
          status === "VERIFIED" ? "Already verified" : "Already rejected",
          "info",
        );
        return;
      }
      if (status === "VERIFIED" && st === "REJECTED") {
        showToast("Rejected records cannot be marked verified.", "info");
        return;
      }
      setPendingAction(status);
      setActionReason("");
      setSupportingFiles([]);
      setModalError(null);
    },
    [detail, showToast],
  );

  const closeActionModal = React.useCallback(() => {
    if (actionBusy) return;
    setPendingAction(null);
    setActionReason("");
    setSupportingFiles([]);
    setModalError(null);
  }, [actionBusy]);

  const handleConfirmAction = React.useCallback(async () => {
    if (!detail || !selectedKind || !pendingAction || actionBusy) return;
    const reason = actionReason.trim();
    if (!reason) {
      setModalError("Reason is required.");
      return;
    }

    const busyState = pendingAction === "VERIFIED" ? "verify" : "reject";
    setActionBusy(busyState);
    setModalError(null);

    const supportingDocumentIds: string[] = [];
    for (const file of supportingFiles) {
      const uploadResult = await uploadFile({
        file,
        folder: "verification",
        label: "verification_supporting_document",
        token: user?.token,
      });
      if (!uploadResult.success) {
        setActionBusy(null);
        setModalError(
          uploadResult.error || "Failed to upload supporting file.",
        );
        return;
      }
      supportingDocumentIds.push(uploadResult.data.id);
    }

    const patch =
      selectedKind === "property"
        ? patchPropertyVerificationStatus
        : patchLandlordVerificationStatus;
    const result = await patch(detail.id, {
      status: pendingAction,
      reason,
      supportingDocumentIds:
        supportingDocumentIds.length > 0 ? supportingDocumentIds : undefined,
    });
    setActionBusy(null);
    if (!result.success) {
      setModalError(result.error || "Verification update failed");
      return;
    }

    showToast(
      pendingAction === "VERIFIED"
        ? "Marked as verified"
        : "Marked as rejected",
      "success",
    );
    closeActionModal();
    await loadList();
    const refreshed = await getVerificationById(detail.id);
    if (refreshed.success) {
      setDetail(refreshed.data);
    }
  }, [
    actionBusy,
    actionReason,
    closeActionModal,
    detail,
    loadList,
    pendingAction,
    selectedKind,
    showToast,
    supportingFiles,
    user?.token,
  ]);

  return (
    <>
      <Head>
        <title>Dwelliva · Verifications</title>
      </Head>
      <AdminLayout title="Verifications">
        <section className="w-full min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-white px-4 py-3">
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A]">
                Landlord &amp; property verification
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadList()}
              disabled={listLoading}
              className="inline-flex items-center gap-2 rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[12px] font-medium text-[#0F172A] transition hover:bg-[#F8FAFC] disabled:opacity-50"
            >
              {listLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Refresh
            </button>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
            <div className="flex flex-col rounded-lg border border-[#E2E8F0] bg-white">
              <div className="border-b border-[#E2E8F0] p-3">
                <p className="mb-2 text-[12px] font-semibold text-[#0F172A]">
                  Queue
                </p>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) =>
                      setFilterStatus(e.target.value as typeof filterStatus)
                    }
                    className="h-8 rounded-md border border-[#E2E8F0] bg-white px-2 text-[11px] text-[#0F172A]"
                  >
                    <option value="all">All statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                  <select
                    value={filterKind}
                    onChange={(e) =>
                      setFilterKind(e.target.value as typeof filterKind)
                    }
                    className="h-8 rounded-md border border-[#E2E8F0] bg-white px-2 text-[11px] text-[#0F172A]"
                  >
                    <option value="all">All types</option>
                    <option value="landlord">Landlord</option>
                    <option value="property">Property</option>
                  </select>
                </div>
              </div>

              <div className="max-h-[min(640px,calc(100vh-220px))] overflow-y-auto p-2">
                {listLoading && (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-[#64748B]" />
                  </div>
                )}
                {!listLoading && listError && (
                  <p className="px-2 py-6 text-center text-[12px] text-red-600">
                    {listError}
                  </p>
                )}
                {!listLoading && !listError && filteredRows.length === 0 && (
                  <p className="px-2 py-8 text-center text-[12px] text-[#64748B]">
                    No verifications match these filters.
                  </p>
                )}
                {!listLoading &&
                  !listError &&
                  paginatedRows.map((row) => {
                    const kind = deriveVerificationKind(row);
                    const active = selectedId === row.id;
                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => setSelectedId(row.id)}
                        className={`mb-2 w-full rounded-md border p-3 text-left text-[11px] transition ${
                          active
                            ? "border-[#BFDBFE] bg-[#EFF6FF]"
                            : "border-[#E2E8F0] hover:bg-[#F8FAFC]"
                        }`}
                      >
                        <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-[#0F172A]">
                          {verificationSubjectLabel(row)}
                        </p>
                        <div className="mt-1.5 flex items-start justify-between gap-2">
                          <span className="font-mono text-[10px] text-[#64748B]">
                            {formatShortId(row.id)}
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusBadgeClass(
                              String(row.status),
                            )}`}
                          >
                            {String(row.status)}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className="rounded bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-medium text-[#3730A3]">
                            {kindLabel(kind)}
                          </span>
                          {row.type ? (
                            <span className="rounded bg-[#F1F5F9] px-2 py-0.5 text-[10px] text-[#475569]">
                              {row.type.replace(/_VERIFICATION$/, "")}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-[10px] text-[#94A3B8]">
                          Updated {formatWhen(row.updatedAt)}
                        </p>
                      </button>
                    );
                  })}
              </div>
              {!listLoading && !listError && filteredRows.length > 0 ? (
                <div className="flex flex-col gap-2 border-t border-[#E2E8F0] px-3 py-2 text-[11px] text-[#64748B]">
                  <p>
                    Showing {firstQueueRecord}-{lastQueueRecord} of{" "}
                    {filteredRows.length}
                  </p>
                  <div className="inline-flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setQueuePage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={safeQueuePage <= 1}
                      className="rounded border border-[#E2E8F0] bg-white px-2 py-0.5 hover:bg-[#F8FAFC] disabled:opacity-40"
                    >
                      Prev
                    </button>
                    {queuePaginationItems.map((item, index) =>
                      item === "ellipsis" ? (
                        <span
                          key={`queue-ellipsis-${index}`}
                          className="px-1 text-[#94A3B8]"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setQueuePage(item)}
                          aria-current={
                            item === safeQueuePage ? "page" : undefined
                          }
                          className={`rounded border px-2 py-0.5 ${
                            item === safeQueuePage
                              ? "border-[#1E66FF] bg-[#1E66FF] text-white"
                              : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]"
                          }`}
                        >
                          {item}
                        </button>
                      ),
                    )}
                    <span className="px-1">/ {queuePageCount}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setQueuePage((prev) =>
                          Math.min(queuePageCount, prev + 1),
                        )
                      }
                      disabled={safeQueuePage >= queuePageCount}
                      className="rounded border border-[#E2E8F0] bg-white px-2 py-0.5 hover:bg-[#F8FAFC] disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="min-h-[420px] min-w-0 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white p-5">
              {!selectedId && (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center text-[13px] text-[#64748B]">
                  <BadgeCheck className="mb-3 h-10 w-10 text-[#CBD5E1]" />
                  Select a verification to view its details.
                </div>
              )}
              {selectedId && detailLoading && (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 text-[#64748B]">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-[12px]">Loading details…</span>
                </div>
              )}
              {selectedId &&
                !detailLoading &&
                detail &&
                (() => {
                  const d = detail;
                  const land = getLandlordNested(d);
                  const prop = getPropertyNested(d);
                  const admin = getVerifiedByNested(d);
                  const reasonText = formatReason(d.reason);
                  const landlordIdDisp = entityLandlordId(d);
                  const propertyIdDisp = entityPropertyId(d);

                  return (
                    <div className="min-w-0 space-y-5">
                      <div>
                        <p className="text-[20px] font-semibold leading-tight text-[#0F172A]">
                          {verificationSubjectLabel(d)}
                        </p>
                        <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-[#64748B]">
                          Verification reference
                        </p>
                        <p className="break-all font-mono text-[12px] text-[#334155]">
                          {d.id}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[11px] font-medium text-[#3730A3]">
                            {selectedKind ? kindLabel(selectedKind) : "—"}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${statusBadgeClass(
                              String(d.status),
                            )}`}
                          >
                            {String(d.status)}
                          </span>
                          {d.type ? (
                            <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[11px] text-[#475569]">
                              {String(d.type).replace(/_VERIFICATION$/, "")}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <dl className="grid gap-3 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-md bg-[#F8FAFC] px-3 py-2">
                          <dt className="text-[11px] text-[#64748B]">
                            Landlord reference
                          </dt>
                          <dd className="mt-1 font-mono text-[12px] break-all">
                            {landlordIdDisp ?? "—"}
                          </dd>
                        </div>
                        <div className="rounded-md bg-[#F8FAFC] px-3 py-2">
                          <dt className="text-[11px] text-[#64748B]">
                            Property reference
                          </dt>
                          <dd className="mt-1 font-mono text-[12px] break-all">
                            {propertyIdDisp ?? "—"}
                          </dd>
                        </div>
                        <div className="rounded-md bg-[#F8FAFC] px-3 py-2">
                          <dt className="text-[11px] text-[#64748B]">
                            Verified at
                          </dt>
                          <dd className="mt-1">
                            {formatWhen(d.verifiedAt ?? undefined)}
                          </dd>
                        </div>
                        <div className="rounded-md bg-[#F8FAFC] px-3 py-2 sm:col-span-2 lg:col-span-3">
                          <dt className="text-[11px] text-[#64748B]">Reason</dt>
                          <dd className="mt-1 text-[#334155]">
                            {reasonText ?? "—"}
                          </dd>
                        </div>
                        <div className="rounded-md bg-[#F8FAFC] px-3 py-2">
                          <dt className="text-[11px] text-[#64748B]">
                            Created
                          </dt>
                          <dd className="mt-1">{formatWhen(d.createdAt)}</dd>
                        </div>
                        <div className="rounded-md bg-[#F8FAFC] px-3 py-2">
                          <dt className="text-[11px] text-[#64748B]">
                            Updated
                          </dt>
                          <dd className="mt-1">{formatWhen(d.updatedAt)}</dd>
                        </div>
                      </dl>

                      {admin?.email || admin?.fullName ? (
                        <div className="rounded-lg border border-[#E2E8F0] bg-[#FAFBFC] p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                            Verified by
                          </p>
                          <p className="mt-2 text-[14px] font-medium text-[#0F172A]">
                            {admin.fullName ?? "—"}
                          </p>
                          <p className="text-[13px] text-[#475569]">
                            {admin.email ?? "—"}
                          </p>
                          {admin.role?.name ? (
                            <p className="mt-1 text-[11px] text-[#64748B]">
                              Role: {admin.role.name}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      {land ? (
                        <div className="min-w-0 rounded-lg border border-[#E2E8F0] p-4">
                          <p className="text-[12px] font-semibold text-[#0F172A]">
                            Landlord
                          </p>
                          <div className="mt-3 flex flex-wrap gap-4">
                            {land.profilePicture?.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={land.profilePicture.url}
                                alt=""
                                className="h-16 w-16 shrink-0 rounded-lg border border-[#E2E8F0] object-cover"
                              />
                            ) : null}
                            <div className="min-w-0 flex-1 space-y-1 text-[13px]">
                              <p className="font-medium">
                                {land.businessName ?? "—"}
                              </p>
                              <p className="text-[#475569]">
                                {land.businessEmail ?? land.user?.email ?? "—"}
                              </p>
                              {(land.businessPhoneNumber ||
                                land.user?.phoneNumber) && (
                                <p className="text-[#475569]">
                                  {land.businessPhoneNumber ??
                                    land.user?.phoneNumber}
                                </p>
                              )}
                              {land.address ? (
                                <p className="flex gap-1.5 text-[12px] text-[#64748B]">
                                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                  <span>
                                    {[
                                      land.address.address,
                                      land.address.city,
                                      land.address.state,
                                      land.address.country,
                                      land.address.postalCode,
                                    ]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </span>
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="mt-4 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
                            <DocLink
                              label="Profile photo"
                              file={land.profilePicture}
                            />
                            <DocLink
                              label="Government ID"
                              file={land.govermentIdDocument}
                            />
                            <DocLink
                              label="Tax ID (TIN)"
                              file={land.taxIdentificationNumberDocument}
                            />
                            <DocLink
                              label="Land survey"
                              file={land.landSurveyDocument}
                            />
                            <DocLink
                              label="Proof of ownership"
                              file={land.proofOfOwnershipDocument}
                            />
                          </div>
                        </div>
                      ) : null}

                      {prop ? (
                        <div className="min-w-0 rounded-lg border border-[#E2E8F0] p-4">
                          <p className="text-[12px] font-semibold text-[#0F172A]">
                            Property
                          </p>
                          <p className="mt-2 text-[15px] font-semibold">
                            {prop.name ?? "—"}
                          </p>
                          {prop.description ? (
                            <p className="mt-2 line-clamp-4 text-[13px] leading-relaxed text-[#334155]">
                              {prop.description}
                            </p>
                          ) : null}
                          <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-[#64748B]">
                            {prop.yearBuilt ? (
                              <span>Built {prop.yearBuilt}</span>
                            ) : null}
                            {prop.numberOfUnits != null ? (
                              <span>{prop.numberOfUnits} units</span>
                            ) : null}
                          </div>
                          {prop.address ? (
                            <p className="mt-2 flex gap-1.5 text-[13px] text-[#475569]">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#64748B]" />
                              {[
                                prop.address.address,
                                prop.address.city,
                                prop.address.state,
                                prop.address.country,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          ) : null}
                          {prop.amenities && prop.amenities.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {prop.amenities.map((a) => (
                                <span
                                  key={a}
                                  className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[11px] text-[#334155]"
                                >
                                  {a}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          {prop.photos && prop.photos.length > 0 ? (
                            <div className="mt-4">
                              <p className="mb-2 text-[11px] font-medium text-[#64748B]">
                                Photos
                              </p>
                              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                {prop.photos.slice(0, 8).map((ph) =>
                                  ph.url ? (
                                    <a
                                      key={ph.id ?? ph.url}
                                      href={ph.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="relative block overflow-hidden rounded-md border border-[#E2E8F0] bg-[#F8FAFC]"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={ph.url}
                                        alt=""
                                        className="h-20 w-full object-cover"
                                      />
                                    </a>
                                  ) : null,
                                )}
                              </div>
                            </div>
                          ) : null}
                          {prop.documents && prop.documents.length > 0 ? (
                            <div className="mt-4 space-y-2">
                              <p className="text-[11px] font-medium text-[#64748B]">
                                Documents
                              </p>
                              {prop.documents.map((doc, i) =>
                                doc.url ? (
                                  <DocLink
                                    key={doc.id ?? i}
                                    label={
                                      doc.label?.replace(/^property_/, "") ??
                                      "Document"
                                    }
                                    file={doc}
                                  />
                                ) : null,
                              )}
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-3 border-t border-[#E2E8F0] pt-5">
                        <button
                          type="button"
                          disabled={
                            actionBusy !== null ||
                            ["VERIFIED", "REJECTED"].includes(
                              String(d.status).toUpperCase(),
                            )
                          }
                          onClick={() => openActionModal("VERIFIED")}
                          className="inline-flex items-center justify-center gap-2 rounded-md bg-[#111827] px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionBusy === "verify" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <BadgeCheck className="h-4 w-4" />
                          )}
                          Mark verified
                        </button>
                        <button
                          type="button"
                          disabled={actionBusy !== null}
                          onClick={() => openActionModal("REJECTED")}
                          className="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2.5 text-[13px] font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionBusy === "reject" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          Reject record
                        </button>
                      </div>
                    </div>
                  );
                })()}
            </div>
          </div>
        </section>
        {pendingAction ? (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
              <h3 className="text-base font-semibold text-[#0F172A]">
                {pendingAction === "VERIFIED"
                  ? "Accept verification"
                  : "Reject verification"}
              </h3>
              <p className="mt-1 text-sm text-[#64748B]">
                Provide a reason and optional supporting document(s) before
                updating verification status.
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#334155]">
                    Reason <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    rows={4}
                    placeholder="Write reason..."
                    className="w-full rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#334155]">
                    Supporting documents (optional)
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC]">
                    <Paperclip className="h-4 w-4" />
                    Attach file(s)
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) =>
                        setSupportingFiles(Array.from(e.target.files ?? []))
                      }
                    />
                  </label>
                  {supportingFiles.length > 0 ? (
                    <p className="mt-2 text-xs text-[#64748B]">
                      {supportingFiles.length} file
                      {supportingFiles.length > 1 ? "s" : ""} selected
                    </p>
                  ) : null}
                </div>

                {modalError ? (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {modalError}
                  </p>
                ) : null}
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeActionModal}
                  disabled={actionBusy !== null}
                  className="rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#334155] hover:bg-[#F8FAFC] disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmAction()}
                  disabled={actionBusy !== null}
                  className="inline-flex items-center gap-2 rounded-md bg-[#111827] px-3 py-2 text-sm font-medium text-white hover:bg-[#1E293B] disabled:opacity-60"
                >
                  {actionBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {pendingAction === "VERIFIED"
                    ? "Accept verification"
                    : "Reject verification"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </AdminLayout>
    </>
  );
};

export default AdminVerificationsPage;
