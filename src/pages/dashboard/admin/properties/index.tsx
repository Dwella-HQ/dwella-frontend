import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/router";
import {
  ChevronDown,
  MoreVertical,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminPropertyRows } from "@/data/mockAdminDashboard";

const AdminPropertiesPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [tab, setTab] = React.useState<"active" | "pending">("active");
  const [openActionRowId, setOpenActionRowId] = React.useState<string | null>(
    null,
  );
  const statusPill = (value: string) =>
    value === "Occupied"
      ? "bg-[#D9F99D] text-[#3F6212]"
      : "bg-[#E5E7EB] text-[#374151]";

  React.useEffect(() => {
    const handleWindowClick = () => setOpenActionRowId(null);
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  return (
    <>
      <Head>
        <title>DWELLA NG · Admin Properties</title>
      </Head>
      <AdminLayout title="Properties">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-1">
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
            <button className="rounded-[10px] bg-[#111827] px-6 py-2 text-[13px] font-medium text-white">
              Add New
            </button>
          </div>

          <div className="grid grid-cols-6 gap-2.5">
            {[
              "Total Properties",
              "Active Properties",
              "Vacant Properties",
              "Fully Occupies",
              "Under Review",
              "Rejected",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2.5"
              >
                <p className="text-[12px] text-[#64748B]">{item}</p>
                <p className="mt-1 text-[32px] font-semibold leading-none">
                  1,372
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_210px_210px_auto] items-center gap-2.5 rounded-[10px] border border-[#E2E8F0] bg-white p-2.5">
            <div className="flex items-center gap-2 rounded-md bg-[#F8FAFC] px-3 py-2">
              <Search className="h-4 w-4 text-[#94A3B8]" />
              <input
                placeholder="Search..."
                className="w-full bg-transparent text-[12px] outline-none placeholder:text-[#94A3B8]"
              />
            </div>
            <button className="flex items-center justify-between rounded-md border border-[#E2E8F0] px-3 py-2 text-[12px] text-[#64748B]">
              <span>Status</span>
              <span className="text-[#0F172A]">All</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <button className="flex items-center justify-between rounded-md border border-[#E2E8F0] px-3 py-2 text-[12px] text-[#64748B]">
              <span>Property Type</span>
              <span className="text-[#0F172A]">All</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-[13px] text-[#475569]">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </div>

          <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-4">
            <p className="text-[20px] font-semibold leading-none">
              Property List
            </p>
            <p className="mb-4 mt-1 text-[12px] text-[#64748B]">
              View and manage all properties across the platform
            </p>
            <div className="overflow-auto">
              <table className="w-full min-w-[1260px] text-[11px]">
                <thead className="text-[#64748B]">
                  <tr>
                    <th className="py-2.5 text-center font-medium">
                      Serial Number
                    </th>
                    <th className="py-2.5 text-center font-medium">Image</th>
                    <th className="py-2.5 text-center font-medium">Name</th>
                    <th className="py-2.5 text-center font-medium">Type</th>
                    <th className="py-2.5 text-center font-medium">Address</th>
                    <th className="py-2.5 text-center font-medium">Units</th>
                    <th className="py-2.5 text-center font-medium">
                      Monthly Rent
                    </th>
                    <th className="py-2.5 text-center font-medium">
                      LandLord Name
                    </th>
                    <th className="py-2.5 text-center font-medium">Image</th>
                    <th className="py-2.5 text-center font-medium">
                      Listing Date
                    </th>
                    <th className="py-2.5 text-center font-medium">Status</th>
                    <th className="py-2.5 text-center font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {adminPropertyRows.map((row) => (
                    <tr key={row.id} className="border-t border-[#F1F5F9]">
                      <td className="py-2.5 text-center">{row.id}</td>
                      <td className="py-2.5 text-center">
                        <div className="mx-auto h-7 w-7 rounded-full bg-gradient-to-br from-[#38BDF8] to-[#0EA5E9]" />
                      </td>
                      <td className="py-2.5 text-center">
                        <Link
                          className="hover:underline"
                          href={`/dashboard/admin/properties/${row.id}`}
                        >
                          {row.name}
                        </Link>
                      </td>
                      <td className="py-2.5 text-center">{row.type}</td>
                      <td className="py-2.5 text-center">{row.address}</td>
                      <td className="py-2.5 text-center">{row.units}</td>
                      <td className="py-2.5 text-center">{row.monthlyRent}</td>
                      <td className="py-2.5 text-center">{row.landlordName}</td>
                      <td className="py-2.5 text-center">
                        <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-[#FECACA] text-[10px] font-semibold text-[#7F1D1D]">
                          RI
                        </div>
                      </td>
                      <td className="py-2.5 text-center">{row.listingDate}</td>
                      <td className="py-2.5 text-center">
                        {tab === "pending" ? (
                          <div className="flex justify-center gap-2">
                            <button className="rounded border border-green-500 px-2 py-0.5 text-[10px] text-green-600">
                              Approve
                            </button>
                            <button className="rounded border border-red-500 px-2 py-0.5 text-[10px] text-red-600">
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusPill(row.status)}`}
                          >
                            {row.status}
                          </span>
                        )}
                      </td>
                      <td className="relative py-2.5 text-center">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenActionRowId((prev) =>
                              prev === row.id ? null : row.id,
                            );
                          }}
                          className="text-[#94A3B8]"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openActionRowId === row.id ? (
                          <div
                            onClick={(event) => event.stopPropagation()}
                            className="absolute right-0 top-8 z-20 w-36 rounded-md border border-[#E2E8F0] bg-white p-1 text-left shadow-lg"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionRowId(null);
                                router.push(
                                  `/dashboard/admin/properties/${row.id}`,
                                );
                              }}
                              className="block w-full rounded px-2 py-1.5 text-xs text-[#0F172A] hover:bg-[#F8FAFC]"
                            >
                              View Property
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionRowId(null);
                                router.push(
                                  `/dashboard/admin/properties/${row.id}?mode=edit`,
                                );
                              }}
                              className="block w-full rounded px-2 py-1.5 text-xs text-[#0F172A] hover:bg-[#F8FAFC]"
                            >
                              Edit Property
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-[12px] text-[#64748B]">
              <div className="inline-flex items-center gap-2">
                <span>Number Of Items displayed per page</span>
                <button className="inline-flex items-center gap-1 rounded-md bg-[#2563EB] px-2 py-0.5 text-white">
                  12
                  <ChevronDown className="h-3 w-3" />
                </button>
                <span>1-12 of 20 items</span>
              </div>
              <div className="inline-flex items-center gap-3">
                <button className="text-[#64748B]">{"<"}</button>
                <button className="h-5 w-5 rounded bg-[#2563EB] text-[11px] text-white">
                  1
                </button>
                <button className="text-[#64748B]">2</button>
                <button className="text-[#64748B]">{">"}</button>
              </div>
            </div>
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default AdminPropertiesPage;
