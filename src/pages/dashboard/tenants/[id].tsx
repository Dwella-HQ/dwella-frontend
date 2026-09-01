import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { isValid, parse, parseISO } from "date-fns";
import {
  ArrowLeft,
  Phone,
  Mail,
  Home,
  Calendar,
  DollarSign,
  CheckCircle2,
  Upload,
} from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { DataUnavailableBanner } from "@/components/DataUnavailableBanner";
import type { PaymentHistory } from "@/data/mockLandlordData";
import type { NextPageWithLayout } from "../../_app";
import { ADMIN_STAT_BG, ADMIN_STAT_LABEL } from "@/lib/adminDesignTokens";
import { getTenant } from "@/api/tenants";
import { getRentPayments } from "@/api/rent-payment";
import { getMaintenanceRequests } from "@/api/maintenance";
import {
  getRentsByLease,
  resolveTenantActiveLeaseId,
  type RentItemDTO,
} from "@/api/rent";
import { formatDateTimeDisplay } from "@/utils/formatDate";

const messageTenantHref = (tenantId: string | number) =>
  `/dashboard/messages?tenantId=${encodeURIComponent(String(tenantId))}`;

type PaymentStatusTone = "green" | "red" | "amber" | "gray";

function parseRentDueDate(value: string): Date | null {
  if (!value) return null;
  try {
    const iso = parseISO(value);
    if (isValid(iso)) return iso;
  } catch {
    /* noop */
  }
  try {
    const d = parse(value, "dd/MM/yyyy", new Date());
    if (isValid(d)) return d;
  } catch {
    /* noop */
  }
  const fb = new Date(value);
  return isValid(fb) ? fb : null;
}

function rentRowsPaymentSummary(rents: RentItemDTO[]): {
  label: string;
  tone: PaymentStatusTone;
} {
  if (!rents.length) {
    return { label: "No rent charges", tone: "gray" };
  }
  const unpaid = rents.filter((r) => (r.status || "").toLowerCase() !== "paid");
  if (unpaid.length === 0) {
    return { label: "Paid", tone: "green" };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const hasOverdue = unpaid.some((r) => {
    const d = parseRentDueDate(r.dueDate || "");
    return d != null && d < today;
  });
  if (hasOverdue) {
    return { label: "Overdue", tone: "red" };
  }
  return { label: "Pending", tone: "amber" };
}

function formatRentDate(value: string): string {
  const parsed = parseRentDueDate(value);
  return parsed ? parsed.toLocaleDateString("en-GB") : value || "—";
}

function rentRowsDetails(rents: RentItemDTO[]): {
  nextPayment: string;
  outstanding: number;
} {
  const unpaid = rents
    .filter((r) => (r.status || "").toLowerCase() !== "paid")
    .sort((a, b) => {
      const aDate = parseRentDueDate(a.dueDate || "")?.getTime() ?? Infinity;
      const bDate = parseRentDueDate(b.dueDate || "")?.getTime() ?? Infinity;
      return aDate - bDate;
    });

  return {
    nextPayment: unpaid[0] ? formatRentDate(unpaid[0].dueDate || "") : "—",
    outstanding: unpaid.reduce(
      (sum, rent) => sum + (rent.totalAmount ?? rent.amount + rent.lateFee),
      0,
    ),
  };
}

type TenantMaintenanceRow = {
  id: string;
  type: string;
  subType: string;
  reportedDate: string;
  resolvedDate?: string;
};

const TenantProfilePage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id } = router.query;
  const [activeTab, setActiveTab] = React.useState("overview");
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [tenantData, setTenantData] = React.useState<Record<
    string,
    unknown
  > | null>(null);
  const [liveTenantPayments, setLiveTenantPayments] = React.useState<
    PaymentHistory[]
  >([]);
  const [liveTenantMaintenance, setLiveTenantMaintenance] = React.useState<
    TenantMaintenanceRow[]
  >([]);
  const [leaseRents, setLeaseRents] = React.useState<RentItemDTO[] | null>(
    null,
  );

  React.useEffect(() => {
    if (!id || typeof id !== "string") return;
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    setLeaseRents(null);

    void (async () => {
      try {
        const tenantResult = await getTenant(id);
        if (cancelled) return;
        if (!tenantResult.success) {
          setLoadError(tenantResult.error || "Tenant not found");
          setTenantData(null);
          setLeaseRents([]);
          return;
        }

        const record = tenantResult.data as unknown as Record<string, unknown>;
        setTenantData(record);

        const leases = Array.isArray(record.leases)
          ? (record.leases as Array<Record<string, unknown>>)
          : [];
        const activeLeaseId = resolveTenantActiveLeaseId(leases, null);

        const tenantName = (
          ((record.user as Record<string, unknown> | undefined)?.fullName as
            | string
            | undefined) ||
          (record.fullName as string | undefined) ||
          (record.email as string | undefined) ||
          ""
        )
          .trim()
          .toLowerCase();

        const tenantId = String(record.id ?? "");

        const [paymentsResult, maintenanceResult, rentsResult] =
          await Promise.all([
            getRentPayments({ limit: 200 }),
            getMaintenanceRequests({ limit: 200, tenantId }),
            activeLeaseId
              ? getRentsByLease(activeLeaseId)
              : Promise.resolve({ success: false as const, error: "No lease" }),
          ]);

        if (cancelled) return;

        if (rentsResult.success) {
          setLeaseRents(rentsResult.data);
        } else {
          setLeaseRents([]);
        }

        const scopedPayments = paymentsResult.success
          ? paymentsResult.data.filter((p) => {
              const byName = tenantName
                ? p.tenantName.trim().toLowerCase() === tenantName
                : false;
              const byId =
                tenantId &&
                ((p as unknown as { tenantId?: string }).tenantId ?? "") ===
                  tenantId;
              return byName || byId;
            })
          : [];
        const mappedPayments = scopedPayments.map((p) => ({
          id: p.id,
          amount: p.amount,
          method:
            (p as unknown as { method?: string | null }).method || "Payment",
          date: p.dueDate,
          transactionId: p.id,
          tenantId,
          tenantName: p.tenantName || "Tenant",
          unitId: p.unit || "—",
          propertyId: p.propertyId || "",
          status: p.paymentReceived
            ? ("success" as const)
            : ("failed" as const),
        }));
        setLiveTenantPayments(mappedPayments);

        const scopedMaintenance = maintenanceResult.success
          ? maintenanceResult.data.filter((m) => {
              const byName = tenantName
                ? (m.tenantName || "").trim().toLowerCase() === tenantName
                : false;
              const byId =
                tenantId &&
                ((m as unknown as { tenantId?: string }).tenantId ?? "") ===
                  tenantId;
              return byName || byId;
            })
          : [];
        const mappedMaintenance = scopedMaintenance.map((m) => ({
          id: m.id,
          type: m.type || "Maintenance",
          subType: m.subType || m.description || "Request",
          reportedDate: m.reportedTime || "—",
          resolvedDate: m.status === "resolved" ? "Resolved" : undefined,
        }));
        setLiveTenantMaintenance(mappedMaintenance);
      } catch (error) {
        if (cancelled) return;
        setLoadError(
          error instanceof Error ? error.message : "Failed to load tenant",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const tenant = React.useMemo(() => {
    if (tenantData) {
      const user =
        (tenantData.user as Record<string, unknown> | undefined) || {};
      const currentUnit =
        (tenantData.currentUnit as Record<string, unknown> | undefined) || {};
      const leases = Array.isArray(tenantData.leases)
        ? (tenantData.leases as Array<Record<string, unknown>>)
        : [];
      const activeLease =
        leases.find((l) => l.isActive === true) ?? leases[0] ?? null;
      const formatDate = (value: unknown) => {
        if (typeof value !== "string" || !value) return "—";
        const d = new Date(value);
        return Number.isNaN(d.getTime())
          ? value
          : d.toLocaleDateString("en-GB");
      };
      return {
        id: String(tenantData.id ?? id),
        name: String(user.fullName ?? tenantData.fullName ?? "Tenant"),
        phone: String(user.phoneNumber ?? tenantData.phoneNumber ?? "—"),
        email: String(user.email ?? tenantData.email ?? "—"),
        unitId: String(currentUnit.name ?? currentUnit.id ?? "—"),
        leaseStart: formatDate(activeLease?.startDate),
        leaseEnd: formatDate(activeLease?.endDate),
        nextPayment: "—",
        monthlyRent:
          typeof activeLease?.rentAmount === "number"
            ? activeLease.rentAmount
            : typeof currentUnit.rentAmount === "number"
              ? currentUnit.rentAmount
              : 0,
      };
    }
    return null;
  }, [id, tenantData]);

  const tenantPayments = React.useMemo(() => {
    if (!tenant) return [];
    return liveTenantPayments;
  }, [liveTenantPayments, tenant]);

  const paymentStatusDisplay = React.useMemo(() => {
    if (leaseRents === null) {
      return { label: "…", tone: "gray" as const };
    }
    if (leaseRents.length > 0) {
      return rentRowsPaymentSummary(leaseRents);
    }
    const hasSuccess = tenantPayments.some((p) => p.status === "success");
    if (hasSuccess) {
      return { label: "Paid", tone: "green" as const };
    }
    if (tenantPayments.some((p) => p.status === "failed")) {
      return { label: "Pending", tone: "amber" as const };
    }
    return { label: "Unpaid", tone: "amber" as const };
  }, [leaseRents, tenantPayments]);

  const tenantMaintenance = React.useMemo(() => {
    if (!tenant) return [];
    return liveTenantMaintenance;
  }, [liveTenantMaintenance, tenant]);

  const rentDetails = React.useMemo(() => {
    if (leaseRents && leaseRents.length > 0) {
      return rentRowsDetails(leaseRents);
    }

    return {
      nextPayment: tenant?.nextPayment ?? "—",
      outstanding: tenantPayments
        .filter((payment) => payment.status !== "success")
        .reduce((sum, payment) => sum + payment.amount, 0),
    };
  }, [leaseRents, tenant?.nextPayment, tenantPayments]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">{loadError}</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Tenant not found</p>
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

  const totalPaid = tenantPayments
    .filter((p) => p.status === "success")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const monthlyRent =
    (tenant as { monthlyRent?: number | null } | null)?.monthlyRent || 120000;

  const paymentStatusBadgeClasses: Record<PaymentStatusTone, string> = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    gray: "bg-gray-100 text-gray-600",
  };
  const paymentStatusBadgeClass =
    paymentStatusBadgeClasses[paymentStatusDisplay.tone];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "payments", label: "Payments" },
    { id: "documents", label: "Documents" },
    { id: "maintenance", label: "Maintenance" },
    { id: "communications", label: "Communications" },
  ];

  return (
    <>
      <Head>
        <title>Dwelliva · Tenant Profile</title>
      </Head>

      <section className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Tenant Profile
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 whitespace-nowrap"
            >
              Edit Profile
            </button>
            <button
              type="button"
              onClick={() => router.push(messageTenantHref(tenant.id))}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 whitespace-nowrap"
            >
              Message
            </button>
          </div>
        </div>

        {/* Tenant Information Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 relative">
          <div className="absolute right-6 top-6">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${paymentStatusBadgeClass}`}
            >
              {paymentStatusDisplay.label}
            </span>
          </div>

          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-gray-200 text-2xl font-bold text-gray-700">
              {getInitials(tenant.name)}
            </div>

            {/* Tenant Details */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {tenant.name}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Tenant • Unit {tenant.unitId}
              </p>

              {/* Contact Information */}
              <div className="mt-4 flex flex-wrap gap-6">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: ADMIN_STAT_BG.blue }}
                  >
                    <Phone
                      className="h-5 w-5"
                      style={{ color: ADMIN_STAT_LABEL.blue }}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">
                      {tenant.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: ADMIN_STAT_BG.green }}
                  >
                    <Mail
                      className="h-5 w-5"
                      style={{ color: ADMIN_STAT_LABEL.green }}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">
                      {tenant.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: ADMIN_STAT_BG.purple }}
                  >
                    <Home
                      className="h-5 w-5"
                      style={{ color: ADMIN_STAT_LABEL.purple }}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Unit</p>
                    <p className="text-sm font-medium text-gray-900">
                      Unit {tenant.unitId}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial/Rent-Lease Summary Cards */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <div
              className="rounded-lg border border-gray-200 p-4"
              style={{ backgroundColor: ADMIN_STAT_BG.blue }}
            >
              <p
                className="text-xs font-medium uppercase"
                style={{ color: ADMIN_STAT_LABEL.blue }}
              >
                Monthly Rent
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                ₦{monthlyRent.toLocaleString()}
              </p>
            </div>
            <div
              className="rounded-lg border border-gray-200 p-4"
              style={{ backgroundColor: ADMIN_STAT_BG.green }}
            >
              <p
                className="text-xs font-medium uppercase"
                style={{ color: ADMIN_STAT_LABEL.green }}
              >
                Move-in Date
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {tenant.leaseStart === "—" ? "—" : tenant.leaseStart}
              </p>
            </div>
            <div
              className="rounded-lg border border-gray-200 p-4"
              style={{ backgroundColor: ADMIN_STAT_BG.orange }}
            >
              <p
                className="text-xs font-medium uppercase"
                style={{ color: ADMIN_STAT_LABEL.orange }}
              >
                Next Payment
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {rentDetails.nextPayment}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase text-gray-500">
                Outstanding
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                ₦{rentDetails.outstanding.toLocaleString()}
              </p>
            </div>
            <div
              className="rounded-lg border border-gray-200 p-4"
              style={{ backgroundColor: ADMIN_STAT_BG.purple }}
            >
              <p
                className="text-xs font-medium uppercase"
                style={{ color: ADMIN_STAT_LABEL.purple }}
              >
                Rent/Lease Ends
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {tenant.leaseEnd === "—" ? "—" : tenant.leaseEnd}
              </p>
            </div>
            <div
              className="rounded-lg border border-gray-200 p-4"
              style={{ backgroundColor: ADMIN_STAT_BG.orange }}
            >
              <p
                className="text-xs font-medium uppercase"
                style={{ color: ADMIN_STAT_LABEL.orange }}
              >
                Total Paid
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                ₦{totalPaid.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 relative min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative whitespace-nowrap px-1 py-4 text-sm font-medium transition flex-shrink-0 ${
                  activeTab === tab.id
                    ? "text-brand-main"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTenantTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-main"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-6"
            >
              {/* Rent/Lease Information */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Rent/Lease Information
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Rent/Lease Start
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {tenant.leaseStart}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Rent/Lease End
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {tenant.leaseEnd}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Monthly Rent
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          ₦{monthlyRent.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Next Payment
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {rentDetails.nextPayment}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Outstanding
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          ₦{rentDetails.outstanding.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Payment Status
                        </p>
                        <p className="mt-1">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${paymentStatusBadgeClass}`}
                          >
                            {paymentStatusDisplay.label}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Emergency Contact
                </h3>
                <DataUnavailableBanner
                  tone="neutral"
                  title="Emergency contact isn't available"
                  description="This information hasn't been provided yet."
                />
              </div>
            </motion.div>
          )}

          {activeTab === "payments" && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Payment History
                </h3>
              </div>
              <div className="space-y-3">
                {tenantPayments.length > 0 ? (
                  tenantPayments.map((payment) => {
                    const isSuccess = payment.status === "success";
                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${isSuccess ? "bg-green-100" : "bg-amber-100"}`}
                          >
                            <CheckCircle2
                              className={`h-5 w-5 ${isSuccess ? "text-green-600" : "text-amber-600"}`}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {payment.method}
                            </p>
                            <p className="text-xs text-gray-500">
                              {payment.date} •{" "}
                              {payment.transactionId.replace(
                                "TXN-",
                                "TXN-2025-",
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            ₦{payment.amount.toLocaleString()}
                          </p>
                          <span
                            className={`mt-1 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${isSuccess ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                          >
                            {isSuccess ? "Completed" : "Pending"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                      <DollarSign className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      No payments found
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "documents" && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Documents
                </h3>
                <button
                  type="button"
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Document
                </button>
              </div>
              <DataUnavailableBanner
                tone="neutral"
                title="Documents aren't available"
                description="Tenant document storage isn't connected yet."
              />
            </motion.div>
          )}

          {activeTab === "maintenance" && (
            <motion.div
              key="maintenance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Maintenance Requests
                </h3>
              </div>
              <div className="space-y-3">
                {tenantMaintenance.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500">
                    No maintenance requests for this tenant yet.
                  </p>
                ) : (
                tenantMaintenance.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {request.type}:
                        </p>
                        <p className="text-xs text-gray-500">
                          {request.subType}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Reported:{" "}
                          {formatDateTimeDisplay(request.reportedDate)}
                          {request.resolvedDate &&
                            ` • Resolved: ${formatDateTimeDisplay(
                              request.resolvedDate,
                            )}`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700"
                    >
                      Resolved
                    </button>
                  </div>
                ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "communications" && (
            <motion.div
              key="communications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Communication History
                </h3>
                <button
                  type="button"
                  onClick={() => router.push(messageTenantHref(tenant.id))}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  New Message
                </button>
              </div>
              <DataUnavailableBanner
                tone="neutral"
                title="Communication history isn't available"
                description="Message history for this tenant isn't loaded here yet. Use New Message to open chat."
              />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </>
  );
};

TenantProfilePage.getLayout = (page) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default TenantProfilePage;
