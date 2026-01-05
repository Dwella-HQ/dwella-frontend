import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Download,
  Plus,
  UserPlus,
  MessageSquare,
  User,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

import { DashboardLayout } from "@/components/DashboardLayout";
import { AddTenantModal } from "@/components/AddTenantModal";
import { NewMaintenanceRequestModal } from "@/components/NewMaintenanceRequestModal";
import { mockUnits } from "@/data/mockPropertyDetails";
import { mockTenants } from "@/data/mockPropertyDetails";
import { mockPaymentHistory } from "@/data/mockPropertyDetails";
import { mockMaintenanceRequestDetails } from "@/data/mockPropertyDetails";
import type { Unit, Tenant } from "@/data/mockLandlordData";

import type { NextPageWithLayout } from "@/pages/_app";

const UnitDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id, unitId } = router.query;
  const [isAddTenantOpen, setIsAddTenantOpen] = React.useState(false);
  const [isNewRequestOpen, setIsNewRequestOpen] = React.useState(false);

  const unit = React.useMemo(() => {
    return mockUnits.find((u) => u.unitId === unitId && u.propertyId === id);
  }, [id, unitId]);

  const tenant = React.useMemo(() => {
    if (!unit?.tenantId) return null;
    return mockTenants.find((t) => t.id === unit.tenantId);
  }, [unit]);

  const unitPayments = React.useMemo(() => {
    if (!unit) return [];
    return mockPaymentHistory.filter((p) => p.unitId === unit.unitId);
  }, [unit]);

  const unitMaintenance = React.useMemo(() => {
    if (!unit) return [];
    return mockMaintenanceRequestDetails.filter(
      (m) => m.unitId === unit.unitId
    );
  }, [unit]);

  if (!unit) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Unit not found</p>
      </div>
    );
  }

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
        <title>DWELLA NG · {unit.unitId}</title>
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
            href={`/dashboard/properties/${id}`}
            className="hover:text-gray-900 transition"
          >
            Harmony Court - 3BR Duplex
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
                <span className="inline-flex rounded-full bg-brand-green px-3 py-1 text-xs font-bold text-white">
                  Occupied
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
              <h2 className="mb-1 text-lg font-bold text-gray-900">
                Unit Information
              </h2>
              <p className="mb-6 text-sm text-gray-600">
                Complete details and management.
              </p>

              <div className="mb-6">
                <p className="text-xs text-gray-500 uppercase">MONTHLY RENT</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  ₦{unit.monthlyRent.toLocaleString()}
                </p>
              </div>

              {/* Unit Details Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-xs text-gray-500 uppercase">BEDROOMS</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {unit.bedrooms}
                  </p>
                </div>
                <div className="rounded-lg bg-green-50 p-4">
                  <p className="text-xs text-gray-500 uppercase">BATHROOMS</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {unit.bathrooms}
                  </p>
                </div>
                <div className="rounded-lg bg-purple-50 p-4">
                  <p className="text-xs text-gray-500 uppercase">SIZE</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {unit.size} sqft
                  </p>
                </div>
                <div className="rounded-lg bg-orange-50 p-4">
                  <p className="text-xs text-gray-500 uppercase">FLOOR</p>
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
                {/* Right: Lease Info */}
                <div className="lg:ml-auto grid grid-cols-2 gap-6 lg:gap-10">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      LEASE START
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
                    <p className="text-xs text-gray-500 uppercase">LEASE END</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {tenant.leaseEnd}
                    </p>
                    <p className="mt-4 text-xs text-gray-500 uppercase">
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
                  onClick={() => router.push("/dashboard/messages")}
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
                Click 'Add Tenant' to Assign new tenant.
              </p>
              <button
                type="button"
                onClick={() => setIsAddTenantOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
                Add Tenant
              </button>
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
                      <span>Reported: {maintenance.reportedDate}</span>
                      {maintenance.resolvedDate && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-brand-green" />
                          Resolved: {maintenance.resolvedDate}
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

      <AddTenantModal
        isOpen={isAddTenantOpen}
        onClose={() => setIsAddTenantOpen(false)}
        propertyId={id as string}
        unitId={unitId as string}
      />
      <NewMaintenanceRequestModal
        isOpen={isNewRequestOpen}
        onClose={() => setIsNewRequestOpen(false)}
        propertyId={id as string}
      />
    </>
  );
};

UnitDetailPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default UnitDetailPage;
