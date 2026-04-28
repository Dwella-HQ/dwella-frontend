import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  Loader2,
  MoreVertical,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  deleteTenantEntity,
  getTenantList,
  patchTenantEntity,
  type TenantRecordDTO,
} from "@/api/tenants";

type TenantTableRow = {
  id: string;
  name: string;
  phone: string;
  unitsDisplay: string;
  monthlyRent: string;
  leaseEnds: string;
  rentStatus: "Paid" | "Unpaid" | "—";
  dateJoined: string;
  accountStatus: "Active" | "Inactive";
  avatarUrl: string | null;
  /** For “new this month” stats */
  createdAtIso?: string;
};

function formatGbDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB");
}

function formatNGN(n: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

function mapTenantRecord(rec: TenantRecordDTO): TenantTableRow {
  const r = rec as Record<string, unknown>;
  const user =
    typeof r.user === "object" && r.user !== null
      ? (r.user as Record<string, unknown>)
      : {};

  const name = String(
    user.fullName ?? user.name ?? r.fullName ?? user.email ?? "Tenant",
  );
  const phone = String(user.phoneNumber ?? r.phoneNumber ?? "—");

  const leases = Array.isArray(r.leases)
    ? (r.leases as Record<string, unknown>[])
    : [];
  const activeLease =
    leases.find((l) => l.isActive === true) ?? leases[0] ?? null;

  let monthlyRent = "—";
  if (activeLease?.rentAmount != null && activeLease.rentAmount !== "") {
    monthlyRent = formatNGN(Number(activeLease.rentAmount));
  } else if (
    typeof r.currentUnit === "object" &&
    r.currentUnit !== null &&
    (r.currentUnit as Record<string, unknown>).rentAmount != null
  ) {
    monthlyRent = formatNGN(
      Number((r.currentUnit as Record<string, unknown>).rentAmount),
    );
  }

  let leaseEnds = "—";
  if (activeLease?.endDate != null) {
    leaseEnds = formatGbDate(String(activeLease.endDate));
  }

  let rentStatus: TenantTableRow["rentStatus"] = "—";
  const payState =
    activeLease?.paymentStatus ??
    activeLease?.rentPaymentStatus ??
    r.paymentStatus;
  if (typeof payState === "string") {
    const u = payState.toUpperCase();
    if (u.includes("PAID") || u.includes("COMPLETE")) rentStatus = "Paid";
    else if (u.includes("UNPAID") || u.includes("DUE") || u.includes("OWING"))
      rentStatus = "Unpaid";
  }

  const createdRaw =
    typeof user.createdAt === "string"
      ? user.createdAt
      : typeof r.createdAt === "string"
        ? r.createdAt
        : undefined;
  const dateJoined = createdRaw ? formatGbDate(createdRaw) : "—";

  let accountStatus: "Active" | "Inactive" = "Active";
  if (user.isActive === false || r.isActive === false || user.isActive === 0) {
    accountStatus = "Inactive";
  }

  let unitsDisplay = "—";
  if (typeof r.currentUnit === "object" && r.currentUnit !== null) {
    unitsDisplay = "1";
  } else if (leases.length > 0) {
    unitsDisplay = String(leases.length);
  }

  let avatarUrl: string | null = null;
  const pp = user.profilePicture ?? r.profilePicture;
  if (typeof pp === "object" && pp !== null && "url" in pp) {
    const u = (pp as { url?: unknown }).url;
    if (typeof u === "string") avatarUrl = u;
  }

  return {
    id: rec.id,
    name,
    phone,
    unitsDisplay,
    monthlyRent,
    leaseEnds,
    rentStatus,
    dateJoined,
    accountStatus,
    avatarUrl,
    createdAtIso: createdRaw,
  };
}

const ACTION_MENU_WIDTH = 128;
const ACTION_MENU_HEIGHT = 112;

function computeActionMenuPosition(btn: DOMRect): {
  top: number;
  left: number;
} {
  let top = btn.bottom + 4;
  if (top + ACTION_MENU_HEIGHT > window.innerHeight - 8) {
    top = Math.max(8, btn.top - ACTION_MENU_HEIGHT - 4);
  }
  let left = btn.right - ACTION_MENU_WIDTH;
  left = Math.max(8, Math.min(left, window.innerWidth - ACTION_MENU_WIDTH - 8));
  return { top, left };
}

const AdminTenantsPage: NextPageWithLayout = () => {
  const [rows, setRows] = React.useState<TenantTableRow[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "All" | "Active" | "Inactive"
  >("All");
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [actionMenu, setActionMenu] = React.useState<{
    tenantId: string;
    top: number;
    left: number;
  } | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const result = await getTenantList({ limit: 500 });
    setLoading(false);
    if (!result.success) {
      setLoadError(result.error);
      setRows([]);
      return;
    }
    setRows(result.data.map(mapTenantRecord));
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    const handleWindowClick = () => setActionMenu(null);
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  React.useEffect(() => {
    if (!actionMenu) return;
    const close = () => setActionMenu(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [actionMenu]);

  const stats = React.useMemo(() => {
    const all = rows.length;
    const active = rows.filter((r) => r.accountStatus === "Active").length;
    const suspended = rows.filter((r) => r.accountStatus === "Inactive").length;
    const now = new Date();
    const newThisMonth = rows.filter((r) => {
      if (!r.createdAtIso) return false;
      const d = new Date(r.createdAtIso);
      return (
        !Number.isNaN(d.getTime()) &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length;
    return { all, active, suspended, newThisMonth };
  }, [rows]);

  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.phone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" ? true : row.accountStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = async (row: TenantTableRow) => {
    const nextActive = row.accountStatus !== "Active";
    const result = await patchTenantEntity(row.id, { isActive: nextActive });
    setActionMenu(null);
    if (!result.success) {
      window.alert(result.error || "Could not update tenant.");
      return;
    }
    await load();
  };

  const handleBan = async (tenantId: string) => {
    const confirmed = window.confirm(
      "Remove this tenant record? This calls DELETE /tenant/{id}.",
    );
    if (!confirmed) return;
    const result = await deleteTenantEntity(tenantId);
    setActionMenu(null);
    if (!result.success) {
      window.alert(result.error || "Delete failed.");
      return;
    }
    await load();
  };

  const handleMessage = (name: string) => {
    window.alert(`Messages integration is not wired yet. (${name})`);
    setActionMenu(null);
  };

  const statusPill = (value: TenantTableRow["rentStatus"]) =>
    value === "Paid"
      ? "bg-[#DCFCE7] text-[#15803D]"
      : value === "Unpaid"
        ? "bg-[#FEE2E2] text-[#B91C1C]"
        : "bg-[#F1F5F9] text-[#64748B]";
  const accountPill = (value: "Active" | "Inactive") =>
    value === "Active"
      ? "bg-[#D9F99D] text-[#3F6212]"
      : "bg-[#E5E7EB] text-[#374151]";

  return (
    <>
      <Head>
        <title>DWELLA NG · Tenants</title>
      </Head>
      <AdminLayout title="Tenants">
        <section className="space-y-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[12px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {[
              { label: "All Tenants", value: stats.all },
              { label: "Active", value: stats.active },
              { label: "Suspended", value: stats.suspended },
              { label: "New This Month", value: stats.newThisMonth },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2.5"
              >
                <p className="text-[12px] text-[#64748B]">{item.label}</p>
                <p className="mt-1 text-[32px] font-semibold leading-none">
                  {item.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {loadError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
              {loadError}
            </p>
          ) : null}

          <div className="grid grid-cols-[1fr_210px_auto] items-center gap-2.5 rounded-[10px] border border-[#E2E8F0] bg-white p-2.5">
            <div className="flex items-center gap-2 rounded-md bg-[#F8FAFC] px-3 py-2">
              <Search className="h-4 w-4 text-[#94A3B8]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-[12px] outline-none placeholder:text-[#94A3B8]"
              />
            </div>
            <button
              type="button"
              className="flex items-center justify-between rounded-md border border-[#E2E8F0] px-3 py-2 text-[12px] text-[#64748B]"
              onClick={() =>
                setStatusFilter((prev) =>
                  prev === "All"
                    ? "Active"
                    : prev === "Active"
                      ? "Inactive"
                      : "All",
                )
              }
            >
              <span>Status</span>
              <span className="text-[#0F172A]">{statusFilter}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-[13px] text-[#475569]"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </div>

          <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-4">
            <div className="flex items-center gap-2">
              <p className="text-[20px] font-semibold leading-none">
                Tenant List
              </p>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#64748B]" />
              ) : null}
            </div>
            <p className="mb-4 mt-1 text-[12px] text-[#64748B]">
              List and stats come from the tenant service (see{" "}
              <span className="font-mono text-[11px]">GET /tenant</span> in
              ENDPOINTS.md). Row actions call{" "}
              <span className="font-mono text-[11px]">PATCH</span> and{" "}
              <span className="font-mono text-[11px]">DELETE</span> on the same
              resource.
            </p>
            <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full min-w-[1040px] table-fixed text-[11px]">
                <thead className="text-[#64748B]">
                  <tr>
                    <th className="w-[72px] py-2.5 text-center font-medium">
                      Serial Number
                    </th>
                    <th className="w-[56px] py-2.5 text-center font-medium">
                      Image
                    </th>
                    <th className="w-[130px] py-2.5 text-left font-medium">
                      Name
                    </th>
                    <th className="w-[150px] py-2.5 text-left font-medium">
                      Number
                    </th>
                    <th className="w-[56px] py-2.5 text-center font-medium">
                      Units
                    </th>
                    <th className="w-[110px] py-2.5 text-left font-medium">
                      Monthly Rent
                    </th>
                    <th className="w-[92px] py-2.5 text-left font-medium">
                      Rent/Lease Ends
                    </th>
                    <th className="w-[90px] py-2.5 text-left font-medium">
                      Rent Status
                    </th>
                    <th className="w-[92px] py-2.5 text-left font-medium">
                      Date Joined
                    </th>
                    <th className="w-[100px] py-2.5 text-left font-medium">
                      Account Status
                    </th>
                    <th className="w-[44px] py-2.5 text-center font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, idx) => (
                    <tr
                      key={row.id}
                      className="border-t border-[#F1F5F9] hover:bg-[#F8FAFC]"
                    >
                      <td className="whitespace-nowrap py-2.5 text-center">
                        {idx + 1}
                      </td>
                      <td className="py-2.5">
                        <div className="relative mx-auto h-7 w-7 overflow-hidden rounded-full bg-[#E2E8F0]">
                          {row.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.avatarUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-[#64748B]">
                              {row.name.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5">
                        <Link
                          href={`/dashboard/admin/tenants/${row.id}`}
                          className="font-medium text-[#0F172A] hover:text-[#1E66FF]"
                        >
                          {row.name}
                        </Link>
                      </td>
                      <td className="truncate py-2.5">{row.phone}</td>
                      <td className="whitespace-nowrap py-2.5 text-center">
                        {row.unitsDisplay}
                      </td>
                      <td className="whitespace-nowrap py-2.5">
                        {row.monthlyRent}
                      </td>
                      <td className="whitespace-nowrap py-2.5">
                        {row.leaseEnds}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${statusPill(
                            row.rentStatus,
                          )}`}
                        >
                          {row.rentStatus}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-2.5">
                        {row.dateJoined}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${accountPill(
                            row.accountStatus,
                          )}`}
                        >
                          {row.accountStatus}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        <button
                          type="button"
                          aria-expanded={actionMenu?.tenantId === row.id}
                          aria-haspopup="menu"
                          onClick={(e) => {
                            e.stopPropagation();
                            const btn = e.currentTarget.getBoundingClientRect();
                            setActionMenu((prev) =>
                              prev?.tenantId === row.id
                                ? null
                                : {
                                    tenantId: row.id,
                                    ...computeActionMenuPosition(btn),
                                  },
                            );
                          }}
                          className="rounded p-1 text-[#94A3B8] hover:bg-[#F1F5F9]"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!loading && filteredRows.length === 0 ? (
              <p className="mt-4 text-center text-[12px] text-[#64748B]">
                No tenants to display.
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#64748B]">
              <span>
                Showing {filteredRows.length} row(s)
                {searchQuery || statusFilter !== "All" ? " (filtered)" : ""}
              </span>
            </div>
          </div>
        </section>
      </AdminLayout>
      {typeof document !== "undefined" &&
        actionMenu &&
        createPortal(
          <div
            role="menu"
            className="fixed z-[200] w-32 rounded-md border border-[#E2E8F0] bg-white p-1 shadow-lg"
            style={{ top: actionMenu.top, left: actionMenu.left }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              className="w-full rounded px-2 py-1.5 text-left text-[11px] text-[#0F172A] hover:bg-[#F8FAFC]"
              onClick={() => {
                const row = rows.find((r) => r.id === actionMenu.tenantId);
                if (row) void handleToggleStatus(row);
              }}
            >
              {rows.find((r) => r.id === actionMenu.tenantId)?.accountStatus ===
              "Active"
                ? "Suspend"
                : "Activate"}
            </button>
            <button
              type="button"
              role="menuitem"
              className="w-full rounded px-2 py-1.5 text-left text-[11px] text-[#B91C1C] hover:bg-[#FEF2F2]"
              onClick={() => void handleBan(actionMenu.tenantId)}
            >
              Remove
            </button>
            <button
              type="button"
              role="menuitem"
              className="w-full rounded px-2 py-1.5 text-left text-[11px] text-[#0F172A] hover:bg-[#F8FAFC]"
              onClick={() =>
                handleMessage(
                  rows.find((r) => r.id === actionMenu.tenantId)?.name ?? "",
                )
              }
            >
              Message
            </button>
          </div>,
          document.body,
        )}
    </>
  );
};

export default AdminTenantsPage;
