import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { ChevronDown, MoreVertical, Search, SlidersHorizontal } from "lucide-react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminTenantRows, type AdminTenantRow } from "@/data/mockAdminDashboard";
import { deleteTenant, getTenants } from "@/api/tenants";

const DEFAULT_LEASE_END = "7/7/2024";
const DEFAULT_MONTHLY_RENT = "NGN 439,000";
const DEFAULT_UNITS = 11;

const AdminTenantsPage: NextPageWithLayout = () => {
  const [rows, setRows] = React.useState<AdminTenantRow[]>(adminTenantRows);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"All" | "Active" | "Inactive">(
    "All",
  );
  const [openActionRowId, setOpenActionRowId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const result = await getTenants({ limit: 100 });
      if (!mounted) return;
      if (result.success) {
        const mapped: AdminTenantRow[] = result.data.map((tenant, index) => ({
          id: String(tenant.id),
          name: tenant.fullName || tenant.name || "Tenant",
          phone: tenant.phoneNumber || tenant.phone || "--",
          units: DEFAULT_UNITS,
          monthlyRent: DEFAULT_MONTHLY_RENT,
          leaseEnds: DEFAULT_LEASE_END,
          rentStatus: "Paid",
          dateJoined: tenant.createdAt
            ? new Date(tenant.createdAt).toLocaleDateString("en-GB")
            : DEFAULT_LEASE_END,
          accountStatus:
            typeof tenant.isActive === "boolean"
              ? tenant.isActive
                ? "Active"
                : "Inactive"
              : Number(tenant.isActive ?? 1) === 1
                ? "Active"
                : "Inactive",
        }));
        setRows(mapped.length ? mapped : adminTenantRows);
      }
      setLoading(false);
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    const closeMenu = () => setOpenActionRowId(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.phone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" ? true : row.accountStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = (id: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              accountStatus: row.accountStatus === "Active" ? "Inactive" : "Active",
            }
          : row,
      ),
    );
    setOpenActionRowId(null);
  };

  const handleBan = async (id: string) => {
    const confirmed = window.confirm("Ban this tenant? This will delete the tenant account.");
    if (!confirmed) return;
    const result = await deleteTenant(id);
    if (result.success) {
      setRows((prev) => prev.filter((row) => row.id !== id));
    } else {
      window.alert(result.error || "Failed to ban tenant.");
    }
    setOpenActionRowId(null);
  };

  const handleMessage = (name: string) => {
    window.alert(`Open Messages and start a chat with ${name}.`);
    setOpenActionRowId(null);
  };

  const statusPill = (value: "Paid" | "Unpaid") =>
    value === "Paid"
      ? "bg-[#DCFCE7] text-[#15803D]"
      : "bg-[#FEE2E2] text-[#B91C1C]";
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
          <div className="grid grid-cols-4 gap-2.5">
            {[
              { label: "All Tenants", value: "7,000" },
              { label: "Active", value: "1,372" },
              { label: "Suspended", value: "1,372" },
              { label: "New This Month", value: "1,372" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2.5"
              >
                <p className="text-[12px] text-[#64748B]">{item.label}</p>
                <p className="mt-1 text-[32px] font-semibold leading-none">{item.value}</p>
              </div>
            ))}
          </div>

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
                  prev === "All" ? "Active" : prev === "Active" ? "Inactive" : "All",
                )
              }
            >
              <span>Status</span>
              <span className="text-[#0F172A]">{statusFilter}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-[13px] text-[#475569]">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </div>

          <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-4">
            <p className="text-[20px] font-semibold leading-none">Tenant List</p>
            <p className="mb-4 mt-1 text-[12px] text-[#64748B]">
              View and manage all Tenant on the platform
            </p>
            <div className="overflow-auto">
              <table className="w-full min-w-[1260px] text-[11px]">
                <thead className="text-[#64748B]">
                  <tr>
                    <th className="py-2.5 text-center font-medium">Serial Number</th>
                    <th className="py-2.5 text-center font-medium">Image</th>
                    <th className="py-2.5 text-left font-medium">Name</th>
                    <th className="py-2.5 text-left font-medium">Number</th>
                    <th className="py-2.5 text-center font-medium">Units</th>
                    <th className="py-2.5 text-left font-medium">Monthly Rent</th>
                    <th className="py-2.5 text-left font-medium">Lease Ends</th>
                    <th className="py-2.5 text-left font-medium">Rent Status</th>
                    <th className="py-2.5 text-left font-medium">Date Joined</th>
                    <th className="py-2.5 text-left font-medium">Account Status</th>
                    <th className="py-2.5 text-center font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="border-t border-[#F1F5F9] hover:bg-[#F8FAFC]">
                      <td className="py-2.5 text-center">{row.id}</td>
                      <td className="py-2.5">
                        <div className="mx-auto relative h-7 w-7 overflow-hidden rounded-full">
                          <Image
                            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100"
                            alt={row.name}
                            fill
                            className="object-cover"
                          />
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
                      <td className="py-2.5">{row.phone}</td>
                      <td className="py-2.5 text-center">{row.units}</td>
                      <td className="py-2.5">{row.monthlyRent}</td>
                      <td className="py-2.5">{row.leaseEnds}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${statusPill(
                            row.rentStatus,
                          )}`}
                        >
                          {row.rentStatus}
                        </span>
                      </td>
                      <td className="py-2.5">{row.dateJoined}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${accountPill(
                            row.accountStatus,
                          )}`}
                        >
                          {row.accountStatus}
                        </span>
                      </td>
                      <td className="relative py-2.5 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionRowId((prev) => (prev === row.id ? null : row.id));
                          }}
                          className="rounded p-1 text-[#94A3B8] hover:bg-[#F1F5F9]"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openActionRowId === row.id ? (
                          <div
                            className="absolute z-10 mt-1 w-32 rounded-md border border-[#E2E8F0] bg-white p-1 shadow-lg"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="w-full rounded px-2 py-1.5 text-left text-[11px] text-[#0F172A] hover:bg-[#F8FAFC]"
                              onClick={() => handleToggleStatus(row.id)}
                            >
                              {row.accountStatus === "Active" ? "Suspend" : "Activate"}
                            </button>
                            <button
                              type="button"
                              className="w-full rounded px-2 py-1.5 text-left text-[11px] text-[#B91C1C] hover:bg-[#FEF2F2]"
                              onClick={() => void handleBan(row.id)}
                            >
                              Ban
                            </button>
                            <button
                              type="button"
                              className="w-full rounded px-2 py-1.5 text-left text-[11px] text-[#0F172A] hover:bg-[#F8FAFC]"
                              onClick={() => handleMessage(row.name)}
                            >
                              Message
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {loading ? (
              <p className="mt-3 text-[12px] text-[#64748B]">Loading tenants...</p>
            ) : null}

            <div className="mt-4 flex items-center justify-between text-[12px] text-[#64748B]">
              <div className="inline-flex items-center gap-2">
                Number Of items displayed per page
                <button className="inline-flex items-center gap-1 rounded-md bg-[#2563EB] px-2 py-1 text-white">
                  12
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              <div>
                {filteredRows.length === 0
                  ? "0 items"
                  : `1-${Math.min(12, filteredRows.length)} of ${filteredRows.length} items`}
              </div>
              <div className="inline-flex items-center gap-2">
                <button className="rounded-md border border-[#E2E8F0] px-2 py-1 text-[#64748B]">
                  1
                </button>
                <button className="rounded-md px-2 py-1 text-[#94A3B8]">2</button>
              </div>
            </div>
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default AdminTenantsPage;
