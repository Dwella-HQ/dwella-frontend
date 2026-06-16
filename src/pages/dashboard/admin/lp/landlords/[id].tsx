import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
} from "lucide-react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ADMIN_STAT_BG, ADMIN_STAT_LABEL } from "@/lib/adminDesignTokens";
import {
  getLandlord,
  getLandlordVerificationStatus,
  type LandlordVerificationStatus,
  type LandlordDTO,
} from "@/api/landlord";
import { queryVerifications, type VerificationDTO } from "@/api/verification";
import { getPropertiesByLandlord } from "@/api/properties";
import type { PropertyDTO } from "@/api/properties/properties.schema";
import { getRentPaymentItems } from "@/api/rent-payment";
import type { RentPaymentItemDTO } from "@/api/rent-payment/rentPayment.schema";
import { getTenantList } from "@/api/tenants";
import type { TenantRecordDTO } from "@/api/tenants/tenants.schema";
import { getUnitsByProperty } from "@/api/units";
import { getMaintenanceRequests } from "@/api/maintenance";
import type { MaintenanceRequestWithDetails } from "@/data/mockLandlordData";
import { buildLandlordMetricsMap } from "@/lib/admin/buildLandlordLpMetrics";
import {
  resolveTenantUnitLabel,
  tenantRecordReferencesPropertyInSet,
} from "@/lib/admin/tenantPropertyMatch";

const tabs = [
  "properties",
  "units",
  "tenants",
  "payments",
  "documents",
  "maintenance activity",
  "tenant interactions",
] as const;

function formatAddressLines(l: LandlordDTO): { line: string; country: string } {
  const a = l.address;
  if (!a) return { line: "—", country: "—" };
  const line = [a.address, a.street, a.city, a.state, a.postalCode]
    .filter(Boolean)
    .join(", ");
  return {
    line: line || "—",
    country: a.country || "—",
  };
}

function landlordDisplayName(l: LandlordDTO): string {
  const biz = l.businessName?.trim();
  if (biz) return biz;
  const ln = l.landLordName?.trim();
  if (ln) return ln;
  const u = l.user as { fullName?: string } | undefined;
  return u?.fullName?.trim() || l.user?.email || "Landlord";
}

function landlordPhone(l: LandlordDTO): string {
  return (
    l.user?.phoneNumber?.trim() ||
    l.businessPhoneNumber?.trim() ||
    "—"
  );
}

function landlordEmail(l: LandlordDTO): string {
  return l.businessEmail?.trim() || l.user?.email || "—";
}

function normalizeVerificationStatus(
  value: unknown,
): LandlordVerificationStatus | null {
  if (typeof value !== "string") return null;
  const status = value.trim().toUpperCase();
  if (status === "VERIFIED" || status === "PENDING" || status === "REJECTED") {
    return status;
  }
  return null;
}

function verificationTimestamp(v: VerificationDTO): number {
  const raw = v.updatedAt ?? v.createdAt ?? v.verifiedAt;
  if (!raw) return 0;
  const time = new Date(raw).getTime();
  return Number.isFinite(time) ? time : 0;
}

function latestVerificationStatus(
  verifications: VerificationDTO[],
): LandlordVerificationStatus | null {
  let latest: { status: LandlordVerificationStatus; timestamp: number } | null =
    null;

  for (const verification of verifications) {
    const status = normalizeVerificationStatus(verification.status);
    if (!status) continue;
    const timestamp = verificationTimestamp(verification);
    if (!latest || timestamp >= latest.timestamp) {
      latest = { status, timestamp };
    }
  }

  return latest?.status ?? null;
}

function landlordStatusLabel(
  l: LandlordDTO,
  verificationStatusOverride?: LandlordVerificationStatus | null,
): {
  label: string;
  className: string;
} {
  const verificationStatus =
    verificationStatusOverride ?? getLandlordVerificationStatus(l);
  if (verificationStatus === "PENDING") {
    return { label: "Pending", className: "bg-yellow-100 text-yellow-800" };
  }
  if (verificationStatus === "REJECTED") {
    return { label: "Rejected", className: "bg-red-100 text-red-700" };
  }
  if (l.isActive === false)
    return { label: "Suspended", className: "bg-red-100 text-red-700" };
  return { label: "Active", className: "bg-green-100 text-green-700" };
}

function formatNgn(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function propertyAddress(p: PropertyDTO): string {
  const a = p.address;
  if (!a) return "—";
  return [a.street, a.city, a.state, a.country].filter(Boolean).join(", ");
}

function paymentAmount(item: RentPaymentItemDTO): number {
  const raw = item.amount ?? item.paidAmount ?? item.paid_amount ?? item.total;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const n = Number.parseFloat(raw.replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function paymentDate(item: RentPaymentItemDTO): string {
  const d =
    item.paidAt ??
    item.paid_at ??
    item.paymentDate ??
    item.payment_date ??
    item.createdAt ??
    item.created_at;
  return formatDate(d);
}

function isUnitOccupied(unit: unknown): boolean {
  if (!unit || typeof unit !== "object") return false;
  const r = unit as { isAvailable?: boolean; tenant?: unknown };
  const hasTenant =
    r.tenant !== null && r.tenant !== undefined && typeof r.tenant === "object";
  return r.isAvailable === false || hasTenant;
}

function tenantRecordName(t: Record<string, unknown>): string {
  const u = t.user as { fullName?: string; email?: string } | undefined;
  const fullName =
    typeof t.fullName === "string" ? t.fullName.trim() : "";
  const name = typeof t.name === "string" ? t.name.trim() : "";
  return fullName || name || u?.fullName?.trim() || u?.email || "—";
}

function asTenantRecord(t: TenantRecordDTO): Record<string, unknown> {
  return t as unknown as Record<string, unknown>;
}

const LandlordDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const rawId = router.query.id;
  const landlordId = typeof rawId === "string" ? rawId : undefined;

  const [tab, setTab] = React.useState<(typeof tabs)[number]>("properties");
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [landlord, setLandlord] = React.useState<LandlordDTO | null>(null);
  const [verificationStatusOverride, setVerificationStatusOverride] =
    React.useState<LandlordVerificationStatus | null>(null);
  const [properties, setProperties] = React.useState<PropertyDTO[]>([]);
  const [unitsByProperty, setUnitsByProperty] = React.useState<
    Map<string, unknown[]>
  >(new Map());
  const [payments, setPayments] = React.useState<RentPaymentItemDTO[]>([]);
  const [tenantRows, setTenantRows] = React.useState<TenantRecordDTO[]>([]);
  const [maintenance, setMaintenance] =
    React.useState<MaintenanceRequestWithDetails[]>([]);

  React.useEffect(() => {
    if (!router.isReady || !landlordId) return;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setLoadError(null);

      const [
        landlordRes,
        propsRes,
        payRes,
        tenantRes,
        verificationRes,
      ] = await Promise.all([
        getLandlord(landlordId),
        getPropertiesByLandlord(landlordId),
        getRentPaymentItems({ limit: 3000 }),
        getTenantList({ limit: 500 }),
        queryVerifications({
          landlordId,
          type: "LANDLORD_VERIFICATION",
          limit: 100,
        }),
      ]);

      if (cancelled) return;

      if (!landlordRes.success) {
        setLandlord(null);
        setVerificationStatusOverride(null);
        setProperties([]);
        setLoadError(landlordRes.error);
        setLoading(false);
        return;
      }

      setLandlord(landlordRes.data);
      setVerificationStatusOverride(
        verificationRes.success
          ? latestVerificationStatus(verificationRes.data)
          : null,
      );
      setProperties(propsRes.success ? propsRes.data : []);
      setPayments(payRes.success ? payRes.data : []);
      setTenantRows(tenantRes.success ? tenantRes.data : []);

      const props = propsRes.success ? propsRes.data : [];
      const unitMap = new Map<string, unknown[]>();
      await Promise.all(
        props.map(async (p) => {
          if (Array.isArray(p.units) && p.units.length > 0) {
            unitMap.set(p.id, p.units);
            return;
          }
          const ur = await getUnitsByProperty(p.id);
          unitMap.set(p.id, ur.success ? ur.data : []);
        }),
      );
      if (!cancelled) setUnitsByProperty(unitMap);

      const pids = new Set(props.map((p) => p.id));
      let maintRes = await getMaintenanceRequests({
        landlordId,
        limit: 300,
      });
      if (!maintRes.success) {
        maintRes = await getMaintenanceRequests({
          limit: 500,
          useLegacyEndpoint: true,
        });
      }
      if (cancelled) return;
      if (maintRes.success) {
        const scoped = maintRes.data.filter(
          (m) => m.propertyId && pids.has(m.propertyId),
        );
        setMaintenance(scoped);
      } else {
        setMaintenance([]);
      }

      setLoading(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, landlordId]);

  const propertyIdSet = React.useMemo(
    () => new Set(properties.map((p) => p.id)),
    [properties],
  );

  const metrics = React.useMemo(() => {
    if (!landlordId) return null;
    const m = buildLandlordMetricsMap(properties, payments).get(landlordId);
    return m ?? {
      propertyCount: 0,
      unitCount: 0,
      monthlyRevenue: 0,
      totalRevenue: 0,
    };
  }, [landlordId, properties, payments]);

  const portfolioTenants = React.useMemo(() => {
    return tenantRows.filter((t) =>
      tenantRecordReferencesPropertyInSet(asTenantRecord(t), propertyIdSet),
    );
  }, [tenantRows, propertyIdSet]);

  const occupiedUnits = React.useMemo(() => {
    let n = 0;
    for (const units of unitsByProperty.values()) {
      for (const u of units) {
        if (isUnitOccupied(u)) n += 1;
      }
    }
    return n;
  }, [unitsByProperty]);

  const scopedPayments = React.useMemo(() => {
    return payments.filter((pay) => {
      const pid = pay.propertyId ?? pay.property_id;
      return pid && propertyIdSet.has(pid);
    });
  }, [payments, propertyIdSet]);

  const profilePicUrl =
    landlord?.profilePicture &&
    typeof landlord.profilePicture === "object" &&
    "url" in landlord.profilePicture
      ? (landlord.profilePicture as { url?: string }).url
      : undefined;

  const addressInfo = landlord ? formatAddressLines(landlord) : null;
  const status = landlord
    ? landlordStatusLabel(landlord, verificationStatusOverride)
    : null;

  if (!router.isReady || !landlordId) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Dwelliva · Landlord Details</title>
      </Head>
      <AdminLayout title="L & P">
        <section className="w-full min-w-0 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/dashboard/admin/lp"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#0F172A] hover:text-[#2563EB]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to L &amp; P
            </Link>
            <button
              type="button"
              className="rounded-md bg-[#111827] px-5 py-1.5 text-xs text-white"
              onClick={() =>
                void router.push(
                  `/dashboard/admin/messages?role=landlord&roleId=${encodeURIComponent(
                    landlordId,
                  )}`,
                )
              }
            >
              Message
            </button>
          </div>

          {loadError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {loadError}
            </p>
          ) : null}

          {loading ? (
            <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white p-8 text-sm text-[#64748B]">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading landlord…
            </div>
          ) : landlord ? (
            <>
              <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[72px_1fr] lg:grid-cols-[72px_1fr_auto] lg:items-start">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-[#E2E8F0]">
                    {profilePicUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- API host may be outside next/image allowlist
                      <img
                        src={profilePicUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300"
                        alt=""
                        width={72}
                        height={72}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold sm:text-2xl lg:text-3xl">
                      {landlordDisplayName(landlord)}
                    </h2>
                    <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                        {landlordPhone(landlord)}
                      </div>
                      <div className="flex min-w-0 items-center gap-2">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-green-600" />
                        <span className="truncate">{landlordEmail(landlord)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                        {addressInfo?.country}
                      </div>
                    </div>
                    <p className="mt-1 flex items-start gap-2 text-xs text-[#334155]">
                      <Send className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                      {addressInfo?.line}
                    </p>
                  </div>
                  {status ? (
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${status.className}`}
                    >
                      {status.label}
                    </span>
                  ) : null}
                </div>

                {metrics ? (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
                        {formatNgn(metrics.monthlyRevenue)}
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
                        {metrics.propertyCount}
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
                        {occupiedUnits}
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
                        {portfolioTenants.length}
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
                        {formatNgn(metrics.totalRevenue)}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
                <div className="mb-3 inline-flex flex-wrap gap-4 border-b border-[#E2E8F0]">
                  {tabs.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTab(t)}
                      className={`border-b-2 pb-2 text-xs capitalize ${
                        tab === t
                          ? "border-[#1E66FF] text-[#1E66FF]"
                          : "border-transparent text-[#64748B]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {tab === "documents" ? (
                  <div className="space-y-3">
                    {[
                      {
                        label: "Government ID",
                        doc:
                          landlord.govermentIdDocument ??
                          landlord.governmentIdDocument,
                      },
                      {
                        label: "Land survey",
                        doc: landlord.landSurveyDocument,
                      },
                      {
                        label: "Proof of ownership",
                        doc: landlord.proofOfOwnershipDocument,
                      },
                      {
                        label: "Tax identification",
                        doc: landlord.taxIdentificationNumberDocument,
                      },
                    ].map(({ label, doc }) => {
                      const url =
                        doc &&
                        typeof doc === "object" &&
                        doc !== null &&
                        "url" in doc &&
                        typeof (doc as { url?: unknown }).url === "string"
                          ? (doc as { url: string }).url
                          : null;
                      return (
                        <div
                          key={label}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#E2E8F0] p-3"
                        >
                          <p className="text-xs font-medium">{label}</p>
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[#0284C7] hover:underline"
                            >
                              View
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-[#94A3B8]">Not uploaded</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : tab === "properties" ? (
                  <div className="overflow-auto">
                    <table className="w-full min-w-[900px] text-xs">
                      <thead className="text-[#64748B]">
                        <tr>
                          <th className="py-2 text-left">S/N</th>
                          <th className="py-2 text-left">Name</th>
                          <th className="py-2 text-left">Type</th>
                          <th className="py-2 text-left">Address</th>
                          <th className="py-2 text-left">Created</th>
                          <th className="py-2 text-left">Status</th>
                          <th className="py-2 text-left">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {properties.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="py-6 text-center text-[#64748B]"
                            >
                              No properties for this landlord.
                            </td>
                          </tr>
                        ) : (
                          properties.map((p, i) => {
                            const approved = p.isApproved !== false;
                            const active = p.isActive !== false;
                            const statusText = !approved
                              ? "Pending approval"
                              : active
                                ? "Active"
                                : "Inactive";
                            const pill =
                              !approved
                                ? "bg-yellow-100 text-yellow-800"
                                : active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700";
                            return (
                              <tr key={p.id} className="border-t border-[#F1F5F9]">
                                <td className="py-2">{i + 1}</td>
                                <td className="py-2 font-medium">{p.name}</td>
                                <td className="py-2">
                                  {p.propertyType ?? "—"}
                                </td>
                                <td className="py-2">{propertyAddress(p)}</td>
                                <td className="py-2">{formatDate(p.createdAt)}</td>
                                <td className="py-2">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[11px] ${pill}`}
                                  >
                                    {statusText}
                                  </span>
                                </td>
                                <td className="py-2">
                                  <Link
                                    href={`/dashboard/admin/properties/${p.id}`}
                                    className="text-[#0284C7] hover:underline"
                                  >
                                    View
                                  </Link>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : tab === "units" ? (
                  <div className="overflow-auto">
                    <table className="w-full min-w-[1000px] text-xs">
                      <thead className="text-[#64748B]">
                        <tr>
                          <th className="py-2 text-left">S/N</th>
                          <th className="py-2 text-left">Unit</th>
                          <th className="py-2 text-left">Property</th>
                          <th className="py-2 text-left">Rent</th>
                          <th className="py-2 text-left">Beds / Baths</th>
                          <th className="py-2 text-left">Status</th>
                          <th className="py-2 text-left">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          let sn = 0;
                          const rows: React.ReactNode[] = [];
                          for (const p of properties) {
                            const units = unitsByProperty.get(p.id) ?? [];
                            for (const u of units) {
                              sn += 1;
                              const un = u as Record<string, unknown>;
                              const rent = un.rentAmount;
                              const rentLabel =
                                typeof rent === "number"
                                  ? formatNgn(rent)
                                  : typeof rent === "string"
                                    ? formatNgn(Number(rent) || 0)
                                    : "—";
                              const occ = isUnitOccupied(u);
                              rows.push(
                                <tr
                                  key={`${p.id}-${readUnitId(un)}`}
                                  className="border-t border-[#F1F5F9]"
                                >
                                  <td className="py-2">{sn}</td>
                                  <td className="py-2">
                                    {typeof un.name === "string" ? un.name : "—"}
                                  </td>
                                  <td className="py-2">{p.name}</td>
                                  <td className="py-2">{rentLabel}</td>
                                  <td className="py-2">
                                    {formatNumCell(un.numberOfBedrooms)} /{" "}
                                    {formatNumCell(un.numberOfBathrooms)}
                                  </td>
                                  <td className="py-2">
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                                        occ
                                          ? "bg-green-100 text-green-700"
                                          : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {occ ? "Occupied" : "Available"}
                                    </span>
                                  </td>
                                  <td className="py-2">
                                    <Link
                                      href={`/dashboard/admin/properties/${p.id}/units/${
                                        typeof un.id === "string"
                                          ? un.id
                                          : String(un.id ?? "")
                                      }`}
                                      className="text-[#0284C7] hover:underline"
                                    >
                                      View
                                    </Link>
                                  </td>
                                </tr>,
                              );
                            }
                          }
                          if (rows.length === 0) {
                            return (
                              <tr>
                                <td
                                  colSpan={7}
                                  className="py-6 text-center text-[#64748B]"
                                >
                                  No units loaded for these properties.
                                </td>
                              </tr>
                            );
                          }
                          return rows;
                        })()}
                      </tbody>
                    </table>
                  </div>
                ) : tab === "tenants" ? (
                  <div className="overflow-auto">
                    <table className="w-full min-w-[1000px] text-xs">
                      <thead className="text-[#64748B]">
                        <tr>
                          <th className="py-2 text-left">S/N</th>
                          <th className="py-2 text-left">Name</th>
                          <th className="py-2 text-left">Email</th>
                          <th className="py-2 text-left">Property / unit</th>
                          <th className="py-2 text-left">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolioTenants.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="py-6 text-center text-[#64748B]"
                            >
                              No tenants linked to this landlord&apos;s properties.
                            </td>
                          </tr>
                        ) : (
                          portfolioTenants.map((t, i) => {
                            const tr = asTenantRecord(t);
                            const pid = resolvePropertyIdForTenant(
                              tr,
                              propertyIdSet,
                            );
                            const units = (pid && unitsByProperty.get(pid)) ?? [];
                            const unitLabel = resolveTenantUnitLabel(
                              tr,
                              units as Record<string, unknown>[],
                            );
                            const propName =
                              (pid &&
                                properties.find((p) => p.id === pid)?.name) ??
                              "—";
                            const tid = String(tr.id ?? "");
                            return (
                              <tr key={tid} className="border-t border-[#F1F5F9]">
                                <td className="py-2">{i + 1}</td>
                                <td className="py-2">{tenantRecordName(tr)}</td>
                                <td className="py-2">
                                  {(tr.user as { email?: string })?.email ??
                                    "—"}
                                </td>
                                <td className="py-2">
                                  {propName} · {unitLabel}
                                </td>
                                <td className="py-2">
                                  <Link
                                    href={`/dashboard/admin/tenants/${tid}`}
                                    className="text-[#0284C7] hover:underline"
                                  >
                                    View
                                  </Link>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : tab === "payments" ? (
                  <div className="overflow-auto">
                    <table className="w-full min-w-[1000px] text-xs">
                      <thead className="text-[#64748B]">
                        <tr>
                          <th className="py-2 text-left">S/N</th>
                          <th className="py-2 text-left">Date</th>
                          <th className="py-2 text-left">Tenant</th>
                          <th className="py-2 text-left">Property</th>
                          <th className="py-2 text-left">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scopedPayments.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="py-6 text-center text-[#64748B]"
                            >
                              No rent payments with a property on record.
                            </td>
                          </tr>
                        ) : (
                          scopedPayments.map((pay, i) => {
                            const pid =
                              pay.propertyId ?? pay.property_id ?? "";
                            const p = properties.find((x) => x.id === pid);
                            return (
                              <tr key={String(pay.id)} className="border-t border-[#F1F5F9]">
                                <td className="py-2">{i + 1}</td>
                                <td className="py-2">{paymentDate(pay)}</td>
                                <td className="py-2">
                                  {pay.tenantName ??
                                    pay.tenant_name ??
                                    "—"}
                                </td>
                                <td className="py-2">
                                  { pay.propertyName ??
                                    pay.property_name ??
                                    p?.name ??
                                    "—"}
                                </td>
                                <td className="py-2">
                                  {formatNgn(paymentAmount(pay))}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : tab === "maintenance activity" ? (
                  <div className="overflow-auto">
                    <table className="w-full min-w-[1000px] text-xs">
                      <thead className="text-[#64748B]">
                        <tr>
                          <th className="py-2 text-left">S/N</th>
                          <th className="py-2 text-left">Type</th>
                          <th className="py-2 text-left">Property</th>
                          <th className="py-2 text-left">Unit</th>
                          <th className="py-2 text-left">Reported</th>
                          <th className="py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {maintenance.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="py-6 text-center text-[#64748B]"
                            >
                              No maintenance requests for this portfolio.
                            </td>
                          </tr>
                        ) : (
                          maintenance.map((m, i) => (
                            <tr key={m.id} className="border-t border-[#F1F5F9]">
                              <td className="py-2">{i + 1}</td>
                              <td className="py-2">
                                {m.type || m.subType || "—"}
                              </td>
                              <td className="py-2">{m.propertyName || "—"}</td>
                              <td className="py-2">{m.unit || "—"}</td>
                              <td className="py-2">
                                {formatDate(m.reportedTime)}
                              </td>
                              <td className="py-2">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[11px] ${
                                    m.status === "resolved"
                                      ? "bg-green-100 text-green-700"
                                      : m.status === "in_progress"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {m.status === "resolved"
                                    ? "Resolved"
                                    : m.status === "in_progress"
                                      ? "In progress"
                                      : "Open"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* tenant interactions — portfolio tenants + contact */
                  <div className="overflow-auto">
                    <table className="w-full min-w-[900px] text-xs">
                      <thead className="text-[#64748B]">
                        <tr>
                          <th className="py-2 text-left">S/N</th>
                          <th className="py-2 text-left">Tenant</th>
                          <th className="py-2 text-left">Contact</th>
                          <th className="py-2 text-left">Property</th>
                          <th className="py-2 text-left">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolioTenants.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="py-6 text-center text-[#64748B]"
                            >
                              No tenants to show.
                            </td>
                          </tr>
                        ) : (
                          portfolioTenants.map((t, i) => {
                            const tr = asTenantRecord(t);
                            const tid = String(tr.id ?? "");
                            const phone =
                              (tr.user as { phoneNumber?: string })?.phoneNumber ??
                              (tr as { phoneNumber?: string }).phoneNumber ??
                              "—";
                            const email =
                              (tr.user as { email?: string })?.email ?? "—";
                            const resolvedPid = resolvePropertyIdForTenant(
                              tr,
                              propertyIdSet,
                            );
                            const pname =
                              (resolvedPid &&
                                properties.find((p) => p.id === resolvedPid)
                                  ?.name) ??
                              "—";
                            return (
                              <tr key={tid} className="border-t border-[#F1F5F9]">
                                <td className="py-2">{i + 1}</td>
                                <td className="py-2">{tenantRecordName(tr)}</td>
                                <td className="py-2">
                                  <div className="flex flex-col gap-0.5">
                                    <span>{phone}</span>
                                    <span className="text-[#64748B]">{email}</span>
                                  </div>
                                </td>
                                <td className="py-2">{pname}</td>
                                <td className="py-2">
                                  <Link
                                    href={`/dashboard/admin/messages?role=tenant&roleId=${encodeURIComponent(
                                      tid,
                                    )}`}
                                    className="inline-flex items-center gap-1 text-[#0284C7] hover:underline"
                                  >
                                    <MessageSquare className="h-3 w-3" />
                                    Messages
                                  </Link>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </section>
      </AdminLayout>
    </>
  );
};

export default LandlordDetailPage;

function readUnitId(un: Record<string, unknown>): string {
  const id = un.id;
  return typeof id === "string" ? id : String(id ?? "");
}

function formatNumCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number" || typeof value === "string") return String(value);
  return "—";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function resolvePropertyIdForTenant(
  t: Record<string, unknown>,
  propertyIds: Set<string>,
): string | undefined {
  const ok = (v: unknown) =>
    v != null && propertyIds.has(String(v)) ? String(v) : undefined;

  let id = ok(t.propertyId);
  if (id) return id;

  const p = asRecord(t.property);
  if (p) {
    id = ok(p.id);
    if (id) return id;
  }

  const curP = asRecord(t.currentProperty);
  if (curP) {
    id = ok(curP.id);
    if (id) return id;
  }

  const cu = asRecord(t.currentUnit);
  if (cu) {
    id = ok(cu.propertyId);
    if (id) return id;
    const up = asRecord(cu.property);
    if (up) {
      id = ok(up.id);
      if (id) return id;
    }
  }

  const leases = t.leases;
  if (Array.isArray(leases)) {
    for (const raw of leases) {
      const lease = asRecord(raw);
      const unit = lease ? asRecord(lease.unit) : null;
      if (unit) {
        id = ok(unit.propertyId);
        if (id) return id;
        const up = asRecord(unit.property);
        if (up) {
          id = ok(up.id);
          if (id) return id;
        }
      }
    }
  }
  return undefined;
}
