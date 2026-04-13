import Head from "next/head";
import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { ArrowLeft, Download, Mail, Phone } from "lucide-react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ADMIN_STAT_BG, ADMIN_STAT_LABEL } from "@/lib/adminDesignTokens";

const AdminUnitDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [withTenant, setWithTenant] = React.useState(true);
  return (
    <>
      <Head>
        <title>DWELLA NG · Admin Unit Detail</title>
      </Head>
      <AdminLayout title="Property Details">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push("/dashboard/admin/properties/1")}
              className="inline-flex items-center gap-2 text-sm text-[#334155]"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => setWithTenant((v) => !v)}
              className="rounded border border-[#CBD5E1] px-3 py-1 text-xs"
            >
              Toggle Tenant State
            </button>
          </div>
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
            <div className="grid grid-cols-[1fr_1.2fr] gap-4">
              <div className="relative h-[220px] overflow-hidden rounded-lg">
                <span className="absolute left-2 top-2 z-10 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-medium text-[#16A34A]">
                  Occupied
                </span>
                <div className="absolute bottom-3 left-3 z-10 text-white">
                  <p className="text-2xl font-semibold">Unit A101</p>
                  <p className="text-xs">2BR Apt</p>
                </div>
                <Image
                  src="https://images.unsplash.com/photo-1616594039964-3f4a8ac8c30f?w=1000"
                  alt="Unit"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-2xl font-semibold">Unit Information</p>
                <p className="text-xs text-[#64748B]">
                  Complete details and management
                </p>
                <p className="mt-2 text-right text-3xl font-semibold">
                  ₦250,000
                </p>
                <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
                  <div
                    className="rounded-md p-3"
                    style={{ backgroundColor: ADMIN_STAT_BG.blue }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase"
                      style={{ color: ADMIN_STAT_LABEL.blue }}
                    >
                      Bedrooms
                    </p>
                    <p className="text-2xl font-semibold text-[#0F172A]">2</p>
                  </div>
                  <div
                    className="rounded-md p-3"
                    style={{ backgroundColor: ADMIN_STAT_BG.green }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase"
                      style={{ color: ADMIN_STAT_LABEL.green }}
                    >
                      Bathrooms
                    </p>
                    <p className="text-2xl font-semibold text-[#0F172A]">2</p>
                  </div>
                  <div
                    className="rounded-md p-3"
                    style={{ backgroundColor: ADMIN_STAT_BG.purple }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase"
                      style={{ color: ADMIN_STAT_LABEL.purple }}
                    >
                      Size
                    </p>
                    <p className="text-2xl font-semibold text-[#0F172A]">
                      850<span className="text-sm">sqft</span>
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
                      Floor
                    </p>
                    <p className="text-2xl font-semibold text-[#0F172A]">
                      1st Floor
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase text-[#64748B]">
                    Amenities
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["AC", "Balcony", "Water Heater"].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 text-[10px] text-[#64748B]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
            <p className="text-xl font-semibold">Current Unit Tenant</p>
            {!withTenant ? (
              <div className="py-10 text-center text-[#94A3B8]">
                No Tenant Assigned
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-[1fr_auto_auto] items-start gap-6">
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DBEAFE] font-semibold text-[#1D4ED8]">
                      A
                    </div>
                    <div>
                      <p className="font-semibold">John Doe</p>
                      <p className="text-xs text-[#64748B] inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" /> +234 812 345 6789
                      </p>
                      <p className="text-xs text-[#64748B] inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" /> ada.emmanuel@email.com
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-md bg-[#111827] px-4 py-1.5 text-xs text-white">
                      Message
                    </button>
                    <button className="rounded-md border border-[#CBD5E1] px-4 py-1.5 text-xs text-[#0F172A]">
                      View Profile
                    </button>
                  </div>
                </div>
                <div className="text-xs">
                  <p className="text-[#64748B]">LEASE START</p>
                  <p className="font-semibold">05 Jan 2024</p>
                  <p className="mt-2 text-[#64748B]">NEXT PAYMENT</p>
                  <p className="font-semibold">05 Jan 2026</p>
                </div>
                <div className="text-xs">
                  <p className="text-[#64748B]">LEASE END</p>
                  <p className="font-semibold">05 Jan 2026</p>
                  <p className="mt-2 text-[#64748B]">STATUS</p>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">
                    Occupied
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xl font-semibold">Unit Payment History</p>
              <button className="inline-flex items-center gap-1 text-xs text-[#2563EB]">
                <Download className="h-3 w-3" /> Export
              </button>
            </div>
            <div className="space-y-2">
              {["05 Dec 2025", "05 Nov 2025", "05 Oct 2025"].map(
                (date, index) => (
                  <div
                    key={date}
                    className="flex items-center justify-between rounded-md border border-[#E2E8F0] px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">Rent Payment</p>
                      <p className="text-xs text-[#94A3B8]">
                        {date} • Bank Transfer
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold">₦120,000</p>
                      <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] text-[#16A34A]">
                        Completed
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
            <p className="mb-3 text-xl font-semibold">
              Unit Maintenance History
            </p>
            <div className="rounded-md border border-[#E2E8F0] px-3 py-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[10px] text-[#2563EB]">
                    Low
                  </span>
                  <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] text-[#16A34A]">
                    Resolved
                  </span>
                </div>
                <span className="text-xs text-[#94A3B8]">Tech Team B</span>
              </div>
              <p className="text-sm font-medium">AC not cooling properly</p>
              <p className="mt-2 text-xs text-[#94A3B8]">
                Reported: 05 Dec 2025
              </p>
              <p className="mt-2 text-xs text-[#16A34A]">
                Resolved: 06 Dec 2025
              </p>
            </div>
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default AdminUnitDetailPage;
