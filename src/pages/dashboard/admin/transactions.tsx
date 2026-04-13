import Head from "next/head";
import * as React from "react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";

const AdminTransactionsPage: NextPageWithLayout = () => {
  const [status, setStatus] = React.useState<"All" | "Pending" | "Success">(
    "All",
  );
  const [page, setPage] = React.useState(1);
  const rows = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    status: i % 6 === 0 ? "Pending" : "Success",
  })).filter((row) => status === "All" || row.status === status);

  return (
    <>
      <Head>
        <title>DWELLA NG · Transactions</title>
      </Head>
      <AdminLayout title="Transactions">
        <section className="space-y-4">
          <div className="grid grid-cols-6 gap-2.5">
            {[
              ["Total Transactions", "4,215"],
              ["Successful", "3,980"],
              ["Pending", "102"],
              ["Failed", "115"],
              ["Flagged", "18"],
              ["Total Volume", "₦184,250,000"],
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
            <div className="grid grid-cols-[1fr_300px_auto] items-center gap-3 text-xs">
              <input
                className="h-9 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3"
                placeholder="Search..."
              />
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as "All" | "Pending" | "Success")
                }
                className="h-9 rounded-md border border-[#E2E8F0] px-3"
              >
                <option>All</option>
                <option>Pending</option>
                <option>Success</option>
              </select>
              <button className="h-9 rounded-md border border-[#E2E8F0] px-4">
                Filters
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
            <p className="text-sm font-semibold">Transactions</p>
            <p className="mb-3 text-xs text-[#64748B]">
              Monitor and manage all financial activity
            </p>
            <div className="overflow-auto">
              <table className="w-full min-w-[1050px] text-xs">
                <thead className="text-[#64748B]">
                  <tr>
                    <th className="py-2.5 text-left">Transaction ID</th>
                    <th className="py-2.5 text-left">Tenant</th>
                    <th className="py-2.5 text-left">Landlord</th>
                    <th className="py-2.5 text-left">Property</th>
                    <th className="py-2.5 text-left">Amount</th>
                    <th className="py-2.5 text-left">Date</th>
                    <th className="py-2.5 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-[#F1F5F9]">
                      <td className="py-2.5">TXN10234</td>
                      <td className="py-2.5">Sarah James</td>
                      <td className="py-2.5">Sarah James</td>
                      <td className="py-2.5">Harmony Court...</td>
                      <td className="py-2.5">₦350,000</td>
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

export default AdminTransactionsPage;
