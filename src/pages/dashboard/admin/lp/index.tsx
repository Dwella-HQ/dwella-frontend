import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { Loader2 } from "lucide-react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getLandlords, type LandlordDTO } from "@/api/landlord";
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

function landlordStatus(l: LandlordDTO): string {
  if (!l.isApproved) return "Pending";
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
  const [loadingLandlords, setLoadingLandlords] = React.useState(false);
  const [loadingManagers, setLoadingManagers] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadLandlords = React.useCallback(async () => {
    setLoadingLandlords(true);
    setError(null);
    const [landlordsResult, propertiesResult, paymentsResult] =
      await Promise.all([
        getLandlords(),
        getProperties(),
        getRentPaymentItems({ limit: 3000 }),
      ]);
    setLoadingLandlords(false);
    if (!landlordsResult.success) {
      setError(landlordsResult.error);
      setLandlords([]);
      setLpProperties([]);
      setLpRentItems([]);
      return;
    }
    setLandlords(landlordsResult.data);
    setLpProperties(propertiesResult.success ? propertiesResult.data : []);
    setLpRentItems(paymentsResult.success ? paymentsResult.data : []);
    if (!propertiesResult.success) {
      console.warn("LP: properties for metrics failed:", propertiesResult.error);
    }
    if (!paymentsResult.success) {
      console.warn("LP: rent payments for metrics failed:", paymentsResult.error);
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
    setManagers(result.data);
  }, []);

  React.useEffect(() => {
    if (tab === "managers") void loadManagers();
    else void loadLandlords();
  }, [tab, loadLandlords, loadManagers]);

  const landlordRows =
    tab === "pending"
      ? landlords.filter((l) => !l.isApproved)
      : landlords.filter((l) => l.isApproved);

  const statsLandlord = React.useMemo(() => {
    const total = landlords.length;
    const pending = landlords.filter((l) => !l.isApproved).length;
    return { total, pending };
  }, [landlords]);

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
                      managers.map((row, i) => (
                        <tr key={row.id} className="border-t border-[#F1F5F9]">
                          <td className="py-2">{i + 1}</td>
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
                      landlordRows.map((row, i) => {
                        const m =
                          landlordMetricsById.get(row.id) ?? emptyMetrics;
                        return (
                        <tr key={row.id} className="border-t border-[#F1F5F9]">
                          <td className="py-2">{i + 1}</td>
                          <td className="py-2">{landlordDisplayName(row)}</td>
                          <td className="py-2">{landlordPhone(row)}</td>
                          <td className="py-2">{landlordEmail(row)}</td>
                          <td className="py-2">{m.propertyCount}</td>
                          <td className="py-2">{m.unitCount}</td>
                          <td className="py-2">{formatNgn(m.monthlyRevenue)}</td>
                          <td className="py-2">{formatNgn(m.totalRevenue)}</td>
                          <td className="py-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] ${landlordStatus(row) === "Active" ? "bg-green-100 text-green-700" : landlordStatus(row) === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
                            >
                              {landlordStatus(row)}
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
                Rows:{" "}
                {tab === "managers" ? managers.length : landlordRows.length}
              </p>
            </div>
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default LPPage;
