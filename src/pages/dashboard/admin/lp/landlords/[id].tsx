import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import {
  ArrowLeft,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
} from "lucide-react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ADMIN_STAT_BG, ADMIN_STAT_LABEL } from "@/lib/adminDesignTokens";

const tabs = [
  "properties",
  "units",
  "tenants",
  "payments",
  "documents",
  "maintenance activity",
  "tenant interactions",
] as const;

const LandlordDetailPage: NextPageWithLayout = () => {
  const [tab, setTab] = React.useState<(typeof tabs)[number]>("properties");

  return (
    <>
      <Head>
        <title>DWELLA NG · Landlord Details</title>
      </Head>
      <AdminLayout title="L & P">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ArrowLeft className="h-4 w-4" />
              <span>Landlord Details</span>
            </div>
            <button className="rounded-md bg-[#111827] px-5 py-1.5 text-xs text-white">
              Message
            </button>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
            <div className="grid grid-cols-[72px_1fr_auto] items-start gap-4">
              <div className="h-16 w-16 rounded-md bg-[url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300')] bg-cover bg-center" />
              <div>
                <h2 className="text-3xl font-semibold">Raman Ismail</h2>
                <div className="mt-2 grid grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-blue-600" />
                    +234 812 345 6789
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-green-600" />
                    RamanIsmail@email.com
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                    Nigeria
                  </div>
                </div>
                <p className="mt-1 flex items-center gap-2 text-xs text-[#334155]">
                  <Send className="h-3.5 w-3.5 text-blue-600" />
                  No. 52 Lifemore Street Okon Lagos
                </p>
              </div>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
                Active
              </span>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-3">
              <div
                className="rounded-md p-3"
                style={{ backgroundColor: ADMIN_STAT_BG.blue }}
              >
                <p
                  className="text-[10px] font-semibold uppercase"
                  style={{ color: ADMIN_STAT_LABEL.blue }}
                >
                  Monthly revenue
                </p>
                <p className="text-[32px] font-semibold leading-none text-[#0F172A]">
                  ₦120,000
                </p>
              </div>
              <div
                className="rounded-md p-3"
                style={{ backgroundColor: ADMIN_STAT_BG.green }}
              >
                <p
                  className="text-[10px] font-semibold uppercase"
                  style={{ color: ADMIN_STAT_LABEL.green }}
                >
                  Total properties
                </p>
                <p className="text-[32px] font-semibold leading-none text-[#0F172A]">
                  8
                </p>
              </div>
              <div
                className="rounded-md p-3"
                style={{ backgroundColor: ADMIN_STAT_BG.purple }}
              >
                <p
                  className="text-[10px] font-semibold uppercase"
                  style={{ color: ADMIN_STAT_LABEL.purple }}
                >
                  Occupied units
                </p>
                <p className="text-[32px] font-semibold leading-none text-[#0F172A]">
                  8
                </p>
              </div>
              <div
                className="rounded-md p-3"
                style={{ backgroundColor: ADMIN_STAT_BG.orange }}
              >
                <p
                  className="text-[10px] font-semibold uppercase"
                  style={{ color: ADMIN_STAT_LABEL.orange }}
                >
                  Active tenants
                </p>
                <p className="text-[32px] font-semibold leading-none text-[#0F172A]">
                  16
                </p>
              </div>
              <div
                className="rounded-md p-3"
                style={{ backgroundColor: ADMIN_STAT_BG.blue }}
              >
                <p
                  className="text-[10px] font-semibold uppercase"
                  style={{ color: ADMIN_STAT_LABEL.blue }}
                >
                  Total rent received
                </p>
                <p className="text-[32px] font-semibold leading-none text-[#0F172A]">
                  ₦1,440,000
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
            <div className="mb-3 inline-flex gap-4 border-b border-[#E2E8F0]">
              {tabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`border-b-2 pb-2 text-xs capitalize ${tab === t ? "border-[#1E66FF] text-[#1E66FF]" : "border-transparent text-[#64748B]"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === "documents" ? (
              <div className="space-y-3">
                <div className="rounded-md border border-[#E2E8F0] p-3">
                  <p className="text-xs font-medium">Government Issued ID</p>
                  <button className="mt-2 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1 text-xs">
                    Choose File
                  </button>
                </div>
                <div className="rounded-md border border-[#E2E8F0] p-3">
                  <p className="text-xs font-medium">
                    Tax Identification Number (TIN)
                  </p>
                  <button className="mt-2 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1 text-xs">
                    Choose File
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full min-w-[1100px] text-xs">
                  <thead className="text-[#64748B]">
                    <tr>
                      <th className="py-2 text-left">Serial Number</th>
                      <th className="py-2 text-left">
                        {tab === "tenant interactions"
                          ? "Tenant"
                          : tab === "payments"
                            ? "Date"
                            : "Name"}
                      </th>
                      <th className="py-2 text-left">
                        {tab === "payments" ? "Tenant" : "Property"}
                      </th>
                      <th className="py-2 text-left">Address</th>
                      <th className="py-2 text-left">
                        {tab === "maintenance activity" ? "Type" : "Date"}
                      </th>
                      <th className="py-2 text-left">Status</th>
                      <th className="py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 12 }, (_, i) => (
                      <tr key={i} className="border-t border-[#F1F5F9]">
                        <td className="py-2">{i + 1}</td>
                        <td className="py-2">
                          {tab === "payments" ? "05 Nov 2025" : "John Okon"}
                        </td>
                        <td className="py-2">Harmony Court — 3BR Duplex</td>
                        <td className="py-2">12 Iroko Street, Uyo, Akwa...</td>
                        <td className="py-2">7/7/2024</td>
                        <td className="py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] ${i % 3 === 0 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                          >
                            {i % 3 === 0 ? "In Progress" : "Resolved"}
                          </span>
                        </td>
                        <td className="py-2">
                          <Link
                            href="#"
                            className="text-[#0284C7] hover:underline"
                          >
                            ...
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default LandlordDetailPage;
