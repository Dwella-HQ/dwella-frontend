import Head from "next/head";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, Download, Mail, Phone } from "lucide-react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ADMIN_STAT_BG, ADMIN_STAT_LABEL } from "@/lib/adminDesignTokens";
import { getUnit, type UnitDTO } from "@/api/units";
import { getProperty, type PropertyDTO } from "@/api/properties";
import { getTenantList } from "@/api/tenants";
import { getRentPayments } from "@/api/rent-payment";
import { getMaintenanceRequests } from "@/api/maintenance";
import type {
  MaintenanceRequestWithDetails,
  Payment,
} from "@/data/mockLandlordData";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function unitImage(unit: UnitDTO | null, property: PropertyDTO | null): string {
  const fromPropertyPhotos = property?.photos?.[0]?.url;
  if (fromPropertyPhotos) return fromPropertyPhotos;
  const nestedProperty = asRecord(unit?.property);
  const photos = nestedProperty?.photos;
  if (Array.isArray(photos)) {
    const first = asRecord(photos[0]);
    if (first?.url && typeof first.url === "string") return first.url;
  }
  return "https://images.unsplash.com/photo-1616594039964-3f4a8ac8c30f?w=1000";
}

const AdminUnitDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id, unitId } = router.query;
  const propertyId = typeof id === "string" ? id : null;
  const unitIdStr = typeof unitId === "string" ? unitId : null;

  const [unit, setUnit] = React.useState<UnitDTO | null>(null);
  const [property, setProperty] = React.useState<PropertyDTO | null>(null);
  const [tenant, setTenant] = React.useState<Record<string, unknown> | null>(
    null,
  );
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [maintenance, setMaintenance] = React.useState<
    MaintenanceRequestWithDetails[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!router.isReady || !unitIdStr) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);

      const [
        unitResult,
        propertyResult,
        tenantsResult,
        paymentsResult,
        maintenanceResult,
      ] = await Promise.all([
        getUnit(unitIdStr),
        propertyId
          ? getProperty(propertyId)
          : Promise.resolve({ success: false as const, error: "" }),
        getTenantList({ limit: 200 }),
        getRentPayments({ limit: 200 }),
        getMaintenanceRequests({ limit: 200, useLegacyEndpoint: true }),
      ]);

      if (cancelled) return;

      if (!unitResult.success) {
        setError(unitResult.error || "Unable to load unit details");
        setLoading(false);
        return;
      }

      setUnit(unitResult.data);
      if (propertyResult.success) setProperty(propertyResult.data);
      setPayments(paymentsResult.success ? paymentsResult.data : []);
      setMaintenance(maintenanceResult.success ? maintenanceResult.data : []);

      if (tenantsResult.success) {
        const match = tenantsResult.data.find((t) => {
          const currentUnit = asRecord(
            (t as Record<string, unknown>).currentUnit,
          );
          const leases = (t as Record<string, unknown>).leases;
          if (currentUnit) {
            return (
              str(currentUnit.id) === unitResult.data.id ||
              str(currentUnit.name) === unitResult.data.name
            );
          }
          if (Array.isArray(leases)) {
            return leases.some((leaseRaw) => {
              const lease = asRecord(leaseRaw);
              if (!lease) return false;
              const lu = asRecord(lease.unit);
              return (
                str(lu?.id) === unitResult.data.id ||
                str(lu?.name) === unitResult.data.name
              );
            });
          }
          return false;
        });
        setTenant(match ? (match as Record<string, unknown>) : null);
      } else {
        setTenant(null);
      }

      setLoading(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, unitIdStr, propertyId]);

  const imageUrl = unitImage(unit, property);
  const occupied = unit ? !unit.isAvailable : false;
  const propertyName = property?.name || "Property";
  const filteredPayments = React.useMemo(() => {
    if (!unit) return [];
    const unitName = unit.name.trim().toLowerCase();
    return payments
      .filter((p) => p.unit.trim().toLowerCase() === unitName)
      .slice(0, 10);
  }, [payments, unit]);
  const filteredMaintenance = React.useMemo(() => {
    if (!unit) return [];
    const unitName = unit.name.trim().toLowerCase();
    return maintenance
      .filter((m) => m.unit.trim().toLowerCase() === unitName)
      .slice(0, 10);
  }, [maintenance, unit]);

  if (loading) {
    return (
      <AdminLayout title="Property Details">
        <div className="py-12 text-center text-sm text-[#64748B]">
          Loading unit details...
        </div>
      </AdminLayout>
    );
  }

  if (error || !unit) {
    return (
      <AdminLayout title="Property Details">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Unit not found."}
        </div>
      </AdminLayout>
    );
  }

  const tenantName =
    str(tenant?.fullName) ||
    str(tenant?.name) ||
    str(asRecord(tenant?.user)?.fullName) ||
    "—";
  const tenantEmail =
    str(tenant?.email) || str(asRecord(tenant?.user)?.email) || "—";
  const tenantPhone =
    str(tenant?.phoneNumber) ||
    str(tenant?.phone) ||
    str(asRecord(tenant?.user)?.phoneNumber) ||
    "—";

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
              onClick={() =>
                router.push(`/dashboard/admin/properties/${propertyId ?? "1"}`)
              }
              className="inline-flex items-center gap-2 text-sm text-[#334155]"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
            <div className="grid grid-cols-[1fr_1.2fr] gap-4">
              <div className="relative h-[220px] overflow-hidden rounded-lg">
                <span
                  className={`absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    occupied
                      ? "bg-[#DCFCE7] text-[#16A34A]"
                      : "bg-[#E2E8F0] text-[#334155]"
                  }`}
                >
                  {occupied ? "Occupied" : "Available"}
                </span>
                <div className="absolute bottom-3 left-3 z-10 text-white">
                  <p className="text-2xl font-semibold">{unit.name}</p>
                  <p className="text-xs">{unit.numberOfBedrooms}BR Apt</p>
                </div>
                <Image
                  src={imageUrl}
                  alt="Unit"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-2xl font-semibold">Unit Information</p>
                <p className="text-xs text-[#64748B]">{propertyName}</p>
                <p className="mt-2 text-right text-3xl font-semibold">
                  {formatMoney(unit.rentAmount)}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
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
                    <p className="text-2xl font-semibold text-[#0F172A]">
                      {unit.numberOfBedrooms}
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
                      Bathrooms
                    </p>
                    <p className="text-2xl font-semibold text-[#0F172A]">
                      {unit.numberOfBathrooms}
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
                      Size
                    </p>
                    <p className="text-2xl font-semibold text-[#0F172A]">—</p>
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
                    <p className="text-2xl font-semibold text-[#0F172A]">—</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase text-[#64748B]">
                    Amenities
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(unit.amenities?.length
                      ? unit.amenities
                      : ["No amenities"]
                    ).map((item) => (
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
            {!tenant ? (
              <div className="py-10 text-center text-[#94A3B8]">
                No Tenant Assigned
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-[1fr_auto] items-start gap-6">
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DBEAFE] font-semibold text-[#1D4ED8]">
                      {(tenantName[0] || "T").toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{tenantName}</p>
                      <p className="inline-flex items-center gap-1 text-xs text-[#64748B]">
                        <Phone className="h-3 w-3" /> {tenantPhone}
                      </p>
                      <p className="inline-flex items-center gap-1 text-xs text-[#64748B]">
                        <Mail className="h-3 w-3" /> {tenantEmail}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-md bg-[#111827] px-4 py-1.5 text-xs text-white">
                      Message
                    </button>
                    {str(tenant.id) ? (
                      <Link
                        href={`/dashboard/admin/properties/${propertyId ?? "1"}/tenants/${str(tenant.id)}`}
                        className="rounded-md border border-[#CBD5E1] px-4 py-1.5 text-xs text-[#0F172A]"
                      >
                        View Profile
                      </Link>
                    ) : null}
                  </div>
                </div>
                <div className="text-xs">
                  <p className="text-[#64748B]">STATUS</p>
                  <span
                    className={`rounded-full px-2 py-0.5 ${occupied ? "bg-green-100 text-green-700" : "bg-[#E2E8F0] text-[#334155]"}`}
                  >
                    {occupied ? "Occupied" : "Available"}
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
              {filteredPayments.length ? (
                filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-md border border-[#E2E8F0] px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">Rent Payment</p>
                      <p className="text-xs text-[#94A3B8]">
                        {payment.dueDate} • {payment.tenantName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold">
                        {formatMoney(payment.amount)}
                      </p>
                      <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] text-[#16A34A]">
                        {payment.paymentReceived ? "Received" : "Scheduled"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-[#E2E8F0] px-3 py-4 text-center text-sm text-[#94A3B8]">
                  No payment history for this unit yet.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
            <p className="mb-3 text-xl font-semibold">
              Unit Maintenance History
            </p>
            <div className="space-y-2">
              {filteredMaintenance.length ? (
                filteredMaintenance.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-md border border-[#E2E8F0] px-3 py-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[10px] text-[#2563EB]">
                          {m.priority}
                        </span>
                        <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] text-[#16A34A]">
                          {m.status}
                        </span>
                      </div>
                      <span className="text-xs text-[#94A3B8]">
                        {m.reportedTime}
                      </span>
                    </div>
                    <p className="text-sm font-medium">
                      {m.type} - {m.subType}
                    </p>
                    <p className="mt-2 text-xs text-[#64748B]">
                      {m.description || "No description"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-[#E2E8F0] px-3 py-4 text-center text-sm text-[#94A3B8]">
                  No maintenance history for this unit yet.
                </p>
              )}
            </div>
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default AdminUnitDetailPage;
