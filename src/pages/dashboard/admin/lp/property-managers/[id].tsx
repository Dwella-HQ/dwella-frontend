import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";
import { ArrowLeft, Loader2, Mail, MapPin, Phone, Shield } from "lucide-react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ADMIN_STAT_BG, ADMIN_STAT_LABEL } from "@/lib/adminDesignTokens";
import {
  getPropertyManager,
  type PropertyManagerDTO,
} from "@/api/property-managers";

const tabs = [
  "properties",
  "maintenance activity",
  "tenant interactions",
] as const;

/** API often omits PM name/email; identity comes from the assigned landlord. */
function primaryDisplayName(pm: PropertyManagerDTO): string {
  const l = pm.landlord;
  const fromLandlordUser =
    l?.user?.fullName?.trim() ||
    l?.landLordName?.trim() ||
    l?.user?.email?.trim();
  return (
    pm.fullName?.trim() ||
    pm.name?.trim() ||
    pm.user?.fullName?.trim() ||
    (typeof pm.email === "string" ? pm.email.trim() : "") ||
    fromLandlordUser ||
    "Property manager"
  );
}

function contactEmail(pm: PropertyManagerDTO): string {
  if (typeof pm.email === "string" && pm.email) return pm.email;
  if (pm.user?.email) return pm.user.email;
  if (pm.landlord?.user?.email) return pm.landlord.user.email;
  return "—";
}

function contactPhone(pm: PropertyManagerDTO): string {
  if (pm.phone) return pm.phone;
  if (pm.user?.phoneNumber) return pm.user.phoneNumber;
  if (pm.landlord?.user && "phoneNumber" in pm.landlord.user) {
    const p = (pm.landlord.user as { phoneNumber?: string | null }).phoneNumber;
    if (typeof p === "string" && p.trim()) return p;
  }
  return "—";
}

function avatarUrl(pm: PropertyManagerDTO): string | null {
  return pm.landlord?.profilePicture?.url ?? null;
}

const PropertyManagerDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id } = router.query;
  const idStr = typeof id === "string" ? id : null;

  const [tab, setTab] = React.useState<(typeof tabs)[number]>("properties");
  const [pm, setPm] = React.useState<PropertyManagerDTO | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!router.isReady || !idStr) return;

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      const result = await getPropertyManager(idStr);
      if (cancelled) return;
      setLoading(false);
      if (!result.success) {
        setError(result.error);
        setPm(null);
        return;
      }
      setPm(result.data);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, idStr]);

  const title = pm ? primaryDisplayName(pm) : "Property Manager Details";
  const photo = pm ? avatarUrl(pm) : null;
  const assignedLandlordsCount = pm?.landlord ? 1 : 0;

  return (
    <>
      <Head>
        <title>DWELLA NG · {title}</title>
      </Head>
      <AdminLayout title="L & P">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard/admin/lp"
              className="flex items-center gap-2 text-sm font-medium text-[#0F172A] hover:text-[#1E66FF]"
            >
              <ArrowLeft className="h-4 w-4" />
              Property Manager Details
            </Link>
            <button
              type="button"
              className="rounded-md bg-[#111827] px-5 py-1.5 text-xs text-white opacity-60"
              title="Messaging not wired yet"
            >
              Message
            </button>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
              {error}
            </p>
          ) : null}

          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[72px_1fr] lg:grid-cols-[72px_1fr_auto] lg:items-start">
              <div className="relative h-16 w-16 overflow-hidden rounded-md bg-[#E2E8F0]">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div>
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-[#64748B]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading profile…
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#64748B]">
                      Assigned landlord
                    </p>
                    <h2 className="text-3xl font-semibold">{title}</h2>
                    <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                        <span className="min-w-0 truncate">
                          {pm ? contactPhone(pm) : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-green-600" />
                        <span className="min-w-0 truncate">
                          {pm ? contactEmail(pm) : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                        <span className="text-[#64748B]">—</span>
                      </div>
                    </div>
                    {pm?.permissions && pm.permissions.length > 0 ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-[#64748B]" />
                        {pm.permissions.map((p) => (
                          <span
                            key={p}
                            className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[10px] font-medium text-[#334155]"
                          >
                            {p.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {pm ? (
                      <p className="mt-2 font-mono text-[10px] text-[#94A3B8]">
                        PM id · {pm.id}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs ${
                  pm?.isActive !== false
                    ? "bg-green-100 text-green-700"
                    : "bg-[#E5E7EB] text-[#374151]"
                }`}
              >
                {pm?.isActive !== false ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                <p className="text-4xl font-semibold text-[#0F172A]">—</p>
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
                <p className="text-4xl font-semibold text-[#0F172A]">—</p>
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
                <p className="text-4xl font-semibold text-[#0F172A]">—</p>
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
                <p className="text-4xl font-semibold text-[#0F172A]">
                  {loading ? "—" : assignedLandlordsCount}
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-[#64748B]">
              Counts for properties, units, and tenants are not included on this
              response — use list/query endpoints or nested expansions when the
              API adds them.
            </p>
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
            <div className="overflow-x-auto overflow-y-visible">
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
                  <tr className="border-t border-[#F1F5F9]">
                    <td className="py-8 text-center text-[#64748B]" colSpan={6}>
                      No records to display.
                    </td>
                  </tr>
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
