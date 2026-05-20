import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import {
  ChevronDown,
  Loader2,
  MoreVertical,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  approveProperty,
  getProperties,
  type PropertyDTO,
} from "@/api/properties";

function formatAddress(p: PropertyDTO): string {
  const a = p.address;
  if (!a) return "—";
  return [a.address, a.city, a.state].filter(Boolean).join(", ") || "—";
}

function landlordDisplayName(p: PropertyDTO): string {
  const l = p.landlord;
  if (!l) return "—";
  const ext = l as Record<string, unknown>;
  const bn = ext.businessName;
  if (typeof bn === "string" && bn.trim()) return bn;
  return (
    (l.landLordName && String(l.landLordName).trim()) ||
    l.user?.fullName ||
    l.user?.email ||
    "—"
  );
}

function listingDate(p: PropertyDTO): string {
  if (!p.createdAt) return "—";
  const d = new Date(p.createdAt);
  return Number.isNaN(d.getTime())
    ? p.createdAt
    : d.toLocaleDateString("en-GB");
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function inferRent(p: PropertyDTO): string {
  const units = Array.isArray(p.units) ? p.units : [];
  const rents = units
    .map((unit) => {
      if (!unit || typeof unit !== "object") return null;
      const rent = (unit as Record<string, unknown>).rentAmount;
      if (typeof rent === "number" && Number.isFinite(rent)) return rent;
      if (typeof rent === "string") {
        const parsed = Number(rent);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    })
    .filter((value): value is number => value !== null);

  if (!rents.length) return "—";
  const min = Math.min(...rents);
  const max = Math.max(...rents);
  if (min === max) return formatCurrency(min);
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
}

function inferDuration(p: PropertyDTO): string {
  const units = Array.isArray(p.units) ? p.units : [];
  const durationValues = units
    .map((unit) => {
      if (!unit || typeof unit !== "object") return null;
      const record = unit as Record<string, unknown>;
      const raw =
        record.rentFrequency ??
        record.paymentFrequency ??
        record.rentDuration ??
        record.billingCycle;
      return typeof raw === "string" ? raw : null;
    })
    .filter((value): value is string => !!value?.trim());

  if (!durationValues.length) return "—";
  const first = durationValues[0].trim().toLowerCase();
  const normalized =
    first === "month" || first === "monthly"
      ? "Monthly"
      : first === "year" || first === "yearly" || first === "annual"
        ? "Yearly"
        : first === "week" || first === "weekly"
          ? "Weekly"
          : first === "day" || first === "daily"
            ? "Daily"
            : durationValues[0];
  return normalized;
}

const ACTION_MENU_WIDTH = 144;
/** Two action rows + padding */
const ACTION_MENU_HEIGHT = 76;

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
  const [approvingId, setApprovingId] = React.useState<string | null>(null);

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
    return properties.filter((p) =>
      tab === "pending" ? !p.isApproved : !!p.isApproved,
    );
  }, [properties, tab]);

  const stats = React.useMemo(() => {
    const total = properties.length;
    const pendingApproval = properties.filter((p) => !p.isApproved).length;
    const approved = properties.filter((p) => p.isApproved).length;
    const activeListed = properties.filter(
      (p) => p.isApproved && p.isActive !== false,
    ).length;
    return { total, pendingApproval, approved, activeListed };
  }, [properties]);

  const statusPill = (p: PropertyDTO) => {
    const active = p.isActive !== false;
    return active
      ? "bg-[#D9F99D] text-[#3F6212]"
      : "bg-[#E5E7EB] text-[#374151]";
  };

  const handleApprove = async (propertyId: string) => {
    setApprovingId(propertyId);
    const result = await approveProperty(propertyId);
    setApprovingId(null);
    setActionMenu(null);
    if (!result.success) {
      window.alert(result.error || "Approval failed.");
      return;
    }
    await load();
  };

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
        <title>DWELLA NG · Admin Properties</title>
      </Head>
      <AdminLayout title="Properties">
        <section className="w-full min-w-0 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-fit max-w-full flex-wrap rounded-lg border border-[#E2E8F0] bg-white p-1">
              <button
                type="button"
                onClick={() => setTab("active")}
                className={`rounded-md px-3 py-1.5 text-[12px] ${tab === "active" ? "bg-[#E0F2FE] text-[#0284C7]" : "text-[#64748B]"}`}
              >
                Active Properties
              </button>
              <button
                type="button"
                onClick={() => setTab("pending")}
                className={`rounded-md px-3 py-1.5 text-[12px] ${tab === "pending" ? "bg-[#E0F2FE] text-[#0284C7]" : "text-[#64748B]"}`}
              >
                Pending Approval
              </button>
            </div>
            <button
              type="button"
              className="rounded-[10px] bg-[#111827] px-6 py-2 text-[13px] font-medium text-white opacity-60"
              title="Use landlord dashboard to add properties"
            >
              Add New
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["Total Properties", String(stats.total)],
              ["Approved", String(stats.approved)],
              ["Active listings", String(stats.activeListed)],
              ["Pending approval", String(stats.pendingApproval)],
              ["Under review", String(stats.pendingApproval)],
              ["Vacant / Other", "—"],
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

          <div className="grid grid-cols-1 gap-2.5 rounded-[10px] border border-[#E2E8F0] bg-white p-2.5 sm:grid-cols-2 lg:grid-cols-[1fr_210px_210px_auto] lg:items-center">
            <div className="flex items-center gap-2 rounded-md bg-white px-3 py-2">
              <Search className="h-4 w-4 text-[#94A3B8]" />
              <input
                placeholder="Search..."
                className="w-full bg-white text-[12px] text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
              />
            </div>
            <button className="flex items-center justify-between rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[12px] text-[#64748B]">
              <span>Status</span>
              <span className="text-[#0F172A]">All</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <button className="flex items-center justify-between rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-[12px] text-[#64748B]">
              <span>Property Type</span>
              <span className="text-[#0F172A]">All</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-[13px] text-[#475569]">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
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
              Review property listings and approve pending records when ready.
            </p>
            <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full min-w-[1080px] table-fixed text-[11px]">
                <thead className="text-[#64748B]">
                  <tr>
                    <th className="w-[72px] py-2.5 text-center font-medium">
                      Serial Number
                    </th>
                    <th className="w-[56px] py-2.5 text-center font-medium">
                      Image
                    </th>
                    <th className="w-[140px] py-2.5 text-center font-medium">
                      Name
                    </th>
                    <th className="w-[100px] py-2.5 text-center font-medium">
                      Type
                    </th>
                    <th className="w-[150px] py-2.5 text-center font-medium">
                      Address
                    </th>
                    <th className="w-[56px] py-2.5 text-center font-medium">
                      Units
                    </th>
                    <th className="w-[110px] py-2.5 text-center font-medium">
                      Rent
                    </th>
                    <th className="w-[90px] py-2.5 text-center font-medium">
                      Duration
                    </th>
                    <th className="w-[130px] py-2.5 text-center font-medium">
                      LandLord Name
                    </th>
                    <th className="w-[56px] py-2.5 text-center font-medium">
                      Image
                    </th>
                    <th className="w-[96px] py-2.5 text-center font-medium">
                      Listing Date
                    </th>
                    <th className="w-[120px] py-2.5 text-center font-medium">
                      Status
                    </th>
                    <th className="w-[44px] py-2.5 text-center font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {!loading &&
                    visibleRows.map((row, idx) => {
                      const thumb = row.photos?.[0]?.url;
                      const landlordAvatar = row.landlord?.profilePicture?.url;
                      const initials =
                        landlordDisplayName(row)
                          .split(/\s+/)
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((s) => s[0]?.toUpperCase())
                          .join("") || "?";
                      return (
                        <tr key={row.id} className="border-t border-[#F1F5F9]">
                          <td className="whitespace-nowrap py-2.5 text-center">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 text-center">
                            {thumb ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={thumb}
                                alt=""
                                className="mx-auto h-7 w-7 rounded-full object-cover"
                              />
                            ) : (
                              <div className="mx-auto h-7 w-7 rounded-full bg-gradient-to-br from-[#38BDF8] to-[#0EA5E9]" />
                            )}
                          </td>
                          <td className="py-2.5 text-center">
                            <Link
                              className="hover:underline"
                              href={`/dashboard/admin/properties/${row.id}`}
                            >
                              {row.name}
                            </Link>
                          </td>
                          <td className="py-2.5 text-center">
                            {row.propertyType ?? "—"}
                          </td>
                          <td className="py-2.5 text-center">
                            {formatAddress(row)}
                          </td>
                          <td className="whitespace-nowrap py-2.5 text-center">
                            {row.numberOfUnits ?? "—"}
                          </td>
                          <td className="truncate py-2.5 text-center">
                            {inferRent(row)}
                          </td>
                          <td className="truncate py-2.5 text-center">
                            {inferDuration(row)}
                          </td>
                          <td className="py-2.5 text-center">
                            {landlordDisplayName(row)}
                          </td>
                          <td className="py-2.5 text-center">
                            {landlordAvatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={landlordAvatar}
                                alt=""
                                className="mx-auto h-7 w-7 rounded-full object-cover"
                              />
                            ) : (
                              <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-[#FECACA] text-[10px] font-semibold text-[#7F1D1D]">
                                {initials.slice(0, 2)}
                              </div>
                            )}
                          </td>
                          <td className="whitespace-nowrap py-2.5 text-center">
                            {listingDate(row)}
                          </td>
                          <td className="py-2.5 text-center">
                            {tab === "pending" ? (
                              <div className="flex justify-center gap-2">
                                <button
                                  type="button"
                                  disabled={approvingId === row.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleApprove(row.id);
                                  }}
                                  className="rounded border border-green-500 px-2 py-0.5 text-[10px] text-green-600 disabled:opacity-50"
                                >
                                  {approvingId === row.id ? "…" : "Approve"}
                                </button>
                              </div>
                            ) : (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusPill(row)}`}
                              >
                                {row.isActive !== false ? "Active" : "Inactive"}
                              </span>
                            )}
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
                  No properties in this tab.
                </p>
              ) : null}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[12px] text-[#64748B]">
              <div className="inline-flex items-center gap-2">
                <span>Records shown</span>
                <span className="font-medium text-[#0F172A]">
                  {visibleRows.length}
                </span>
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
