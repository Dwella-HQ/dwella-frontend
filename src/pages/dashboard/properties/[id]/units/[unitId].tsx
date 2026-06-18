import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Download,
  Plus,
  MessageSquare,
  User,
  CheckCircle2,
  Phone,
  Mail,
  Pencil,
} from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useUser } from "@/contexts/UserContext";
import { AddTenantModal } from "@/components/AddTenantModal";
import { EditUnitModal } from "@/components/EditUnitModal";
import { NewMaintenanceRequestModal } from "@/components/NewMaintenanceRequestModal";
import { getUnit } from "@/api/units";
import { getProperty } from "@/api/properties";
import { mapUnitDTOToUnit } from "@/api/units/mapUnit";
import { mockPaymentHistory } from "@/data/mockPropertyDetails";
import { mockMaintenanceRequestDetails } from "@/data/mockPropertyDetails";
import type { Unit } from "@/data/mockLandlordData";

import type { NextPageWithLayout } from "@/pages/_app";
import { ADMIN_STAT_BG, ADMIN_STAT_LABEL } from "@/lib/adminDesignTokens";
import { formatDateTimeDisplay } from "@/utils/formatDate";

type NestedProperty = { id?: string; name?: string; isApproved?: boolean };

const messageTenantHref = (tenantId: string | number) =>
  `/dashboard/messages?tenantId=${encodeURIComponent(String(tenantId))}`;

const UnitDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { user } = useUser();
  const { id, unitId } = router.query;
  const [isAddTenantOpen, setIsAddTenantOpen] = React.useState(false);
  const [isEditUnitOpen, setIsEditUnitOpen] = React.useState(false);
  const [isNewRequestOpen, setIsNewRequestOpen] = React.useState(false);
  const [unit, setUnit] = React.useState<Unit | null>(null);
  const [propertyName, setPropertyName] = React.useState<string>("");
  const [propertyIsVerified, setPropertyIsVerified] = React.useState<
    boolean | null
  >(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (
      user?.role === "super_admin" &&
      id &&
      unitId &&
      typeof id === "string" &&
      typeof unitId === "string"
    ) {
      router.replace(`/dashboard/admin/properties/${id}/units/${unitId}`);
    }
  }, [id, router, unitId, user?.role]);

  const loadUnit = React.useCallback(
    async (quiet = false) => {
      if (!unitId || typeof unitId !== "string") return;
      if (!quiet) setIsLoading(true);
      setError(null);
      const result = await getUnit(unitId);
      if (result.success) {
        const data = result.data;
        const property = data.property as NestedProperty | undefined;
        const propertyId =
          property?.id ?? data.propertyId ?? (id as string) ?? "";
        setPropertyName(property?.name ?? "Property");
        if (typeof property?.isApproved === "boolean") {
          setPropertyIsVerified(property.isApproved);
        } else if (propertyId) {
          const propertyResult = await getProperty(propertyId);
          setPropertyIsVerified(
            propertyResult.success
              ? propertyResult.data.isApproved === true
              : false,
          );
        } else {
          setPropertyIsVerified(false);
        }
        setUnit(mapUnitDTOToUnit(data, propertyId));
      } else {
        setError(result.error);
      }
      if (!quiet) setIsLoading(false);
    },
    [unitId, id],
  );

  React.useEffect(() => {
    loadUnit();
  }, [loadUnit]);

  const editUnitInitial = React.useMemo(
    () =>
      unit
        ? {
            name: unit.unitId,
            rentAmount: unit.monthlyRent,
            numberOfBedrooms: unit.bedrooms,
            numberOfBathrooms: unit.bathrooms,
            isAvailable: unit.status === "vacant",
          }
        : null,
    [unit],
  );

  const tenant = React.useMemo(() => {
    if (!unit?.tenantId) return null;
    return {
      id: unit.tenantId,
      name: unit.tenantName || "Tenant",
      phone: unit.tenantPhone || "—",
      email: unit.tenantEmail || "—",
      leaseStart: "—",
      leaseEnd: unit.leaseEndDate || "—",
      nextPayment: unit.nextDueDate || "—",
      monthlyRent: unit.monthlyRent,
    };
  }, [unit]);

  const unitPayments = React.useMemo(() => {
    if (!unit) return [];
    return mockPaymentHistory.filter((p) => p.unitId === unit.unitId);
  }, [unit]);

  const unitMaintenance = React.useMemo(() => {
    if (!unit) return [];
    return mockMaintenanceRequestDetails.filter(
      (m) => m.unitId === unit.unitId,
    );
  }, [unit]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-main border-r-transparent" />
          <p className="mt-4 text-sm text-gray-600">Loading unit...</p>
        </div>
      </div>
    );
  }

  if (error || !unit) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-600">{error ?? "Unit not found"}</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-4 text-sm text-brand-main hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const propertyIdForLinks = unit.propertyId || (id as string);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Head>
        <title>Dwelliva · {unit.unitId}</title>
      </Head>

      <section className="space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link
            href="/dashboard/properties"
            className="hover:text-gray-900 transition"
          >
            Properties
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link
            href={`/dashboard/properties/${propertyIdForLinks}`}
            className="hover:text-gray-900 transition"
          >
            {propertyName}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900">Unit {unit.unitId}</span>
        </div>

        {/* Unit Header */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Unit Image */}
          <div className="lg:col-span-2">
            {/* Unit Image with Overlay */}
            <div className="relative h-[500px] w-full overflow-hidden rounded-lg bg-gray-200">
              <Image
                src={unit.image}
                alt={unit.unitId}
                fill
                className="object-cover"
              />
              <div className="absolute left-3 top-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold text-white ${
                    unit.status === "vacant" ? "bg-gray-500" : "bg-brand-green"
                  }`}
                >
                  {unit.status === "vacant" ? "Vacant" : "Occupied"}
                </span>
              </div>
              {/* Unit ID and Type Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <h1 className="text-2xl font-bold text-white">
                  Unit {unit.unitId}
                </h1>
                <p className="text-lg text-white/90">{unit.type}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Unit Information and Tenant */}
          <div className="space-y-6">
            {/* Unit Information */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                  <h2 className="mb-1 text-lg font-bold text-gray-900">
                    Unit Information
                  </h2>
                  <p className="text-sm text-gray-600">
                    Complete details and management.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditUnitOpen(true)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <Pencil className="h-4 w-4" />
                  Edit unit
                </button>
              </div>

              <div className="mb-6">
                <p className="text-xs text-gray-500 uppercase">MONTHLY RENT</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  ₦{unit.monthlyRent.toLocaleString()}
                </p>
              </div>

              {/* Unit Details Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div
                  className="rounded-lg p-4"
                  style={{ backgroundColor: ADMIN_STAT_BG.blue }}
                >
                  <p
                    className="text-xs font-medium uppercase"
                    style={{ color: ADMIN_STAT_LABEL.blue }}
                  >
                    Bedrooms
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {unit.bedrooms}
                  </p>
                </div>
                <div
                  className="rounded-lg p-4"
                  style={{ backgroundColor: ADMIN_STAT_BG.green }}
                >
                  <p
                    className="text-xs font-medium uppercase"
                    style={{ color: ADMIN_STAT_LABEL.green }}
                  >
                    Bathrooms
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {unit.bathrooms}
                  </p>
                </div>
                <div
                  className="rounded-lg p-4"
                  style={{ backgroundColor: ADMIN_STAT_BG.purple }}
                >
                  <p
                    className="text-xs font-medium uppercase"
                    style={{ color: ADMIN_STAT_LABEL.purple }}
                  >
                    Size
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {unit.size} sqft
                  </p>
                </div>
                <div
                  className="rounded-lg p-4"
                  style={{ backgroundColor: ADMIN_STAT_BG.orange }}
                >
                  <p
                    className="text-xs font-medium uppercase"
                    style={{ color: ADMIN_STAT_LABEL.orange }}
                  >
                    Floor
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {unit.floor}
                  </p>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-gray-700" />
                  <p className="text-xs font-semibold uppercase text-gray-700">
                    AMENITIES
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {unit.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Unit Tenant - Full Width */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Current Unit Tenant
          </h2>
          {tenant ? (
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8">
                {/* Left: Tenant Info */}
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-lg font-semibold text-white flex-shrink-0">
                    {getInitials(tenant.name)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {tenant.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span className="break-all">{tenant.phone}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="break-all">{tenant.email}</span>
                    </div>
                  </div>
                </div>
                {/* Right: Rent/Lease Info */}
                <div className="lg:ml-auto grid grid-cols-2 gap-6 lg:grid-cols-3 lg:gap-10">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      RENT/LEASE START
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {tenant.leaseStart}
                    </p>
                    <p className="mt-4 text-xs text-gray-500 uppercase">
                      NEXT PAYMENT
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {tenant.nextPayment}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      RENT/LEASE END
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {tenant.leaseEnd}
                    </p>
                    <p className="mt-4 text-xs text-gray-500 uppercase">
                      MONTHLY RENT
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {tenant.monthlyRent > 0
                        ? `₦${tenant.monthlyRent.toLocaleString()}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      STATUS
                    </p>
                    <p className="mt-1">
                      <span className="inline-flex rounded-full bg-brand-green px-3 py-1 text-xs font-medium text-white">
                        Occupied
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push(messageTenantHref(tenant.id))}
                  className="flex-1 rounded-lg bg-brand-main px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-main/90 flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Message Tenant
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/tenants/${tenant.id}`)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <User className="h-4 w-4" />
                  View Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                No Tenant Assigned
              </p>
              <p className="text-xs text-gray-600 mb-4">
                Click &apos;Add Tenant&apos; to assign a new tenant.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (propertyIsVerified) setIsAddTenantOpen(true);
                }}
                disabled={!propertyIsVerified}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  propertyIsVerified
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "cursor-not-allowed bg-gray-200 text-gray-500"
                }`}
              >
                <Plus className="h-4 w-4" />
                {propertyIsVerified ? "Add Tenant" : "Verify property first"}
              </button>
              {propertyIsVerified === false && (
                <p className="mt-3 text-xs text-amber-700">
                  Tenants can only be assigned after this property is verified.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Payment and Maintenance History - Below Current Unit Tenant */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Unit Payment History */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Unit Payment History
              </h2>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
            <div className="space-y-3">
              {unitPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                  <CheckCircle2 className="h-5 w-5 text-brand-green flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Rent Payment - {payment.date} • {payment.method}
                    </p>
                    <p className="text-sm text-brand-green font-semibold">
                      ₦{payment.amount.toLocaleString()} Completed
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unit Maintenance History */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Unit Maintenance History
              </h2>
              <button
                type="button"
                onClick={() => setIsNewRequestOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
                New Request
              </button>
            </div>
            {unitMaintenance.length > 0 ? (
              <div className="space-y-4">
                {unitMaintenance.map((maintenance) => (
                  <div
                    key={maintenance.id}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="inline-flex rounded-full bg-blue-500 px-3 py-1 text-xs font-medium text-white">
                        {maintenance.priority.charAt(0).toUpperCase() +
                          maintenance.priority.slice(1)}
                      </span>
                      <span className="inline-flex rounded-full bg-brand-green px-3 py-1 text-xs font-medium text-white">
                        Resolved
                      </span>
                    </div>
                    <p className="mb-2 text-sm font-medium text-gray-900">
                      {maintenance.subType}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>
                        Reported:{" "}
                        {formatDateTimeDisplay(maintenance.reportedDate)}
                      </span>
                      {maintenance.resolvedDate && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-brand-green" />
                          Resolved:{" "}
                          {formatDateTimeDisplay(maintenance.resolvedDate)}
                        </span>
                      )}
                    </div>
                    {maintenance.team && (
                      <p className="mt-2 text-xs text-gray-500">
                        {maintenance.team}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-gray-500">
                No maintenance requests yet
              </div>
            )}
          </div>
        </div>
      </section>

      {editUnitInitial && (
        <EditUnitModal
          isOpen={isEditUnitOpen}
          onClose={() => setIsEditUnitOpen(false)}
          unitApiId={unit.id}
          initial={editUnitInitial}
          onSuccess={() => loadUnit(true)}
        />
      )}
      <AddTenantModal
        isOpen={isAddTenantOpen}
        onClose={() => setIsAddTenantOpen(false)}
        propertyId={propertyIdForLinks}
        propertyIsVerified={propertyIsVerified === true}
        unitId={unit.id}
        unitLabel={`${unit.unitId} • ${unit.type}`}
        onSuccess={() => loadUnit(true)}
      />
      <NewMaintenanceRequestModal
        isOpen={isNewRequestOpen}
        onClose={() => setIsNewRequestOpen(false)}
        propertyId={propertyIdForLinks}
      />
    </>
  );
};

UnitDetailPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default UnitDetailPage;
