import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  DollarSign,
  Mail,
  MessageSquare,
  Phone,
} from "lucide-react";

import { getMaintenanceRequests } from "@/api/maintenance";
import type { RentPaymentItemDTO } from "@/api/rent-payment/rentPayment.schema";
import { getRentPaymentItems } from "@/api/rent-payment";
import { getTenant, type TenantRecordDTO } from "@/api/tenants";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ADMIN_STAT_BG, ADMIN_STAT_LABEL } from "@/lib/adminDesignTokens";
import type { MaintenanceRequestWithDetails } from "@/data/mockLandlordData";

export type AdminTenantProfileProps = {
  tenantId?: string;
  /** Shown in the shell header */
  layoutTitle: string;
  /** Primary back navigation (tenant list vs property detail) */
  backHref: string;
  backLabel: string;
};

type LeaseLike = Record<string, unknown>;
type UnitLike = Record<string, unknown>;
type UserLike = Record<string, unknown>;

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function stringValue(value: unknown): string {
  return typeof value === "string" && value.trim() ? value : "";
}

function numberValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatCurrency(value: unknown): string {
  const amount = numberValue(value);
  return amount > 0 ? `NGN ${amount.toLocaleString()}` : "Not available";
}

function formatDate(value: unknown): string {
  const raw = stringValue(value);
  if (!raw) return "Not available";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en", {
    month: "short",
    year: "numeric",
  });
}

function formatFullDate(value: unknown): string {
  const raw = stringValue(value);
  if (!raw) return "Not available";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getNestedName(value: unknown): string {
  const obj = objectValue(value);
  if (!obj) return stringValue(value);
  return (
    stringValue(obj.fullName) ||
    stringValue(obj.name) ||
    stringValue(obj.email) ||
    ""
  );
}

function getActiveLease(tenant: TenantRecordDTO): LeaseLike | null {
  const rawLeases = (tenant as { leases?: unknown }).leases;
  const leases = Array.isArray(rawLeases) ? (rawLeases as LeaseLike[]) : [];
  return (
    leases.find((lease) => lease.isActive === true) ||
    leases[0] ||
    null
  );
}

function getTenantUser(tenant: TenantRecordDTO): UserLike {
  return objectValue((tenant as { user?: unknown }).user) || {};
}

function getTenantUnit(
  tenant: TenantRecordDTO,
  activeLease: LeaseLike | null,
): UnitLike {
  return (
    objectValue((tenant as { currentUnit?: unknown }).currentUnit) ||
    objectValue(activeLease?.unit) ||
    {}
  );
}

function getUnitImage(unit: UnitLike): string {
  const images = Array.isArray(unit.images) ? unit.images : [];
  const first = objectValue(images[0]);
  return stringValue(first?.url);
}

function getAmenities(unit: UnitLike): string[] {
  const amenities = Array.isArray(unit.amenities) ? unit.amenities : [];
  return amenities
    .map((item) => (typeof item === "string" ? item : getNestedName(item)))
    .filter(Boolean);
}

function getPaymentTenantId(payment: RentPaymentItemDTO): string {
  return (
    payment.tenantId ||
    payment.tenant_id ||
    stringValue(objectValue(payment.tenant)?.id) ||
    ""
  );
}

function getPaymentTenantName(payment: RentPaymentItemDTO): string {
  return (
    payment.tenantName ||
    payment.tenant_name ||
    getNestedName(payment.tenant) ||
    ""
  );
}

function getPaymentAmount(payment: RentPaymentItemDTO): number {
  return (
    numberValue(payment.paidAmount) ||
    numberValue(payment.paid_amount) ||
    numberValue(payment.total) ||
    numberValue(payment.amount)
  );
}

function getPaymentDate(payment: RentPaymentItemDTO): string {
  return formatFullDate(
    payment.paidAt ||
      payment.paid_at ||
      payment.paymentDate ||
      payment.payment_date ||
      payment.createdAt ||
      payment.created_at,
  );
}

function getPaymentStatus(payment: RentPaymentItemDTO): string {
  const status = stringValue((payment as { status?: unknown }).status);
  return status || "Completed";
}

function getNextOfKin(tenant: TenantRecordDTO): Record<string, unknown> {
  return objectValue((tenant as { nextOfKinDetails?: unknown }).nextOfKinDetails) || {};
}

/** Shared admin tenant profile UI - used from `/admin/tenants/[id]` and nested property routes. */
export function AdminTenantProfile({
  tenantId,
  layoutTitle,
  backHref,
  backLabel,
}: AdminTenantProfileProps) {
  const [tab, setTab] = React.useState<
    "overview" | "payments" | "maintenance" | "communications"
  >("overview");
  const [tenant, setTenant] = React.useState<TenantRecordDTO | null>(null);
  const [payments, setPayments] = React.useState<RentPaymentItemDTO[]>([]);
  const [maintenance, setMaintenance] = React.useState<
    MaintenanceRequestWithDetails[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!tenantId) return;

    let cancelled = false;

    async function loadTenantProfile() {
      setLoading(true);
      setError(null);
      try {
        if (!tenantId) return;
        const tenantResult = await getTenant(tenantId);
        if (!tenantResult.success) {
          throw new Error(tenantResult.error);
        }

        const user = getTenantUser(tenantResult.data);
        const tenantName =
          stringValue(user.fullName) ||
          stringValue((tenantResult.data as { fullName?: unknown }).fullName) ||
          stringValue((tenantResult.data as { email?: unknown }).email);

        const [paymentsResult, maintenanceResult] = await Promise.all([
          getRentPaymentItems({ limit: 500 }),
          getMaintenanceRequests({ tenantId, limit: 500 }),
        ]);

        if (cancelled) return;

        const matchingPayments = paymentsResult.success
          ? paymentsResult.data.filter((payment) => {
              const paymentTenantId = getPaymentTenantId(payment);
              const paymentTenantName = getPaymentTenantName(payment);
              return (
                paymentTenantId === tenantId ||
                (!!tenantName &&
                  paymentTenantName.toLowerCase() === tenantName.toLowerCase())
              );
            })
          : [];

        setTenant(tenantResult.data);
        setPayments(matchingPayments);
        setMaintenance(maintenanceResult.success ? maintenanceResult.data : []);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load tenant profile",
          );
          setTenant(null);
          setPayments([]);
          setMaintenance([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTenantProfile();

    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const tabLabels: Record<typeof tab, string> = {
    overview: "Overview",
    payments: "Payments",
    maintenance: "Maintenance",
    communications: "Communications",
  };

  const activeLease = tenant ? getActiveLease(tenant) : null;
  const tenantUser = tenant ? getTenantUser(tenant) : {};
  const unit = tenant ? getTenantUnit(tenant, activeLease) : {};
  const nextOfKin = tenant ? getNextOfKin(tenant) : {};
  const tenantName =
    stringValue(tenantUser.fullName) ||
    stringValue((tenant as { fullName?: unknown } | null)?.fullName) ||
    stringValue((tenant as { email?: unknown } | null)?.email) ||
    "Tenant";
  const email =
    stringValue(tenantUser.email) ||
    stringValue((tenant as { email?: unknown } | null)?.email) ||
    "Not available";
  const phone =
    stringValue(tenantUser.phoneNumber) ||
    stringValue((tenant as { phoneNumber?: unknown } | null)?.phoneNumber) ||
    "Not available";
  const unitName = stringValue(unit.name) || "No unit assigned";
  const rentAmount =
    activeLease?.rentAmount ?? unit.rentAmount ?? (tenant as { rentAmount?: unknown } | null)?.rentAmount;
  const leaseStart = activeLease?.startDate ?? (tenant as { leaseStartDate?: unknown } | null)?.leaseStartDate;
  const leaseEnd = activeLease?.endDate ?? (tenant as { leaseEndDate?: unknown } | null)?.leaseEndDate;
  const totalPaid = payments.reduce((sum, payment) => sum + getPaymentAmount(payment), 0);
  const paymentStatus = payments.length > 0 ? "Paid" : "No payments";
  const unitImage = getUnitImage(unit);
  const amenities = getAmenities(unit);

  return (
    <>
      <Head>
        <title>Dwelliva - Tenant Profile</title>
      </Head>
      <AdminLayout title={layoutTitle}>
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#0F172A]"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>
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

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#E0F2FE] text-xl font-bold text-[#0369A1]">
                  {tenantName
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "T"}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#0F172A]">
                    {loading ? "Loading tenant..." : tenantName}
                  </h2>
                  <p className="mt-1 text-sm text-[#64748B]">
                    Tenant - {unitName}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  payments.length > 0
                    ? "bg-[#DCFCE7] text-[#166534]"
                    : "bg-[#F1F5F9] text-[#475569]"
                }`}
              >
                {paymentStatus}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 text-sm text-[#334155] sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-[#2563EB]" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">
                    Phone
                  </p>
                  <p className="font-medium">{phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-[#16A34A]" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">
                    Email
                  </p>
                  <p className="font-medium">{email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#7C3AED]" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#94A3B8]">
                    Unit
                  </p>
                  <p className="font-medium">{unitName}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard color="blue" label="Monthly rent" value={formatCurrency(rentAmount)} />
              <StatCard color="green" label="Move-in date" value={formatDate(leaseStart)} />
              <StatCard color="purple" label="Rent/Lease ends" value={formatDate(leaseEnd)} />
              <StatCard color="orange" label="Total paid" value={formatCurrency(totalPaid)} />
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
              <div className="relative h-[220px] overflow-hidden rounded-xl bg-[#E2E8F0] lg:h-[260px]">
                {unitImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={unitImage}
                    alt={unitName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-medium text-[#64748B]">
                    No unit image
                  </div>
                )}
                <div className="absolute left-3 top-3 rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[10px] font-medium text-[#166534]">
                  {unit.isAvailable === true ? "Available" : "Occupied"}
                </div>
                <div className="absolute bottom-3 left-3 text-white drop-shadow-md">
                  <p className="text-2xl font-semibold">{unitName}</p>
                  <p className="text-sm">
                    {numberValue(unit.numberOfBedrooms) || "No"}BR Apt
                  </p>
                </div>
              </div>
              <div>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-[#0F172A] lg:text-2xl">
                      Unit Information
                    </h3>
                    <p className="mt-1 text-xs text-[#64748B]">
                      Details from the tenant record and assigned unit.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatCard color="blue" label="Bedrooms" value={String(numberValue(unit.numberOfBedrooms) || "N/A")} compact />
                  <StatCard color="green" label="Bathrooms" value={String(numberValue(unit.numberOfBathrooms) || "N/A")} compact />
                  <StatCard color="purple" label="Rent amount" value={formatCurrency(unit.rentAmount)} compact />
                  <StatCard color="orange" label="Status" value={unit.isAvailable === true ? "Available" : "Occupied"} compact />
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#64748B]" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                      Amenities
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(amenities.length ? amenities : ["No amenities listed"]).map(
                      (amenity) => (
                        <span
                          key={amenity}
                          className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-xs text-[#64748B]"
                        >
                          {amenity}
                        </span>
                      ),
                    )}
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
              ).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={`relative border-b-2 pb-3 text-sm font-medium transition ${
                    tab === item
                      ? "border-[#2563EB] text-[#2563EB]"
                      : "border-transparent text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  {tabLabels[item]}
                </button>
              ))}
            </div>

            {tab === "overview" ? (
              <div className="space-y-6">
                <div>
                  <p className="mb-4 text-base font-semibold text-[#0F172A]">
                    Rent/Lease Information
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoTile icon={Calendar} label="Rent/Lease start" value={formatDate(leaseStart)} />
                    <InfoTile icon={Calendar} label="Rent/Lease end" value={formatDate(leaseEnd)} />
                    <InfoTile icon={DollarSign} label="Monthly rent" value={formatCurrency(rentAmount)} />
                    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                        Payment status
                      </p>
                      <div className="mt-2">
                        <span className="inline-flex rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-xs font-medium text-[#166534]">
                          {paymentStatus}
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
                      {stringValue(nextOfKin.fullName) || "Not available"}
                      {stringValue(nextOfKin.relationship)
                        ? ` (${stringValue(nextOfKin.relationship)})`
                        : ""}
                    </p>
                    <div className="mt-3 flex flex-col gap-2 text-sm text-[#334155]">
                      <p className="inline-flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#94A3B8]" />
                        {stringValue(nextOfKin.contactNumber) || "Not available"}
                      </p>
                      <p className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[#94A3B8]" />
                        {stringValue(nextOfKin.email) || "Not available"}
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
                {payments.length === 0 ? (
                  <EmptyTab text="No payments found for this tenant." />
                ) : (
                  payments.slice(0, 20).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-xl border border-[#E2E8F0] p-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#0F172A]">
                          {stringValue((payment as { paymentMethod?: unknown }).paymentMethod) ||
                            stringValue((payment as { narration?: unknown }).narration) ||
                            "Rent payment"}
                        </p>
                        <p className="mt-1 text-xs text-[#64748B]">
                          {getPaymentDate(payment)} - {payment.id}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#0F172A]">
                          {formatCurrency(getPaymentAmount(payment))}
                        </p>
                        <span className="mt-1 inline-flex rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-medium text-[#166534]">
                          {getPaymentStatus(payment)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : null}

            {tab === "maintenance" ? (
              <div className="space-y-3">
                <p className="text-base font-semibold text-[#0F172A]">
                  Maintenance Requests
                </p>
                {maintenance.length === 0 ? (
                  <EmptyTab text="No maintenance requests found for this tenant." />
                ) : (
                  maintenance.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-[#E2E8F0] p-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#0F172A]">
                          {item.title || item.type || "Maintenance request"}
                        </p>
                        <p className="mt-1 text-xs text-[#64748B]">
                          Reported: {formatFullDate(item.reportedTime)} -{" "}
                          {item.description || item.subType || "No description"}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#DBEAFE] px-2.5 py-0.5 text-[10px] font-medium text-[#1D4ED8]">
                        {item.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            ) : null}

            {tab === "communications" ? (
              <div className="space-y-3">
                <p className="text-base font-semibold text-[#0F172A]">
                  Communication History
                </p>
                <EmptyTab text="Communication history is not available for this tenant profile yet." />
              </div>
            ) : null}
          </div>
        </section>
      </AdminLayout>
    </>
  );
}

function StatCard({
  color,
  label,
  value,
  compact = false,
}: {
  color: "blue" | "green" | "purple" | "orange";
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-xl ${compact ? "p-3" : "p-4"}`}
      style={{ backgroundColor: ADMIN_STAT_BG[color] }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: ADMIN_STAT_LABEL[color] }}
      >
        {label}
      </p>
      <p
        className={`mt-2 font-bold text-[#0F172A] ${
          compact ? "text-xl lg:text-2xl" : "text-2xl lg:text-3xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#64748B]" />
        <p className="text-sm font-semibold text-[#0F172A]">{value}</p>
      </div>
    </div>
  );
}

function EmptyTab({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-4 text-sm text-[#64748B]">
      {text}
    </div>
  );
}
