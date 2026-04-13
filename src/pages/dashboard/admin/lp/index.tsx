import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  adminLandlords,
  adminPropertyManagers,
} from "@/data/mockAdminDashboard";

const LPPage: NextPageWithLayout = () => {
  const [tab, setTab] = React.useState<"active" | "pending" | "managers">(
    "active",
  );
  const landlordRows =
    tab === "pending"
      ? adminLandlords.filter((l) => l.status === "Pending")
      : adminLandlords.filter((l) => l.status !== "Pending");

  return (
    <>
      <Head>
        <title>DWELLA NG · L & P</title>
      </Head>
      <AdminLayout title="L & P">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-md bg-white p-1 shadow-sm">
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

          <div className="grid grid-cols-5 gap-3">
            {tab === "managers"
              ? [
                  "Property Managers",
                  "Properties Managed",
                  "Total Units",
                  "Active Tenants",
                  "Assigned Landlords",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-lg border border-[#E2E8F0] bg-white p-3"
                  >
                    <p className="text-[11px] text-[#64748B]">{item}</p>
                    <p className="text-2xl font-semibold">
                      {item === "Property Managers" ? "1,500" : "60"}
                    </p>
                  </div>
                ))
              : [
                  "Total Landlords",
                  tab === "pending"
                    ? "Awaiting Verification"
                    : "Pending Approval",
                  "Properties Managed",
                  "Total Units",
                  "Total Revenue",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-lg border border-[#E2E8F0] bg-white p-3"
                  >
                    <p className="text-[11px] text-[#64748B]">{item}</p>
                    <p className="text-2xl font-semibold">
                      {item === "Total Revenue" ? "1,372" : "1,500"}
                    </p>
                  </div>
                ))}
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
            <p className="mb-3 text-sm font-semibold">
              {tab === "managers"
                ? "Property Managers"
                : tab === "pending"
                  ? "Landlords Pending Verification"
                  : "Landlords"}
            </p>
            <div className="overflow-auto">
              {tab === "managers" ? (
                <table className="w-full min-w-[1100px] text-xs">
                  <thead className="text-[#64748B]">
                    <tr>
                      <th className="py-2 text-left">S/N</th>
                      <th className="py-2 text-left">Name</th>
                      <th className="py-2 text-left">Properties Managed</th>
                      <th className="py-2 text-left">Total Units</th>
                      <th className="py-2 text-left">Active Tenants</th>
                      <th className="py-2 text-left">Rent Managed</th>
                      <th className="py-2 text-left">Assigned Landlords</th>
                      <th className="py-2 text-left">Status</th>
                      <th className="py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminPropertyManagers.map((row, i) => (
                      <tr key={row.id} className="border-t border-[#F1F5F9]">
                        <td className="py-2">{i + 1}</td>
                        <td className="py-2">{row.name}</td>
                        <td className="py-2">{row.propertiesManaged}</td>
                        <td className="py-2">{row.totalUnits}</td>
                        <td className="py-2">{row.activeTenants}</td>
                        <td className="py-2">{row.rentManaged}</td>
                        <td className="py-2">{row.assignedLandlords}</td>
                        <td className="py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] ${row.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                          >
                            {row.status}
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
                      <th className="py-2 text-left">Properties</th>
                      <th className="py-2 text-left">Units</th>
                      <th className="py-2 text-left">Monthly Revenue</th>
                      <th className="py-2 text-left">Total Revenue</th>
                      <th className="py-2 text-left">Status</th>
                      <th className="py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {landlordRows.map((row, i) => (
                      <tr key={row.id} className="border-t border-[#F1F5F9]">
                        <td className="py-2">{i + 1}</td>
                        <td className="py-2">{row.name}</td>
                        <td className="py-2">{row.phone}</td>
                        <td className="py-2">{row.properties}</td>
                        <td className="py-2">{row.units}</td>
                        <td className="py-2">{row.monthlyRevenue}</td>
                        <td className="py-2">{row.totalRevenue}</td>
                        <td className="py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] ${row.status === "Active" ? "bg-green-100 text-green-700" : row.status === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2">
                          {tab === "pending" ? (
                            <div className="flex gap-2">
                              <Link
                                href={`/dashboard/admin/lp/pending/${row.id}`}
                                className="rounded border border-green-500 px-2 py-0.5 text-[11px] text-green-600"
                              >
                                Approve
                              </Link>
                              <button className="rounded border border-red-500 px-2 py-0.5 text-[11px] text-red-600">
                                Reject
                              </button>
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
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-[#64748B]">
              <p>Number Of Items displayed per page</p>
              <div className="inline-flex items-center gap-2">
                <span className="rounded bg-[#E0F2FE] px-2 py-0.5 text-[#0284C7]">
                  12
                </span>
                <span>1-12 of 20 items</span>
              </div>
            </div>
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default LPPage;
