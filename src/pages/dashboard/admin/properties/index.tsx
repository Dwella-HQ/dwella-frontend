import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import {
  Download,
  Loader2,
  MoreVertical,
  RefreshCw,
  Search,
} from "lucide-react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getProperties, type PropertyDTO } from "@/api/properties";
import { downloadCsv, todayStamp } from "@/utils/exportCsv";

function formatAddress(p: PropertyDTO): string {
  const a = p.address;
  if (!a) return "—";
  return [a.address, a.city, a.state].filter(Boolean).join(", ") || "—";
}

function listingDate(p: PropertyDTO): string {
  if (!p.createdAt) return "—";
  const d = new Date(p.createdAt);
  return Number.isNaN(d.getTime())
    ? p.createdAt
    : d.toLocaleDateString("en-GB");
}

function propertyStatusLabel(p: PropertyDTO): string {
  if (!p.isApproved) return "Pending";
  return p.isActive === false ? "Inactive" : "Active";
}

const ACTION_MENU_WIDTH = 144;
/** Up to three action rows + padding */
const ACTION_MENU_HEIGHT = 112;
const PAGE_SIZE = 10;

function dateMs(value?: string | null): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function propertySortTime(p: PropertyDTO): number {
  return dateMs(p.createdAt) || dateMs(p.updatedAt);
}

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

const AdminPropertiesPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [tab, setTab] = React.useState<"active" | "pending">("active");
  const [properties, setProperties] = React.useState<PropertyDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);

  const [actionMenu, setActionMenu] = React.useState<{
    propertyId: string;
    top: number;
    left: number;
  } | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const result = await getProperties();
    setLoading(false);
    if (!result.success) {
      setLoadError(result.error);
      setProperties([]);
      return;
    }
    setProperties(result.data);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const visibleRows = React.useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return properties
      .filter((p) => {
        if (tab === "pending" ? !!p.isApproved : !p.isApproved) return false;

        const status = propertyStatusLabel(p).toLowerCase();
        if (statusFilter !== "all" && status !== statusFilter) return false;
        if (!normalizedSearch) return true;

        return [p.name, formatAddress(p), status, p.id]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((a, b) => propertySortTime(b) - propertySortTime(a));
  }, [properties, searchTerm, statusFilter, tab]);

  const pageCount = Math.max(1, Math.ceil(visibleRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paginatedRows = React.useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return visibleRows.slice(start, start + PAGE_SIZE);
  }, [safePage, visibleRows]);
  const firstVisibleRecord =
    visibleRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const lastVisibleRecord = Math.min(safePage * PAGE_SIZE, visibleRows.length);

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
  }, [searchTerm, statusFilter, tab, properties.length]);

  React.useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const stats = React.useMemo(() => {
    const total = properties.length;
    const pendingApproval = properties.filter((p) => !p.isApproved).length;
    const approved = properties.filter((p) => p.isApproved).length;
    const activeListed = properties.filter(
      (p) => p.isApproved && p.isActive !== false,
    ).length;
    const inactive = properties.filter((p) => p.isActive === false).length;
    const units = properties.reduce(
      (sum, p) => sum + Number(p.numberOfUnits || 0),
      0,
    );
    return { total, pendingApproval, approved, activeListed, inactive, units };
  }, [properties]);

  const statusPill = (p: PropertyDTO) => {
    const status = propertyStatusLabel(p);
    if (status === "Pending") return "bg-amber-100 text-amber-900";
    if (status === "Inactive") return "bg-[#E5E7EB] text-[#374151]";
    return "bg-[#D9F99D] text-[#3F6212]";
  };

  const openPropertyVerification = React.useCallback(
    (propertyId: string) => {
      void router.push({
        pathname: "/dashboard/admin/verifications",
        query: { kind: "property", propertyId },
      });
    },
    [router],
  );

  const handleExportProperties = React.useCallback(() => {
    downloadCsv(
      `admin-properties-${tab}-${todayStamp()}.csv`,
      [
        { header: "S/N", value: (_property, index) => index + 1 },
        { header: "Property ID", value: (property) => property.id },
        { header: "Name", value: (property) => property.name },
        { header: "Address", value: (property) => formatAddress(property) },
        {
          header: "Units",
          value: (property) => property.numberOfUnits ?? "—",
        },
        { header: "Listed Date", value: (property) => listingDate(property) },
        {
          header: "Status",
          value: (property) => propertyStatusLabel(property),
        },
        {
          header: "Approved",
          value: (property) => (property.isApproved ? "Yes" : "No"),
        },
        {
          header: "Active",
          value: (property) => (property.isActive === false ? "No" : "Yes"),
        },
      ],
      visibleRows,
    );
  }, [tab, visibleRows]);

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

  return (
    <>
      <Head>
        <title>Dwelliva · Admin Properties</title>
      </Head>
      <AdminLayout title="Properties">
        <section className="w-full min-w-0 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-fit max-w-full flex-wrap rounded-lg border border-[#E2E8F0] bg-white p-1">
              <button
                type="button"
                onClick={() => {
                  setTab("active");
                  setStatusFilter("all");
                }}
                className={`rounded-md px-3 py-1.5 text-[12px] ${tab === "active" ? "bg-[#E0F2FE] text-[#0284C7]" : "text-[#64748B]"}`}
              >
                Active Properties
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("pending");
                  setStatusFilter("all");
                }}
                className={`rounded-md px-3 py-1.5 text-[12px] ${tab === "pending" ? "bg-[#E0F2FE] text-[#0284C7]" : "text-[#64748B]"}`}
              >
                Pending Approval
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportProperties}
                disabled={visibleRows.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#E2E8F0] bg-white px-4 py-2 text-[13px] font-medium text-[#475569] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#E2E8F0] bg-white px-4 py-2 text-[13px] font-medium text-[#475569] transition hover:bg-[#F8FAFC] disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["Total Properties", String(stats.total)],
              ["Approved", String(stats.approved)],
              ["Pending approval", String(stats.pendingApproval)],
              ["Active listings", String(stats.activeListed)],
              ["Inactive", String(stats.inactive)],
              ["Total units", String(stats.units)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2.5"
              >
                <p className="text-[12px] text-[#64748B]">{label}</p>
                <p className="mt-1 text-xl font-semibold leading-none sm:text-2xl lg:text-[32px]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {loadError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
              {loadError}
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-2.5 rounded-[10px] border border-[#E2E8F0] bg-white p-2.5 sm:grid-cols-[1fr_210px] sm:items-center">
            <div className="flex items-center gap-2 rounded-md border border-[#E2E8F0] bg-white px-3 py-2">
              <Search className="h-4 w-4 text-[#94A3B8]" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, address, status, or ID..."
                className="w-full bg-white text-[12px] text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-[#E2E8F0] bg-white px-3 text-[12px] text-[#0F172A] outline-none"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="w-full min-w-0 overflow-hidden rounded-[10px] border border-[#E2E8F0] bg-white p-4">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold leading-none sm:text-[20px]">
                Property List
              </p>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#64748B]" />
              ) : null}
            </div>
            <p className="mb-4 mt-1 text-[12px] text-[#64748B]">
              Review property listings and open pending verifications when
              needed.
            </p>
            <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full min-w-[760px] table-fixed text-[11px]">
                <thead className="text-[#64748B]">
                  <tr>
                    <th className="w-[60px] py-2.5 text-left font-medium">
                      S/N
                    </th>
                    <th className="w-[220px] py-2.5 text-left font-medium">
                      Property
                    </th>
                    <th className="w-[240px] py-2.5 text-left font-medium">
                      Address
                    </th>
                    <th className="w-[72px] py-2.5 text-center font-medium">
                      Units
                    </th>
                    <th className="w-[104px] py-2.5 text-left font-medium">
                      Listed
                    </th>
                    <th className="w-[120px] py-2.5 text-center font-medium">
                      Status
                    </th>
                    <th className="w-[44px] py-2.5 text-center font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {!loading &&
                    paginatedRows.map((row, idx) => {
                      const thumb = row.photos?.[0]?.url;
                      return (
                        <tr key={row.id} className="border-t border-[#F1F5F9]">
                          <td className="whitespace-nowrap py-2.5 text-left">
                            {(safePage - 1) * PAGE_SIZE + idx + 1}
                          </td>
                          <td className="py-2.5 text-left">
                            <div className="flex items-center gap-3">
                              {thumb ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={thumb}
                                  alt=""
                                  className="h-9 w-9 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#38BDF8] to-[#0EA5E9]" />
                              )}
                              <div className="min-w-0">
                                <Link
                                  className="block truncate font-medium text-[#0F172A] hover:underline"
                                  href={`/dashboard/admin/properties/${row.id}`}
                                >
                                  {row.name}
                                </Link>
                                <p className="truncate text-[10px] text-[#94A3B8]">
                                  {row.id}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 text-left">
                            {formatAddress(row)}
                          </td>
                          <td className="whitespace-nowrap py-2.5 text-center">
                            {row.numberOfUnits ?? "—"}
                          </td>
                          <td className="whitespace-nowrap py-2.5 text-left">
                            {listingDate(row)}
                          </td>
                          <td className="py-2.5 text-center">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusPill(row)}`}
                            >
                              {propertyStatusLabel(row)}
                            </span>
                          </td>
                          <td className="py-2.5 text-center">
                            <button
                              type="button"
                              aria-expanded={actionMenu?.propertyId === row.id}
                              aria-haspopup="menu"
                              onClick={(event) => {
                                event.stopPropagation();
                                const btn =
                                  event.currentTarget.getBoundingClientRect();
                                setActionMenu((prev) =>
                                  prev?.propertyId === row.id
                                    ? null
                                    : {
                                        propertyId: row.id,
                                        ...computeActionMenuPosition(btn),
                                      },
                                );
                              }}
                              className="text-[#94A3B8]"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {!loading && visibleRows.length === 0 ? (
                <p className="py-8 text-center text-[12px] text-[#64748B]">
                  No properties match the current view.
                </p>
              ) : null}
            </div>
            <div className="mt-4 flex flex-col gap-2 text-[12px] text-[#64748B] sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex items-center gap-2">
                <span>
                  Showing {firstVisibleRecord}-{lastVisibleRecord} of{" "}
                  {visibleRows.length}
                </span>
                {visibleRows.length !== properties.length ? (
                  <span>({properties.length} total)</span>
                ) : null}
              </div>
              <div className="inline-flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage <= 1 || loading}
                  className="rounded border border-[#E2E8F0] bg-white px-2 py-0.5 hover:bg-[#F8FAFC] disabled:opacity-40"
                >
                  Prev
                </button>
                {paginationItems.map((item, index) =>
                  item === "ellipsis" ? (
                    <span
                      key={`ellipsis-${index}`}
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
                  disabled={safePage >= pageCount || loading}
                  className="rounded border border-[#E2E8F0] bg-white px-2 py-0.5 hover:bg-[#F8FAFC] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>
      </AdminLayout>
      {typeof document !== "undefined" &&
        actionMenu &&
        createPortal(
          <div
            role="menu"
            className="fixed z-[200] w-36 rounded-md border border-[#E2E8F0] bg-white p-1 text-left shadow-lg"
            style={{
              top: actionMenu.top,
              left: actionMenu.left,
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {tab === "pending" ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActionMenu(null);
                  openPropertyVerification(actionMenu.propertyId);
                }}
                className="block w-full rounded px-2 py-1.5 text-left text-xs text-[#0F172A] hover:bg-[#F8FAFC]"
              >
                View Verification
              </button>
            ) : null}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setActionMenu(null);
                router.push(
                  `/dashboard/admin/properties/${actionMenu.propertyId}`,
                );
              }}
              className="block w-full rounded px-2 py-1.5 text-left text-xs text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              View Property
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setActionMenu(null);
                router.push(
                  `/dashboard/admin/properties/${actionMenu.propertyId}?mode=edit`,
                );
              }}
              className="block w-full rounded px-2 py-1.5 text-left text-xs text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              Edit Property
            </button>
          </div>,
          document.body,
        )}
    </>
  );
};

export default AdminPropertiesPage;
