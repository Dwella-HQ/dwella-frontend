import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  Download,
  Flame,
  Home,
  MapPin,
  Shield,
  Waves,
  Wifi,
  Zap,
} from "lucide-react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ADMIN_STAT_BG, ADMIN_STAT_LABEL } from "@/lib/adminDesignTokens";

const AdminPropertyDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [tab, setTab] = React.useState<
    "overview" | "units" | "tenants" | "payments" | "maintenance" | "documents"
  >("overview");
  const tabs = [
    "overview",
    "units",
    "tenants",
    "payments",
    "maintenance",
    "documents",
  ] as const;
  const img =
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200";
  return (
    <>
      <Head>
        <title>DWELLA NG · Admin Property Detail</title>
      </Head>
      <AdminLayout title="Property Details">
        <section className="space-y-6">
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/admin/properties")}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#0F172A] hover:bg-[#F1F5F9]"
                  aria-label="Go back to properties"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h2 className="text-lg font-semibold">
                    Harmony Court — 3BR Duplex
                  </h2>
                  <p className="inline-flex items-center gap-1 text-xs text-[#64748B]">
                    <MapPin className="h-3 w-3 text-[#2563EB]" />
                    12 Iroko Street, Uyo, Akwa Ibom
                  </p>
                </div>
              </div>
              <button className="inline-flex items-center gap-2 rounded-md border border-[#CBD5E1] px-3 py-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
            </div>
            <div className="grid gap-6 border-b border-[#E2E8F0] pb-4 lg:grid-cols-3 lg:items-stretch">
              <div className="lg:col-span-2 flex">
                <div className="flex w-full flex-col gap-4 pr-0 lg:flex-row lg:pr-4">
                  <div className="relative h-[400px] w-full overflow-hidden rounded-lg bg-gray-200 lg:h-[500px] lg:flex-1">
                    <Image
                      src={img}
                      alt="Property"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-row gap-4 lg:flex-col">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="relative h-[100px] flex-1 overflow-hidden rounded-lg bg-gray-200 lg:h-[156px] lg:w-[156px] lg:flex-none"
                      >
                        <Image
                          src={img}
                          alt={`thumb-${n}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-6 border-l border-[#E2E8F0] pl-4">
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className="rounded-lg border border-gray-200 p-4"
                    style={{ backgroundColor: ADMIN_STAT_BG.blue }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase"
                      style={{ color: ADMIN_STAT_LABEL.blue }}
                    >
                      Total Units
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">20</p>
                  </div>
                  <div
                    className="rounded-lg border border-gray-200 p-4"
                    style={{ backgroundColor: ADMIN_STAT_BG.purple }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase"
                      style={{ color: ADMIN_STAT_LABEL.purple }}
                    >
                      Monthly Rent
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      ₦450,000
                    </p>
                  </div>
                  <div
                    className="rounded-lg border border-gray-200 p-4"
                    style={{ backgroundColor: ADMIN_STAT_BG.green }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase"
                      style={{ color: ADMIN_STAT_LABEL.green }}
                    >
                      Occupancy
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">86%</p>
                  </div>
                  <div
                    className="rounded-lg border border-gray-200 p-4"
                    style={{ backgroundColor: ADMIN_STAT_BG.orange }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase"
                      style={{ color: ADMIN_STAT_LABEL.orange }}
                    >
                      Manager
                    </p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      Musa A.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Built</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      2018
                    </p>
                  </div>
                  <div className="h-10 w-px bg-gray-300" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      Parking Space
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      300SQM
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="mb-3 text-xs font-semibold uppercase text-gray-700">
                    Amenities
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {[
                      { icon: Waves, label: "Water Treatment" },
                      { icon: Home, label: "Covered Parking" },
                      { icon: Waves, label: "Water Treatment" },
                      { icon: Shield, label: "Security Gate" },
                      { icon: Zap, label: "24/7 Power" },
                      { icon: Wifi, label: "Fiber Internet" },
                    ].map((item) => (
                      <span
                        key={item.label}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-gray-700"
                      >
                        <item.icon className="h-3.5 w-3.5 text-gray-500" />
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2 overflow-x-auto border-b border-gray-200 scrollbar-hide">
              <div className="inline-flex min-w-max gap-4">
                {tabs.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`relative border-b-2 px-1 py-4 text-sm capitalize ${tab === t ? "border-[#1E66FF] text-[#1E66FF]" : "border-transparent text-[#64748B]"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {tab === "overview" ? (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <p className="mb-4 text-xl font-semibold">Recent Payments</p>
                  {[
                    ["Ada Emmanuel", "A101", "₦120,000", "05 Dec 2025"],
                    ["John Musa", "B208", "₦90,000", "04 Dec 2025"],
                    ["John Musa", "B205", "₦90,000", "04 Dec 2025"],
                    ["Abel Kundo", "A103", "₦120,000", "05 Dec 2025"],
                    ["Sarah Okon", "C305", "₦150,000", "03 Dec 2025"],
                  ].map(([name, unit, amount, date], idx) => (
                    <div
                      key={`${name}-${idx}`}
                      className="flex items-center justify-between border-b border-[#F1F5F9] py-3 text-sm last:border-b-0"
                    >
                      <div>
                        <p className="font-medium">{name}</p>
                        <p className="text-xs text-[#94A3B8]">{unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{amount}</p>
                        <p className="text-xs text-[#94A3B8]">{date}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <p className="mb-4 text-xl font-semibold">
                    Maintenance Requests
                  </p>
                  {[
                    [
                      "Plumbing - Kitchen sink leak",
                      "In Progress",
                      "2 hours ago",
                      "A101",
                      "High",
                    ],
                    [
                      "Electrical - Light fixture",
                      "New",
                      "5 hours ago",
                      "C305",
                      "Medium",
                    ],
                    ["AC not cooling", "New", "1 day ago", "B208", "High"],
                    [
                      "Electrical - Light fixture",
                      "New",
                      "5 hours ago",
                      "B208",
                      "Medium",
                    ],
                  ].map(([issue, status, ago, unit, level], idx) => (
                    <div
                      key={`${issue}-${idx}`}
                      className="border-b border-[#F1F5F9] py-3 last:border-b-0"
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <p className="text-sm font-medium">{issue}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] ${level === "High" ? "bg-[#FEE2E2] text-[#DC2626]" : "bg-[#FEF3C7] text-[#D97706]"}`}
                        >
                          {level}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
                        <span
                          className={`rounded-full px-2 py-0.5 ${status === "In Progress" ? "bg-[#DBEAFE] text-[#1D4ED8]" : "bg-[#F1F5F9] text-[#64748B]"}`}
                        >
                          {status}
                        </span>
                        <span>{ago}</span>
                        <span>{unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {tab === "units" ? (
              <div className="mt-4 rounded-md border border-[#E2E8F0] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    Units List{" "}
                    <span className="ml-1 text-xs text-[#0284C7]">
                      20 Units
                    </span>
                  </p>
                  <button className="text-xs text-[#0284C7]">Export CSV</button>
                </div>
                <table className="w-full text-xs">
                  <thead className="text-[#64748B]">
                    <tr>
                      <th className="py-2 text-left">S/N</th>
                      <th className="py-2 text-left">Unit ID</th>
                      <th className="py-2 text-left">Type</th>
                      <th className="py-2 text-left">Status</th>
                      <th className="py-2 text-left">Tenant</th>
                      <th className="py-2 text-left">Rent</th>
                      <th className="py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 12 }, (_, i) => (
                      <tr key={i} className="border-t border-[#F1F5F9]">
                        <td className="py-2">
                          {String(i + 1).padStart(2, "0")}
                        </td>
                        <td className="py-2">A101</td>
                        <td className="py-2">2BR Apt</td>
                        <td className="py-2">
                          {i % 3 === 0 ? "Maintenance" : "Occupied"}
                        </td>
                        <td className="py-2">John Doe</td>
                        <td className="py-2">₦250,000</td>
                        <td className="py-2">
                          <Link
                            href="/dashboard/admin/properties/1/units/1"
                            className="text-[#0284C7] hover:underline"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {tab === "tenants" ? (
              <div className="mt-4 rounded-md border border-[#E2E8F0] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    Tenants List{" "}
                    <span className="ml-1 text-xs text-[#0284C7]">
                      20 Tenants
                    </span>
                  </p>
                </div>
                <table className="w-full text-xs">
                  <thead className="text-[#64748B]">
                    <tr>
                      <th className="py-2 text-left">S/N</th>
                      <th className="py-2 text-left">Name</th>
                      <th className="py-2 text-left">Unit</th>
                      <th className="py-2 text-left">Phone</th>
                      <th className="py-2 text-left">Email</th>
                      <th className="py-2 text-left">Status</th>
                      <th className="py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 8 }, (_, i) => (
                      <tr key={i} className="border-t border-[#F1F5F9]">
                        <td className="py-2">
                          {String(i + 1).padStart(2, "0")}
                        </td>
                        <td className="py-2">Ada Emmanuel</td>
                        <td className="py-2">A101</td>
                        <td className="py-2">+234 812 345 6789</td>
                        <td className="py-2">ada.emmanuel@email.com</td>
                        <td className="py-2">
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] text-green-700">
                            Paid
                          </span>
                        </td>
                        <td className="py-2">
                          <Link
                            href="/dashboard/admin/properties/1/tenants/1"
                            className="text-[#0284C7] hover:underline"
                          >
                            View Profile
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {tab === "documents" ? (
              <div className="mt-4 rounded-md border border-[#E2E8F0] p-3">
                <p className="mb-2 text-sm font-semibold">Property Documents</p>
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={i}
                      className="rounded-md border border-[#E2E8F0] p-2"
                    >
                      <p className="text-xs font-medium">Document Title.pdf</p>
                      <p className="text-[10px] text-[#64748B]">
                        Legal · 2.4 MB
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button className="rounded bg-[#F1F5F9] px-2 py-1 text-[10px]">
                          Download
                        </button>
                        <button className="rounded bg-[#EEF2FF] px-2 py-1 text-[10px] text-[#1D4ED8]">
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default AdminPropertyDetailPage;
