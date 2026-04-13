import Head from "next/head";
import * as React from "react";
import { ArrowLeft, Mail, MapPin, Phone, Send } from "lucide-react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ADMIN_STAT_BG, ADMIN_STAT_LABEL } from "@/lib/adminDesignTokens";

const tabs = [
  "properties",
  "maintenance activity",
  "tenant interactions",
] as const;

const PropertyManagerDetailPage: NextPageWithLayout = () => {
  const [tab, setTab] = React.useState<(typeof tabs)[number]>("properties");
  return (
    <>
      <Head>
        <title>DWELLA NG · Property Manager Details</title>
      </Head>
      <AdminLayout title="L & P">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ArrowLeft className="h-4 w-4" />
              <span>Property Manager Details</span>
            </div>
            <button className="rounded-md bg-[#111827] px-5 py-1.5 text-xs text-white">
              Message
            </button>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
            <div className="grid grid-cols-[72px_1fr_auto] items-start gap-4">
              <div className="h-16 w-16 rounded-md bg-[url('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300')] bg-cover bg-center" />
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

            <div className="mt-4 grid grid-cols-4 gap-3">
              <div
                className="rounded-md p-3"
                style={{ backgroundColor: ADMIN_STAT_BG.blue }}
              >
                <p
                  className="text-[10px] font-semibold uppercase"
                  style={{ color: ADMIN_STAT_LABEL.blue }}
                >
                  Properties managed
                </p>
                <p className="text-4xl font-semibold text-[#0F172A]">3</p>
              </div>
              <div
                className="rounded-md p-3"
                style={{ backgroundColor: ADMIN_STAT_BG.green }}
              >
                <p
                  className="text-[10px] font-semibold uppercase"
                  style={{ color: ADMIN_STAT_LABEL.green }}
                >
                  Total units
                </p>
                <p className="text-4xl font-semibold text-[#0F172A]">18</p>
              </div>
              <div
                className="rounded-md p-3"
                style={{ backgroundColor: ADMIN_STAT_BG.purple }}
              >
                <p
                  className="text-[10px] font-semibold uppercase"
                  style={{ color: ADMIN_STAT_LABEL.purple }}
                >
                  Active tenants
                </p>
                <p className="text-4xl font-semibold text-[#0F172A]">15</p>
              </div>
              <div
                className="rounded-md p-3"
                style={{ backgroundColor: ADMIN_STAT_BG.orange }}
              >
                <p
                  className="text-[10px] font-semibold uppercase"
                  style={{ color: ADMIN_STAT_LABEL.orange }}
                >
                  Assigned landlords
                </p>
                <p className="text-4xl font-semibold text-[#0F172A]">2</p>
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
            <div className="overflow-auto">
              <table className="w-full min-w-[1000px] text-xs">
                <thead className="text-[#64748B]">
                  <tr>
                    <th className="py-2 text-left">Serial Number</th>
                    <th className="py-2 text-left">
                      {tab === "tenant interactions" ? "Tenant" : "Property"}
                    </th>
                    <th className="py-2 text-left">Address</th>
                    <th className="py-2 text-left">Date</th>
                    <th className="py-2 text-left">Type</th>
                    <th className="py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 12 }, (_, i) => (
                    <tr key={i} className="border-t border-[#F1F5F9]">
                      <td className="py-2">{i + 1}</td>
                      <td className="py-2">
                        {tab === "tenant interactions"
                          ? "John Okon"
                          : "Harmony Court — 3BR Duplex"}
                      </td>
                      <td className="py-2">12 Iroko Street, Uyo, Akwa...</td>
                      <td className="py-2">7/7/2024</td>
                      <td className="py-2">
                        {tab === "maintenance activity"
                          ? "Maintenance"
                          : tab === "tenant interactions"
                            ? "Chat Message"
                            : "Renting"}
                      </td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] ${i % 3 === 0 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                        >
                          {i % 3 === 0 ? "In Progress" : "Resolved"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default PropertyManagerDetailPage;
