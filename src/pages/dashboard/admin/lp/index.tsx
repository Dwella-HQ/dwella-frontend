import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { Loader2 } from "lucide-react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  getLandlords,
  getLandlordVerificationStatus,
  type LandlordVerificationStatus,
  type LandlordDTO,
} from "@/api/landlord";
import {
  deriveVerificationKind,
  entityLandlordId,
  getVerifications,
  type VerificationDTO,
} from "@/api/verification";
import { getProperties, type PropertyDTO } from "@/api/properties";
import { getRentPaymentItems } from "@/api/rent-payment";
import type { RentPaymentItemDTO } from "@/api/rent-payment/rentPayment.schema";
import {
  getPropertyManagers,
  type PropertyManagerDTO,
} from "@/api/property-managers";
import {
  buildLandlordMetricsMap,
  sumLandlordLpPortfolioTotals,
  type LandlordLpMetrics,
} from "@/lib/admin/buildLandlordLpMetrics";

function landlordDisplayName(l: LandlordDTO): string {
  const ext = l as Record<string, unknown>;
  const b = ext.businessName;
  if (typeof b === "string" && b.trim()) return b;
  return (
    (l.landLordName && String(l.landLordName).trim()) ||
    (l.user as { fullName?: string } | undefined)?.fullName ||
    l.user?.email ||
    "—"
  );
}

function landlordPhone(l: LandlordDTO): string {
  const fromUser = l.user?.phoneNumber?.trim();
  const fromBusiness = l.businessPhoneNumber?.trim();
  return fromUser || fromBusiness || "—";
}

function landlordEmail(l: LandlordDTO): string {
  const biz = l.businessEmail?.trim();
  return biz || l.user?.email || "—";
}

function formatNgn(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

const emptyMetrics: LandlordLpMetrics = {
  propertyCount: 0,
  unitCount: 0,
  monthlyRevenue: 0,
  totalRevenue: 0,
};

function pmDisplayName(m: PropertyManagerDTO): string {
  return (
    m.fullName || m.name || m.user?.fullName || m.user?.email || m.email || "—"
  );
}

const PAGE_SIZE = 10;

function dateMs(value: unknown): number {
  if (typeof value !== "string") return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function recordSortTime(value: unknown): number {
  const row = value as Record<string, unknown>;
  return dateMs(row.createdAt) || dateMs(row.updatedAt);
}

function normalizeVerificationStatus(
  value: unknown,
): LandlordVerificationStatus | null {
  if (typeof value !== "string") return null;
  const status = value.trim().toUpperCase();
  if (status === "VERIFIED" || status === "PENDING" || status === "REJECTED") {
    return status;
  }
  return null;
}

function verificationTimestamp(v: VerificationDTO): number {
  const raw = v.updatedAt ?? v.createdAt ?? v.verifiedAt;
  if (!raw) return 0;
  const time = new Date(raw).getTime();
  return Number.isFinite(time) ? time : 0;
}

function buildLandlordVerificationStatusMap(
  verifications: VerificationDTO[],
): Map<string, LandlordVerificationStatus> {
  const latestByLandlord = new Map<
    string,
    { status: LandlordVerificationStatus; timestamp: number }
  >();

  for (const verification of verifications) {
    if (deriveVerificationKind(verification) !== "landlord") continue;
    const landlordId = entityLandlordId(verification);
    const status = normalizeVerificationStatus(verification.status);
    if (!landlordId || !status) continue;

    const timestamp = verificationTimestamp(verification);
    const existing = latestByLandlord.get(landlordId);
    if (!existing || timestamp >= existing.timestamp) {
      latestByLandlord.set(landlordId, { status, timestamp });
    }
  }

  return new Map(
    Array.from(latestByLandlord, ([landlordId, row]) => [
      landlordId,
      row.status,
    ]),
  );
}

function landlordStatus(
  l: LandlordDTO,
  verificationStatuses: Map<string, LandlordVerificationStatus>,
): string {
  const verificationStatus =
    verificationStatuses.get(l.id) ?? getLandlordVerificationStatus(l);
  if (verificationStatus === "PENDING") return "Pending";
  if (verificationStatus === "REJECTED") return "Rejected";
  if (verificationStatus !== "VERIFIED") return "Pending";
  return l.isActive !== false ? "Active" : "Suspended";
}

const LPPage: NextPageWithLayout = () => {
  const [tab, setTab] = React.useState<"active" | "pending" | "managers">(
    "active",
  );
  const [landlords, setLandlords] = React.useState<LandlordDTO[]>([]);
  const [managers, setManagers] = React.useState<PropertyManagerDTO[]>([]);
  /** Properties + rent rows for L&P metrics (not used on Property Managers tab). */
  const [lpProperties, setLpProperties] = React.useState<PropertyDTO[]>([]);
  const [lpRentItems, setLpRentItems] = React.useState<RentPaymentItemDTO[]>(
    [],
  );
  const [verificationStatuses, setVerificationStatuses] = React.useState(
    () => new Map<string, LandlordVerificationStatus>(),
  );
  const [loadingLandlords, setLoadingLandlords] = React.useState(false);
  const [loadingManagers, setLoadingManagers] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);

  const loadLandlords = React.useCallback(async () => {
    setLoadingLandlords(true);
    setError(null);
    const [
      landlordsResult,
      propertiesResult,
      paymentsResult,
      verificationsResult,
    ] =
      await Promise.all([
        getLandlords(),
        getProperties(),
        getRentPaymentItems({ limit: 3000 }),
        getVerifications(),
      ]);
    setLoadingLandlords(false);
    if (!landlordsResult.success) {
      setError(landlordsResult.error);
      setLandlords([]);
      setLpProperties([]);
      setLpRentItems([]);
      return;
    }
    setLandlords(
      [...landlordsResult.data].sort(
        (a, b) => recordSortTime(b) - recordSortTime(a),
      ),
    );
    setVerificationStatuses(
      verificationsResult.success
        ? buildLandlordVerificationStatusMap(verificationsResult.data)
        : new Map(),
    );
    setLpProperties(propertiesResult.success ? propertiesResult.data : []);
    setLpRentItems(paymentsResult.success ? paymentsResult.data : []);
    if (!propertiesResult.success) {
      console.warn("LP: properties for metrics failed:", propertiesResult.error);
    }
    if (!paymentsResult.success) {
      console.warn("LP: rent payments for metrics failed:", paymentsResult.error);
    }
    if (!verificationsResult.success) {
      console.warn("LP: verifications for status failed:", verificationsResult.error);
    }
  }, []);

  const loadManagers = React.useCallback(async () => {
    setLoadingManagers(true);
    setError(null);
    const result = await getPropertyManagers();
    setLoadingManagers(false);
    if (!result.success) {
      setError(result.error);
      setManagers([]);
      return;
    }
    setManagers(
      [...result.data].sort((a, b) => recordSortTime(b) - recordSortTime(a)),
    );
  }, []);

  React.useEffect(() => {
    if (tab === "managers") void loadManagers();
    else void loadLandlords();
  }, [tab, loadLandlords, loadManagers]);

  const landlordRows = React.useMemo(
    () =>
      tab === "pending"
        ? landlords.filter(
            (l) =>
              (verificationStatuses.get(l.id) ??
                getLandlordVerificationStatus(l)) !== "VERIFIED",
          )
        : landlords.filter(
            (l) =>
              (verificationStatuses.get(l.id) ??
                getLandlordVerificationStatus(l)) === "VERIFIED",
          ),
    [landlords, tab, verificationStatuses],
  );

  const activeRowCount =
    tab === "managers" ? managers.length : landlordRows.length;
  const pageCount = Math.max(1, Math.ceil(activeRowCount / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paginatedManagers = React.useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return managers.slice(start, start + PAGE_SIZE);
  }, [managers, safePage]);
  const paginatedLandlords = React.useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return landlordRows.slice(start, start + PAGE_SIZE);
  }, [landlordRows, safePage]);
  const firstVisibleRecord =
    activeRowCount === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const lastVisibleRecord = Math.min(safePage * PAGE_SIZE, activeRowCount);

  const paginationItems = React.useMemo<(number | "ellipsis")[]>(() => {
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, index) => index + 1);
    }
    const pages = new Set([1, pageCount, safePage - 1, safePage, safePage + 1]);
    const sorted = [...pages]
      .filter((pageNumber) => pageNumber >= 1 && pageNumber <= pageCount)
      .sort((a, b) => a - b);
    const items: (number | "ellipsis")[] = [];
    sorted.forEach((pageNumber, index) => {
      const previous = sorted[index - 1];
      if (previous && pageNumber - previous > 1) items.push("ellipsis");
      items.push(pageNumber);
    });
    return items;
  }, [pageCount, safePage]);

  React.useEffect(() => {
    setPage(1);
  }, [tab]);

  React.useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const statsLandlord = React.useMemo(() => {
    const total = landlords.length;
    const pending = landlords.filter(
      (l) =>
        (verificationStatuses.get(l.id) ?? getLandlordVerificationStatus(l)) !==
        "VERIFIED",
    ).length;
    return { total, pending };
  }, [landlords, verificationStatuses]);

  const landlordMetricsById = React.useMemo(
    () => buildLandlordMetricsMap(lpProperties, lpRentItems),
    [lpProperties, lpRentItems],
  );

  const portfolioTotals = React.useMemo(
    () => sumLandlordLpPortfolioTotals(landlordMetricsById),
    [landlordMetricsById],
  );

  return (
    <>
      <Head>
        <title>Dwelliva · L & P</title>
      </Head>
      <AdminLayout title="L & P">
        <section className="w-full min-w-0 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex max-w-full flex-wrap rounded-md bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setTab("active")}
                className={`rounded px-3 py-1 text-sm ${tab === "active" ? "bg-[#E0F2FE] text-[#0284C7]" : "text-[#64748B]"}`}
              >
                Active Landlords
              </button>
              <button
                type="button"
                onClick={() => setTab("pending")}
                className={`rounded px-3 py-1 text-sm ${tab === "pending" ? "bg-[#E0F2FE] text-[#0284C7]" : "text-[#64748B]"}`}
              >
                Pending Verification
              </button>
              <button
                type="button"
                onClick={() => setTab("managers")}
                className={`rounded px-3 py-1 text-sm ${tab === "managers" ? "bg-[#E0F2FE] text-[#0284C7]" : "text-[#64748B]"}`}
              >
                Property Managers
              </button>
            </div>
            <Link
              href="/dashboard/admin/lp/new"
              className="rounded-md bg-[#111827] px-4 py-2 text-sm font-medium text-white"
            >
              Add New
            </Link>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
              {error}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {tab === "managers"
              ? [
                  ["Property Managers", String(managers.length)],
                  ["Properties Managed", "—"],
                  ["Total Units", "—"],
                  ["Active Tenants", "—"],
                  ["Assigned Landlords", "—"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-[#E2E8F0] bg-white p-3"
                  >
                    <p className="text-[11px] text-[#64748B]">{label}</p>
                    <p className="text-2xl font-semibold">{value}</p>
                  </div>
                ))
              : [
                  ["Total Landlords", String(statsLandlord.total)],
                  [
                    tab === "pending"
                      ? "Awaiting Verification"
                      : "Pending approval",
                    String(statsLandlord.pending),
                  ],
                  ["Properties Managed", String(portfolioTotals.propertiesManaged)],
                  ["Total Units", String(portfolioTotals.totalUnits)],
                  ["Total Revenue", formatNgn(portfolioTotals.totalRevenue)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-[#E2E8F0] bg-white p-3"
                  >
                    <p className="text-[11px] text-[#64748B]">{label}</p>
                    <p className="text-2xl font-semibold">{value}</p>
                  </div>
                ))}
          </div>

          <div className="w-full min-w-0 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <p className="text-sm font-semibold">
                {tab === "managers"
                  ? "Property Managers"
                  : tab === "pending"
                    ? "Landlords Pending Verification"
                    : "Landlords"}
              </p>
              {tab === "managers"
                ? loadingManagers && (
                    <Loader2 className="h-4 w-4 animate-spin text-[#64748B]" />
                  )
                : loadingLandlords && (
                    <Loader2 className="h-4 w-4 animate-spin text-[#64748B]" />
                  )}
            </div>
            <p className="mb-3 text-[11px] text-[#64748B]">
              {tab === "managers"
                ? "Review property manager accounts."
                : "Review landlord accounts and complete verification under Verifications."}
            </p>
            <div className="overflow-auto">
              {tab === "managers" ? (
                <table className="w-full min-w-[1100px] text-xs">
                  <thead className="text-[#64748B]">
                    <tr>
                      <th className="py-2 text-left">S/N</th>
                      <th className="py-2 text-left">Name</th>
                      <th className="py-2 text-left">Email</th>
                      <th className="py-2 text-left">Landlord</th>
                      <th className="py-2 text-left">Status</th>
                      <th className="py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loadingManagers &&
                      paginatedManagers.map((row, i) => (
                        <tr key={row.id} className="border-t border-[#F1F5F9]">
                          <td className="py-2">
                            {(safePage - 1) * PAGE_SIZE + i + 1}
                          </td>
                          <td className="py-2">{pmDisplayName(row)}</td>
                          <td className="py-2">
                            {row.email ?? row.user?.email ?? "—"}
                          </td>
                          <td className="py-2">
                            {(row.landlord as { landLordName?: string } | null)
                              ?.landLordName ??
                              row.landlord?.user?.email ??
                              "—"}
                          </td>
                          <td className="py-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] ${row.isActive !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                            >
                              {row.isActive !== false ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-2">
                            <Link
                              href={`/dashboard/admin/lp/property-managers/${row.id}`}
                              className="text-[#0284C7] hover:underline"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full min-w-[1100px] text-xs">
                  <thead className="text-[#64748B]">
                    <tr>
                      <th className="py-2 text-left">S/N</th>
                      <th className="py-2 text-left">Name</th>
                      <th className="py-2 text-left">Phone Number</th>
                      <th className="py-2 text-left">Email</th>
                      <th className="py-2 text-left">Properties</th>
                      <th className="py-2 text-left">Units</th>
                      <th className="py-2 text-left">Monthly Revenue</th>
                      <th className="py-2 text-left">Total Revenue</th>
                      <th className="py-2 text-left">Status</th>
                      <th className="py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loadingLandlords &&
                      paginatedLandlords.map((row, i) => {
                        const m =
                          landlordMetricsById.get(row.id) ?? emptyMetrics;
                        const status = landlordStatus(
                          row,
                          verificationStatuses,
                        );
                        return (
                        <tr key={row.id} className="border-t border-[#F1F5F9]">
                          <td className="py-2">
                            {(safePage - 1) * PAGE_SIZE + i + 1}
                          </td>
                          <td className="py-2">{landlordDisplayName(row)}</td>
                          <td className="py-2">{landlordPhone(row)}</td>
                          <td className="py-2">{landlordEmail(row)}</td>
                          <td className="py-2">{m.propertyCount}</td>
                          <td className="py-2">{m.unitCount}</td>
                          <td className="py-2">{formatNgn(m.monthlyRevenue)}</td>
                          <td className="py-2">{formatNgn(m.totalRevenue)}</td>
                          <td className="py-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] ${status === "Active" ? "bg-green-100 text-green-700" : status === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="py-2">
                            {tab === "pending" ? (
                              <div className="flex gap-2">
                                <Link
                                  href={`/dashboard/admin/verifications`}
                                  className="rounded border border-[#0284C7] px-2 py-0.5 text-[11px] text-[#0284C7]"
                                >
                                  Verify in queue
                                </Link>
                              </div>
                            ) : (
                              <Link
                                href={`/dashboard/admin/lp/landlords/${row.id}`}
                                className="text-[#0284C7] hover:underline"
                              >
                                View Details
                              </Link>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
              {!loadingLandlords &&
                tab !== "managers" &&
                landlordRows.length === 0 && (
                  <p className="py-8 text-center text-[12px] text-[#64748B]">
                    No landlords in this tab.
                  </p>
                )}
              {!loadingManagers &&
                tab === "managers" &&
                managers.length === 0 && (
                  <p className="py-8 text-center text-[12px] text-[#64748B]">
                    No property managers returned.
                  </p>
                )}
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[11px] text-[#64748B]">
              <p>
                Showing {firstVisibleRecord}-{lastVisibleRecord} of{" "}
                {activeRowCount}
              </p>
              <div className="inline-flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage <= 1}
                  className="rounded border border-[#E2E8F0] bg-white px-2 py-0.5 hover:bg-[#F8FAFC] disabled:opacity-40"
                >
                  Prev
                </button>
                {paginationItems.map((item, index) =>
                  item === "ellipsis" ? (
                    <span
                      key={`lp-ellipsis-${index}`}
                      className="px-1 text-[#94A3B8]"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      aria-current={item === safePage ? "page" : undefined}
                      className={`rounded border px-2 py-0.5 ${
                        item === safePage
                          ? "border-[#1E66FF] bg-[#1E66FF] text-white"
                          : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
                <span className="px-1">/ {pageCount}</span>
                <button
                  type="button"
                  onClick={() =>
                    setPage((prev) => Math.min(pageCount, prev + 1))
                  }
                  disabled={safePage >= pageCount}
                  className="rounded border border-[#E2E8F0] bg-white px-2 py-0.5 hover:bg-[#F8FAFC] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default LPPage;
