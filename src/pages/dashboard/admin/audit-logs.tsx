import Head from "next/head";
import * as React from "react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";

const AdminAuditLogsPage: NextPageWithLayout = () => {
  const [page, setPage] = React.useState(1);
  const [severity, setSeverity] = React.useState<"All" | "Critical" | "Info">(
    "All",
  );

  const rows = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    role: i % 3 === 0 ? "Admin" : "Landlord",
    action: i % 4 === 0 ? "Suspended User" : "Approved Property",
    entity: i % 4 === 0 ? "User" : "Property",
    severity: i % 3 === 0 ? "Critical" : "Info",
    status: i % 5 === 0 ? "Pending" : "Success",
  })).filter((row) => severity === "All" || row.severity === severity);

  return (
    <>
      <Head>
        <title>DWELLA NG · Audit Logs</title>
      </Head>
      <AdminLayout title="Audit Logs">
        <section className="space-y-4">
          <div className="grid grid-cols-5 gap-2.5">
            {[
              ["Total Logs (30 days)", "18,420"],
              ["Admin Actions", "6,210"],
              ["User Actions", "10,980"],
              ["Critical Action", "312"],
              ["Failed Actions", "148"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-[#E2E8F0] bg-white p-3"
              >
                <p className="text-[11px] text-[#64748B]">{label}</p>
                <p className="text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
            <div className="grid grid-cols-[1fr_220px_220px_220px_auto] items-center gap-3 text-xs">
              <input
                className="h-9 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3"
                placeholder="Search..."
              />
              <input
                className="h-9 rounded-md border border-[#E2E8F0] px-3"
                placeholder="Actor Type      All"
              />
              <input
                className="h-9 rounded-md border border-[#E2E8F0] px-3"
                placeholder="Role      All"
              />
              <select
                value={severity}
                onChange={(event) =>
                  setSeverity(event.target.value as "All" | "Critical" | "Info")
                }
                className="h-9 rounded-md border border-[#E2E8F0] px-3"
              >
                <option>All</option>
                <option>Critical</option>
                <option>Info</option>
              </select>
              <button className="h-9 rounded-md border border-[#E2E8F0] px-4">
                Filters
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
            <p className="text-sm font-semibold">Audit Logs</p>
            <p className="mb-3 text-xs text-[#64748B]">
              Track all system actions and admin activities
            </p>
            <div className="overflow-auto">
              <table className="w-full min-w-[1100px] text-xs">
                <thead className="text-[#64748B]">
                  <tr>
                    <th className="py-2.5 text-left">Log ID</th>
                    <th className="py-2.5 text-left">Actor</th>
                    <th className="py-2.5 text-left">Role</th>
                    <th className="py-2.5 text-left">Action</th>
                    <th className="py-2.5 text-left">Entity</th>
                    <th className="py-2.5 text-left">Entity ID</th>
                    <th className="py-2.5 text-left">Severity</th>
                    <th className="py-2.5 text-left">Date</th>
                    <th className="py-2.5 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-[#F1F5F9]">
                      <td className="py-2.5">LOG001</td>
                      <td className="py-2.5">Sarah James</td>
                      <td className="py-2.5">{row.role}</td>
                      <td className="py-2.5">{row.action}</td>
                      <td className="py-2.5">{row.entity}</td>
                      <td className="py-2.5">PROP102</td>
                      <td className="py-2.5">{row.severity}</td>
                      <td className="py-2.5">7/7/2024</td>
                      <td className="py-2.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${row.status === "Pending" ? "bg-gray-100 text-gray-700" : "bg-green-100 text-green-700"}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-[#64748B]">
              <p>Number Of Items displayed per page</p>
              <div className="inline-flex items-center gap-3">
                <span className="rounded bg-[#E0F2FE] px-2 py-0.5 text-[#0284C7]">
                  12
                </span>
                <span>1-12 of 20 items</span>
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="rounded border border-[#E2E8F0] px-2 py-0.5"
                >
                  {"<"}
                </button>
                <button className="rounded bg-[#1E66FF] px-2 py-0.5 text-white">
                  {page}
                </button>
                <button
                  onClick={() => setPage((prev) => prev + 1)}
                  className="rounded border border-[#E2E8F0] px-2 py-0.5"
                >
                  {">"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default AdminAuditLogsPage;
