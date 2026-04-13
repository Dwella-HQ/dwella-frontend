import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  DollarSign,
  Mail,
  MessageSquare,
  Phone,
} from "lucide-react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ADMIN_STAT_BG, ADMIN_STAT_LABEL } from "@/lib/adminDesignTokens";

const TenantProfilePage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id: propertyId } = router.query;
  const propertyIdStr = typeof propertyId === "string" ? propertyId : "1";

  const [tab, setTab] = React.useState<
    "overview" | "payments" | "maintenance" | "communications"
  >("overview");

  const tabLabels: Record<typeof tab, string> = {
    overview: "Overview",
    payments: "Payments",
    maintenance: "Maintenance",
    communications: "Communications",
  };

  return (
    <>
      <Head>
        <title>DWELLA NG · Tenant Profile</title>
      </Head>
      <AdminLayout title="Property Details">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                router.push(`/dashboard/admin/properties/${propertyIdStr}`)
              }
              className="inline-flex items-center gap-2 text-sm font-medium text-[#0F172A]"
            >
              <ArrowLeft className="h-4 w-4" />
              Tenant Profile
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-red-500 bg-white px-4 py-2 text-xs font-medium text-red-600"
              >
                Ban
              </button>
              <button
                type="button"
                className="rounded-lg border border-[#111827] bg-white px-4 py-2 text-xs font-medium text-[#111827]"
              >
                Suspend
              </button>
              <button
                type="button"
                className="rounded-lg bg-[#111827] px-4 py-2 text-xs font-medium text-white"
              >
                Message
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400"
                    alt="Tenant"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#0F172A]">
                    Ada Emmanuel
                  </h2>
                  <p className="mt-1 text-sm text-[#64748B]">
                    Tenant • Unit A101
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-medium text-[#166534]">
                Paid
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3 text-sm text-[#334155]">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-[#2563EB]" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">
                    Phone
                  </p>
                  <p className="font-medium">+234 812 345 6789</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-[#16A34A]" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">
                    Email
                  </p>
                  <p className="font-medium">ada.emmanuel@email.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#7C3AED]" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">
                    Unit
                  </p>
                  <p className="font-medium">Unit A101</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: ADMIN_STAT_BG.blue }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: ADMIN_STAT_LABEL.blue }}
                >
                  Monthly rent
                </p>
                <p className="mt-2 text-2xl font-bold text-[#0F172A] lg:text-3xl">
                  ₦120,000
                </p>
              </div>
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: ADMIN_STAT_BG.green }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: ADMIN_STAT_LABEL.green }}
                >
                  Move-in date
                </p>
                <p className="mt-2 text-2xl font-bold text-[#0F172A] lg:text-3xl">
                  Jan 2024
                </p>
              </div>
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: ADMIN_STAT_BG.purple }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: ADMIN_STAT_LABEL.purple }}
                >
                  Lease ends
                </p>
                <p className="mt-2 text-2xl font-bold text-[#0F172A] lg:text-3xl">
                  Jan 2026
                </p>
              </div>
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: ADMIN_STAT_BG.orange }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: ADMIN_STAT_LABEL.orange }}
                >
                  Total paid
                </p>
                <p className="mt-2 text-2xl font-bold text-[#0F172A] lg:text-3xl">
                  ₦1,440,000
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
              <div className="relative h-[220px] overflow-hidden rounded-xl lg:h-[260px]">
                <Image
                  src="https://images.unsplash.com/photo-1616594039964-3f4a8ac8c30f?w=1200"
                  alt="Unit room"
                  fill
                  className="object-cover"
                />
                <div className="absolute left-3 top-3 rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[10px] font-medium text-[#166534]">
                  Occupied
                </div>
                <div className="absolute bottom-3 left-3 text-white drop-shadow-md">
                  <p className="text-2xl font-semibold">Unit A101</p>
                  <p className="text-sm">2BR Apt</p>
                </div>
              </div>
              <div>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-[#0F172A] lg:text-2xl">
                      Unit Information
                    </h3>
                    <p className="mt-1 text-xs text-[#64748B]">
                      Complete details and management
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-medium text-[#0F172A]"
                  >
                    Landlord Profile
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div
                    className="rounded-xl p-3"
                    style={{ backgroundColor: ADMIN_STAT_BG.blue }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: ADMIN_STAT_LABEL.blue }}
                    >
                      Bedrooms
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#0F172A] lg:text-[28px]">
                      2
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-3"
                    style={{ backgroundColor: ADMIN_STAT_BG.green }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: ADMIN_STAT_LABEL.green }}
                    >
                      Bathrooms
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#0F172A] lg:text-[28px]">
                      2
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-3"
                    style={{ backgroundColor: ADMIN_STAT_BG.purple }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: ADMIN_STAT_LABEL.purple }}
                    >
                      Size
                    </p>
                    <p className="mt-1 text-2xl font-bold leading-none text-[#0F172A] lg:text-[28px]">
                      850 <span className="text-lg font-bold">sqft</span>
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-3"
                    style={{ backgroundColor: ADMIN_STAT_BG.orange }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: ADMIN_STAT_LABEL.orange }}
                    >
                      Floor
                    </p>
                    <p className="mt-1 text-xl font-bold text-[#0F172A] lg:text-[28px]">
                      1st Floor
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#64748B]" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                      Amenities
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["AC", "Balcony", "Water Heater"].map((a) => (
                      <span
                        key={a}
                        className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-xs text-[#64748B]"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
            <div className="mb-6 flex flex-wrap gap-6 border-b border-[#E2E8F0]">
              {(
                [
                  "overview",
                  "payments",
                  "maintenance",
                  "communications",
                ] as const
              ).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`relative border-b-2 pb-3 text-sm font-medium transition ${
                    tab === t
                      ? "border-[#2563EB] text-[#2563EB]"
                      : "border-transparent text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  {tabLabels[t]}
                </button>
              ))}
            </div>

            {tab === "overview" ? (
              <div className="space-y-6">
                <div>
                  <p className="mb-4 text-base font-semibold text-[#0F172A]">
                    Lease Information
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                        Lease start
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#64748B]" />
                        <p className="text-sm font-semibold text-[#0F172A]">
                          Jan 2024
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                        Lease end
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#64748B]" />
                        <p className="text-sm font-semibold text-[#0F172A]">
                          Jan 2026
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                        Monthly rent
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-[#64748B]" />
                        <p className="text-sm font-semibold text-[#0F172A]">
                          ₦120,000
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                        Payment status
                      </p>
                      <div className="mt-2">
                        <span className="inline-flex rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-xs font-medium text-[#166534]">
                          Paid
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-4 text-base font-semibold text-[#0F172A]">
                    Emergency Contact
                  </p>
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                    <p className="text-sm font-semibold text-[#0F172A]">
                      John Emmanuel (Brother)
                    </p>
                    <div className="mt-3 flex flex-col gap-2 text-sm text-[#334155]">
                      <p className="inline-flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#94A3B8]" />
                        +234 812 345 6789
                      </p>
                      <p className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[#94A3B8]" />
                        john.emmanuel@email.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {tab === "payments" ? (
              <div className="space-y-3">
                <p className="text-base font-semibold text-[#0F172A]">
                  Payment History
                </p>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-[#E2E8F0] p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">
                        Bank Transfer
                      </p>
                      <p className="mt-1 text-xs text-[#64748B]">
                        05 Dec 2025 · TXN-2025-00{i + 1}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#0F172A]">
                        ₦120,000
                      </p>
                      <span className="mt-1 inline-flex rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-medium text-[#166534]">
                        Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {tab === "maintenance" ? (
              <div className="space-y-3">
                <p className="text-base font-semibold text-[#0F172A]">
                  Maintenance Requests
                </p>
                {["HVAC", "Plumbing"].map((m) => (
                  <div
                    key={m}
                    className="flex items-center justify-between rounded-xl border border-[#E2E8F0] p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{m}</p>
                      <p className="mt-1 text-xs text-[#64748B]">
                        Reported: 05 Dec 2023 · Resolved: 06 Dec 2023
                      </p>
                    </div>
                    <span className="rounded-full bg-[#DBEAFE] px-2.5 py-0.5 text-[10px] font-medium text-[#1D4ED8]">
                      Resolved
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {tab === "communications" ? (
              <div className="space-y-3">
                <p className="text-base font-semibold text-[#0F172A]">
                  Communication History
                </p>
                {[
                  "AC Issue",
                  "Rent Payment Confirmation",
                  "Parking Inquiry",
                ].map((msg) => (
                  <div
                    key={msg}
                    className="flex items-center justify-between rounded-xl border border-[#E2E8F0] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 shrink-0 text-[#2563EB]" />
                      <div>
                        <p className="text-sm font-medium text-[#0F172A]">
                          {msg}
                        </p>
                        <p className="mt-0.5 text-xs text-[#64748B]">
                          The AC in my unit is not cooling properly...
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-xs text-[#64748B]">
                      05 Dec 2025
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <Link
              href={`/dashboard/admin/properties/${propertyIdStr}`}
              className="text-sm font-medium text-[#2563EB] hover:underline"
            >
              Back to property
            </Link>
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default TenantProfilePage;
