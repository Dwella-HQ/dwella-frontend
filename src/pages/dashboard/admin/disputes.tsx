import Head from "next/head";
import * as React from "react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";

const AdminDisputesPage: NextPageWithLayout = () => {
  const [selectedId, setSelectedId] = React.useState(0);
  const [response, setResponse] = React.useState("");
  const [resolved, setResolved] = React.useState<number[]>([]);
  const disputes = Array.from({ length: 9 }, (_, i) => ({
    id: i,
    title:
      i === 0 ? "Maintenance Issue Not Resolved" : "Tenant Not Paying Rent",
    status: resolved.includes(i) ? "Resolved" : i < 2 ? "Open" : "Resolved",
  }));

  return (
    <>
      <Head>
        <title>DWELLA NG · Disputes</title>
      </Head>
      <AdminLayout title="Disputes">
        <section className="relative w-full min-w-0 space-y-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px]">
            <div className="rounded-lg border border-[#E2E8F0] bg-white p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                <input
                  className="h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-[#0F172A]"
                  placeholder="Search..."
                />
                <select
                  defaultValue="all"
                  className="h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-[12px] text-[#0F172A]"
                >
                  <option value="all">All statuses</option>
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-white p-3 text-center">
              <p className="text-[11px] text-[#64748B]">Open Disputes</p>
              <p className="text-2xl font-semibold">2</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:grid lg:h-[680px] lg:grid-cols-[320px_1fr]">
            <div className="max-h-[min(50vh,400px)] space-y-2 overflow-y-auto rounded-lg border border-[#E2E8F0] bg-white p-3 lg:max-h-none">
              <p className="text-sm font-semibold">All Disputes</p>
              {Array.from({ length: 9 }, (_, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedId(i)}
                  className={`cursor-pointer rounded-md border p-3 text-xs ${selectedId === i ? "border-[#BFDBFE] bg-[#EFF6FF]" : "border-[#E2E8F0]"}`}
                >
                  <p className="font-medium">{disputes[i].title}</p>
                  <div className="mt-1 flex gap-2">
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] text-red-600">
                      High
                    </span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] text-green-700">
                      {disputes[i].status}
                    </span>
                  </div>
                  <p className="mt-1 text-[#64748B]">Dec 26, 2024</p>
                </div>
              ))}
            </div>
            <div className="min-w-0 rounded-lg border border-[#E2E8F0] bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <p className="text-lg font-medium sm:text-2xl lg:text-[30px]">
                  Maintenance Issue Not Resolved
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-600">
                    High Priority
                  </span>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-600">
                    {disputes[selectedId].status}
                  </span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-md bg-[#F8FAFC] p-3 text-sm">
                  Submitted By
                  <br />
                  <span className="font-medium">Sarah Johnson</span>
                  <br />
                  <span className="text-[#64748B] text-xs">Tenant</span>
                </div>
                <div className="rounded-md bg-[#F8FAFC] p-3 text-sm">
                  Against
                  <br />
                  <span className="font-medium">John Smith</span>
                  <br />
                  <span className="text-[#64748B] text-xs">Landlord</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-[#334155] sm:grid-cols-2">
                <div>Sunset Apartments - Unit 1A</div>
                <div>Submitted Dec 28, 2024</div>
              </div>
              <div className="mt-5">
                <p className="mb-2 text-sm font-medium">Description</p>
                <div className="rounded-md bg-[#F8FAFC] p-3 text-sm text-[#334155]">
                  I reported a leaking pipe 2 weeks ago and it still has not
                  been fixed. The landlord is not responding to my messages and
                  the leak is getting worse.
                </div>
              </div>
              <div className="mt-5">
                <p className="mb-2 text-sm font-medium">Admin Response</p>
                <textarea
                  value={response}
                  onChange={(event) => setResponse(event.target.value)}
                  className="h-28 w-full rounded-md border border-[#E2E8F0] bg-white p-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
                  placeholder="Type your response or resolution here..."
                />
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button className="rounded-md bg-[#111827] py-3 text-sm font-medium text-white">
                  Send Response
                </button>
                <button
                  onClick={() =>
                    setResolved((prev) =>
                      prev.includes(selectedId) ? prev : [...prev, selectedId],
                    )
                  }
                  className="rounded-md bg-[#16A34A] py-3 text-sm font-medium text-white"
                >
                  Mark as Resolved
                </button>
              </div>
            </div>
          </div>

          {/* No disputes API wired yet — list UI is placeholder only */}
          <div
            aria-hidden="true"
            className="absolute inset-0 z-30 rounded-xl bg-white/60 backdrop-blur-[1px]"
          >
            <div className="sticky top-24 flex justify-center px-4">
              <div className="rounded-full border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-900 shadow-sm">
                Disputes are coming soon
              </div>
            </div>
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default AdminDisputesPage;
