import Head from "next/head";
import * as React from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  Download,
  FileDown,
  Home,
  RefreshCw,
  TrendingUp,
  Wrench,
} from "lucide-react";

import { getLandlordByUser } from "@/api/landlord";
import {
  getProperties,
  getPropertiesByLandlord,
  type PropertyDTO,
} from "@/api/properties";
import { getRentPaymentItems } from "@/api/rent-payment";
import type { RentPaymentItemDTO } from "@/api/rent-payment/rentPayment.schema";
import { getMaintenanceRequests } from "@/api/maintenance";
import { getTransactions, type TransactionDTO } from "@/api/transaction";
import { getUnitsByProperty, type UnitDTO } from "@/api/units";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useSelectedLandlord } from "@/contexts/SelectedLandlordContext";
import { useUser } from "@/contexts/UserContext";
import type { MaintenanceRequestWithDetails } from "@/data/mockLandlordData";
import { downloadCsv, safeExportFilename, todayStamp } from "@/utils/exportCsv";
import type { NextPageWithLayout } from "../_app";

type ReportProperty = Omit<PropertyDTO, "units"> & { units: UnitDTO[] };

type MonthBucket = {
  month: string;
  revenue: number;
  transactions: number;
};

type RentBucket = {
  property: string;
  collected: number;
  outstanding: number;
};

type MaintenanceBucket = {
  category: string;
  count: number;
};

type ReportsState = {
  properties: ReportProperty[];
  rentPayments: RentPaymentItemDTO[];
  transactions: TransactionDTO[];
  maintenance: MaintenanceRequestWithDetails[];
};

type ReportExportRow = {
  section: string;
  name: string;
  units?: number;
  occupied?: number;
  vacant?: number;
  occupancy?: string;
  collected?: number;
  outstanding?: number;
  transactions?: number;
  count?: number;
};

const LAST_12_MONTHS = 12;

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthKey(date: Date): string {
  return date.toLocaleString("en", { month: "short" });
}

function getPaymentAmount(payment: RentPaymentItemDTO): number {
  return (
    asNumber(payment.paidAmount) ||
    asNumber(payment.paid_amount) ||
    asNumber(payment.total) ||
    asNumber(payment.amount)
  );
}

function getPaymentDate(payment: RentPaymentItemDTO): Date | null {
  return (
    parseDate(payment.paidAt) ||
    parseDate(payment.paid_at) ||
    parseDate(payment.paymentDate) ||
    parseDate(payment.payment_date) ||
    parseDate(payment.createdAt) ||
    parseDate(payment.created_at)
  );
}

function getTransactionAmount(transaction: TransactionDTO): number {
  return asNumber(transaction.amount);
}

function getTransactionDate(transaction: TransactionDTO): Date | null {
  return parseDate(transaction.createdAt) || parseDate(transaction.updatedAt);
}

function getNestedString(value: unknown, keys: string[]): string {
  if (!value || typeof value !== "object") return "";
  const source = value as Record<string, unknown>;
  for (const key of keys) {
    const current = source[key];
    if (typeof current === "string" && current.trim()) return current;
  }
  return "";
}

function getPaymentPropertyId(payment: RentPaymentItemDTO): string {
  return (
    payment.propertyId ||
    payment.property_id ||
    getNestedString(payment.property, ["id"]) ||
    getNestedString(payment.unit, ["propertyId", "property_id"]) ||
    ""
  );
}

function getPaymentPropertyName(payment: RentPaymentItemDTO): string {
  return (
    payment.propertyName ||
    payment.property_name ||
    getNestedString(payment.property, ["name", "propertyName"]) ||
    getNestedString(payment.unit, ["propertyName", "property_name"]) ||
    "Unassigned"
  );
}

function getPropertyName(property: ReportProperty): string {
  return typeof property.name === "string" && property.name
    ? property.name
    : "Untitled property";
}

function getPropertyId(property: ReportProperty): string {
  return typeof property.id === "string"
    ? property.id
    : String(property.id || "");
}

function isUnitOccupied(unit: UnitDTO): boolean {
  return Boolean(unit.tenant) || unit.isAvailable === false;
}

function formatCurrency(amount: number): string {
  return `NGN ${Math.round(amount).toLocaleString()}`;
}

function formatNumber(amount: number): string {
  return Math.round(amount).toLocaleString();
}

function formatPercent(value: number): string {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function getSelectedLandlordFromStorage(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("selectedLandlordId") ||
    localStorage.getItem("landlordId") ||
    ""
  );
}

function isWithinLastMonths(date: Date, months: number): boolean {
  const start = new Date();
  start.setMonth(start.getMonth() - (months - 1));
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return date >= start;
}

const ReportsPage: NextPageWithLayout = () => {
  const { user, isLoading: isUserLoading } = useUser();
  const { selectedLandlord } = useSelectedLandlord();
  const [selectedReportType, setSelectedReportType] =
    React.useState("Rent Collection");
  const [selectedDateRange, setSelectedDateRange] =
    React.useState("Last 12 Months");
  const [selectedProperty, setSelectedProperty] =
    React.useState("All Properties");
  const [selectedExportFormat, setSelectedExportFormat] = React.useState("CSV");
  const [reportsState, setReportsState] = React.useState<ReportsState>({
    properties: [],
    rentPayments: [],
    transactions: [],
    maintenance: [],
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    if (isUserLoading || !user) return;

    let cancelled = false;

    async function loadReports() {
      setIsLoading(true);
      setError(null);

      try {
        let landlordId =
          user?.role === "property_manager"
            ? selectedLandlord?.id || getSelectedLandlordFromStorage()
            : getSelectedLandlordFromStorage();

        if (user?.role === "landlord" && !landlordId) {
          const landlordResult = await getLandlordByUser(String(user.id));
          if (landlordResult.success) {
            landlordId = landlordResult.data.id;
            if (typeof window !== "undefined") {
              localStorage.setItem("landlordId", landlordId);
            }
          }
        }

        const propertiesResult = landlordId
          ? await getPropertiesByLandlord(landlordId)
          : await getProperties();

        if (!propertiesResult.success) {
          throw new Error(propertiesResult.error);
        }

        const unitsResults = await Promise.all(
          propertiesResult.data.map(async (property) => {
            const propertyId =
              typeof property.id === "string"
                ? property.id
                : String(property.id || "");
            const result = await getUnitsByProperty(propertyId);
            return {
              propertyId,
              units: result.success ? result.data : [],
            };
          }),
        );
        const unitsByProperty = new Map(
          unitsResults.map((result) => [result.propertyId, result.units]),
        );
        const properties = propertiesResult.data.map((property) => ({
          ...property,
          units:
            unitsByProperty.get(
              typeof property.id === "string"
                ? property.id
                : String(property.id || ""),
            ) || [],
        }));

        const [paymentsResult, maintenanceResult, transactionsResult] =
          await Promise.all([
            getRentPaymentItems({ limit: 500 }),
            getMaintenanceRequests({
              limit: 500,
              landlordId: landlordId || undefined,
            }),
            getTransactions(),
          ]);

        if (cancelled) return;

        setReportsState({
          properties,
          rentPayments: paymentsResult.success ? paymentsResult.data : [],
          maintenance: maintenanceResult.success ? maintenanceResult.data : [],
          transactions: transactionsResult.success
            ? transactionsResult.data
            : [],
        });
      } catch (err) {
        if (!cancelled) {
          setReportsState({
            properties: [],
            rentPayments: [],
            maintenance: [],
            transactions: [],
          });
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load report data right now.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadReports();

    return () => {
      cancelled = true;
    };
  }, [isUserLoading, refreshKey, selectedLandlord?.id, user]);

  const propertyOptions = reportsState.properties;

  const scopedProperties = React.useMemo(() => {
    if (selectedProperty === "All Properties") return reportsState.properties;
    return reportsState.properties.filter(
      (property) => getPropertyId(property) === selectedProperty,
    );
  }, [reportsState.properties, selectedProperty]);

  const propertyIdSet = React.useMemo(
    () => new Set(scopedProperties.map(getPropertyId)),
    [scopedProperties],
  );

  const propertyNameSet = React.useMemo(
    () =>
      new Set(
        scopedProperties.map((property) =>
          getPropertyName(property).toLowerCase(),
        ),
      ),
    [scopedProperties],
  );

  const scopedPayments = React.useMemo(() => {
    if (scopedProperties.length === 0) return [];
    return reportsState.rentPayments.filter((payment) => {
      const propertyId = getPaymentPropertyId(payment);
      const propertyName = getPaymentPropertyName(payment).toLowerCase();
      return propertyIdSet.has(propertyId) || propertyNameSet.has(propertyName);
    });
  }, [
    propertyIdSet,
    propertyNameSet,
    reportsState.rentPayments,
    scopedProperties.length,
  ]);

  const scopedMaintenance = React.useMemo(() => {
    if (scopedProperties.length === 0) return [];
    return reportsState.maintenance.filter((item) => {
      const maybe = item as { propertyId?: string; property_id?: string };
      const propertyId = maybe.propertyId || maybe.property_id || "";
      const propertyName = (item.propertyName || "").toLowerCase();
      return propertyIdSet.has(propertyId) || propertyNameSet.has(propertyName);
    });
  }, [
    propertyIdSet,
    propertyNameSet,
    reportsState.maintenance,
    scopedProperties.length,
  ]);

  const scopedUnits = React.useMemo<UnitDTO[]>(() => {
    return scopedProperties.flatMap((property) => property.units || []);
  }, [scopedProperties]);

  const totalUnits = scopedUnits.length;
  const occupiedUnits = scopedUnits.filter(isUnitOccupied).length;
  const vacantUnits = Math.max(totalUnits - occupiedUnits, 0);
  const avgOccupancyRate =
    totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

  const currentMonthRevenue = React.useMemo(() => {
    const now = new Date();
    return scopedPayments.reduce((sum, payment) => {
      const date = getPaymentDate(payment);
      if (
        date &&
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      ) {
        return sum + getPaymentAmount(payment);
      }
      return sum;
    }, 0);
  }, [scopedPayments]);

  const previousMonthRevenue = React.useMemo(() => {
    const previous = new Date();
    previous.setMonth(previous.getMonth() - 1);
    return scopedPayments.reduce((sum, payment) => {
      const date = getPaymentDate(payment);
      if (
        date &&
        date.getFullYear() === previous.getFullYear() &&
        date.getMonth() === previous.getMonth()
      ) {
        return sum + getPaymentAmount(payment);
      }
      return sum;
    }, 0);
  }, [scopedPayments]);

  const monthlyChange =
    previousMonthRevenue > 0
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) *
        100
      : 0;

  const activeMaintenanceCount = scopedMaintenance.filter(
    (item) => item.status !== "resolved",
  ).length;

  const revenueTrend = React.useMemo<MonthBucket[]>(() => {
    const months = Array.from({ length: LAST_12_MONTHS }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (LAST_12_MONTHS - 1 - index));
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: monthKey(date),
        revenue: 0,
        transactions: 0,
      };
    });
    const buckets = new Map(months.map((bucket) => [bucket.key, bucket]));

    for (const payment of scopedPayments) {
      const date = getPaymentDate(payment);
      if (!date || !isWithinLastMonths(date, LAST_12_MONTHS)) continue;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const bucket = buckets.get(key);
      if (bucket) bucket.revenue += getPaymentAmount(payment);
    }

    for (const transaction of reportsState.transactions) {
      const date = getTransactionDate(transaction);
      if (!date || !isWithinLastMonths(date, LAST_12_MONTHS)) continue;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const bucket = buckets.get(key);
      if (bucket) bucket.transactions += getTransactionAmount(transaction);
    }

    return months;
  }, [reportsState.transactions, scopedPayments]);

  const rentCollectionData = React.useMemo<RentBucket[]>(() => {
    return scopedProperties.map((property) => {
      const units = property.units || [];
      const collected = scopedPayments
        .filter((payment) => {
          const paymentPropertyId = getPaymentPropertyId(payment);
          const paymentPropertyName = getPaymentPropertyName(payment);
          return (
            paymentPropertyId === getPropertyId(property) ||
            paymentPropertyName.toLowerCase() ===
              getPropertyName(property).toLowerCase()
          );
        })
        .reduce((sum, payment) => sum + getPaymentAmount(payment), 0);
      const monthlyPotential = units.reduce(
        (sum, unit) => sum + asNumber(unit.rentAmount),
        0,
      );
      return {
        property: getPropertyName(property),
        collected,
        outstanding: Math.max(monthlyPotential - collected, 0),
      };
    });
  }, [scopedPayments, scopedProperties]);

  const maintenanceActivityData = React.useMemo<MaintenanceBucket[]>(() => {
    const counts = new Map<string, number>();
    for (const item of scopedMaintenance) {
      const key = item.type || item.subType || "Other";
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return Array.from(counts, ([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [scopedMaintenance]);

  const availableReports = [
    {
      id: "rent-collection",
      title: "Rent Collection Summary",
      description:
        "Rent collected by property based on available payment records.",
      lastGenerated: scopedPayments.length
        ? "Updated from live payments"
        : "No payments yet",
      icon: TrendingUp,
      iconColor: "bg-blue-100 text-blue-600",
    },
    {
      id: "occupancy",
      title: "Occupancy Report",
      description: "Unit occupancy and vacancy from property unit records.",
      lastGenerated: totalUnits ? "Updated from live units" : "No units yet",
      icon: Home,
      iconColor: "bg-green-100 text-green-600",
    },
    {
      id: "maintenance",
      title: "Maintenance Activity",
      description:
        "Request volume by type and status. Cost is not exposed by the API.",
      lastGenerated: scopedMaintenance.length
        ? "Updated from live requests"
        : "No requests yet",
      icon: Wrench,
      iconColor: "bg-yellow-100 text-yellow-600",
    },
    {
      id: "revenue",
      title: "Revenue Trends",
      description:
        "Month-by-month revenue from rent payments and transactions.",
      lastGenerated: revenueTrend.some((item) => item.revenue > 0)
        ? "Updated from live finance data"
        : "No revenue yet",
      icon: BarChart3,
      iconColor: "bg-purple-100 text-purple-600",
    },
  ];

  const recentExports = [
    {
      fileName: `${selectedReportType} - ${selectedDateRange}.csv`,
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      size: "Generated locally",
    },
  ];

  const reportRows = React.useMemo<ReportExportRow[]>(() => {
    if (selectedReportType === "Rent Collection") {
      return rentCollectionData.map((row) => ({
        section: "Rent Collection",
        name: row.property,
        collected: row.collected,
        outstanding: row.outstanding,
      }));
    }
    if (selectedReportType === "Occupancy") {
      return scopedProperties.map((property) => {
        const units = property.units || [];
        const occupied = units.filter(isUnitOccupied).length;
        return {
          section: "Occupancy",
          name: getPropertyName(property),
          units: units.length,
          occupied,
          vacant: Math.max(units.length - occupied, 0),
          occupancy:
            units.length > 0
              ? `${Math.round((occupied / units.length) * 100)}%`
              : "0%",
        };
      });
    }
    if (selectedReportType === "Maintenance Activity") {
      return maintenanceActivityData.map((row) => ({
        section: "Maintenance Activity",
        name: row.category,
        count: row.count,
      }));
    }
    return revenueTrend.map((row) => ({
      section: "Revenue Trends",
      name: row.month,
      collected: row.revenue,
      transactions: row.transactions,
    }));
  }, [
    maintenanceActivityData,
    rentCollectionData,
    revenueTrend,
    scopedProperties,
    selectedReportType,
  ]);

  const handleExportReport = React.useCallback(() => {
    downloadCsv(
      `${safeExportFilename(`${selectedReportType}-${selectedDateRange}`)}-${todayStamp()}.csv`,
      [
        { header: "Section", value: (row) => row.section },
        { header: "Name", value: (row) => row.name },
        { header: "Units", value: (row) => row.units },
        { header: "Occupied", value: (row) => row.occupied },
        { header: "Vacant", value: (row) => row.vacant },
        { header: "Occupancy", value: (row) => row.occupancy },
        { header: "Collected", value: (row) => row.collected },
        { header: "Outstanding", value: (row) => row.outstanding },
        { header: "Transactions", value: (row) => row.transactions },
        { header: "Count", value: (row) => row.count },
      ],
      reportRows,
    );
  }, [reportRows, selectedDateRange, selectedReportType]);

  const maxTrend = Math.max(
    1,
    ...revenueTrend.flatMap((d) => [d.revenue, d.transactions]),
  );
  const maxRent = Math.max(
    1,
    ...rentCollectionData.flatMap((d) => [d.collected, d.outstanding]),
  );
  const maxMaintenance = Math.max(
    1,
    ...maintenanceActivityData.map((d) => d.count),
  );

  const emptyState =
    !isLoading &&
    !error &&
    reportsState.properties.length === 0 &&
    reportsState.rentPayments.length === 0 &&
    reportsState.maintenance.length === 0;

  return (
    <>
      <Head>
        <title>Reports & Analytics | Dwelliva</title>
      </Head>

      <section className="relative space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Reports & Analytics
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Live summaries derived from properties, rent payments,
              transactions, and maintenance requests.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        {emptyState ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
            No report data is available yet. Add properties, units, rent
            payments, or maintenance requests to populate this page.
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-xs font-medium text-gray-600 sm:text-sm">
                Revenue This Month
              </p>
              <TrendingUp className="h-4 w-4 flex-shrink-0 text-green-600" />
            </div>
            <p className="break-words text-xl font-bold leading-tight text-gray-900 sm:text-2xl">
              {isLoading ? "Loading..." : formatCurrency(currentMonthRevenue)}
            </p>
            <p
              className={`mt-1 text-xs font-medium sm:mt-2 sm:text-sm ${
                monthlyChange >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {previousMonthRevenue > 0
                ? `${monthlyChange >= 0 ? "+" : ""}${formatPercent(monthlyChange)} from last month`
                : "No previous month baseline"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-xs font-medium text-gray-600 sm:text-sm">
                Occupancy Rate
              </p>
              <Home className="h-4 w-4 flex-shrink-0 text-blue-600" />
            </div>
            <p className="break-words text-xl font-bold leading-tight text-gray-900 sm:text-2xl">
              {isLoading ? "Loading..." : formatPercent(avgOccupancyRate)}
            </p>
            <p className="mt-1 text-xs text-gray-600 sm:mt-2 sm:text-sm">
              {occupiedUnits} occupied / {totalUnits} total units
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-xs font-medium text-gray-600 sm:text-sm">
                Active Maintenance
              </p>
              <Wrench className="h-4 w-4 flex-shrink-0 text-amber-600" />
            </div>
            <p className="break-words text-xl font-bold leading-tight text-gray-900 sm:text-2xl">
              {isLoading ? "Loading..." : activeMaintenanceCount}
            </p>
            <p className="mt-1 text-xs text-gray-600 sm:mt-2 sm:text-sm">
              {scopedMaintenance.length} total requests
            </p>
          </motion.div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <h3 className="mb-6 text-xl font-bold text-gray-900">
              Revenue vs Transactions
            </h3>
            <div className="h-80">
              <div className="flex h-64 items-end gap-2 border-b border-l border-gray-200 px-2">
                {revenueTrend.map((item) => (
                  <div
                    key={item.month}
                    className="flex h-full flex-1 items-end justify-center gap-1"
                  >
                    <div
                      className="w-full rounded-t bg-blue-500"
                      style={{
                        height: `${Math.max((item.revenue / maxTrend) * 100, item.revenue ? 3 : 0)}%`,
                      }}
                      title={`${item.month} revenue: ${formatCurrency(item.revenue)}`}
                    />
                    <div
                      className="w-full rounded-t bg-slate-400"
                      style={{
                        height: `${Math.max((item.transactions / maxTrend) * 100, item.transactions ? 3 : 0)}%`,
                      }}
                      title={`${item.month} transactions: ${formatCurrency(item.transactions)}`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between text-xs text-gray-600">
                {revenueTrend.map((item) => (
                  <span key={item.month}>{item.month}</span>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-blue-500" />
                <span className="text-sm text-gray-700">Rent payments</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-slate-400" />
                <span className="text-sm text-gray-700">Transactions</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <h3 className="mb-6 text-xl font-bold text-gray-900">
              Rent Collection by Property
            </h3>
            <div className="space-y-4">
              {rentCollectionData.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No property rent data available yet.
                </p>
              ) : (
                rentCollectionData.slice(0, 8).map((item) => (
                  <div key={item.property}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-gray-700">
                        {item.property}
                      </span>
                      <span className="text-gray-500">
                        {formatCurrency(item.collected)}
                      </span>
                    </div>
                    <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="bg-blue-500"
                        style={{
                          width: `${(item.collected / maxRent) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-orange-400"
                        style={{
                          width: `${(item.outstanding / maxRent) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-blue-500" />
                <span className="text-sm text-gray-700">Collected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-orange-400" />
                <span className="text-sm text-gray-700">
                  Outstanding estimate
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <h3 className="mb-6 text-xl font-bold text-gray-900">
              Unit Occupancy Overview
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-700">Occupied</p>
                <p className="mt-2 text-3xl font-bold text-blue-900">
                  {occupiedUnits}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-600">Vacant</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {vacantUnits}
                </p>
              </div>
            </div>
            <div className="mt-6 h-4 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${avgOccupancyRate}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <h3 className="mb-6 text-xl font-bold text-gray-900">
              Maintenance Activity by Category
            </h3>
            <div className="space-y-4">
              {maintenanceActivityData.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No maintenance requests available yet.
                </p>
              ) : (
                maintenanceActivityData.map((item) => (
                  <div key={item.category}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-gray-700">
                        {item.category}
                      </span>
                      <span className="text-gray-500">
                        {formatNumber(item.count)}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full bg-amber-500"
                        style={{
                          width: `${(item.count / maxMaintenance) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Available Reports
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {availableReports.map((report, index) => {
              const Icon = report.icon;
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${report.iconColor}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {report.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {report.description}
                  </p>
                  <p className="mt-3 text-xs text-gray-500">
                    {report.lastGenerated}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-6 text-xl font-bold text-gray-900">
            Custom Report Builder
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Report Type
              </label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
              >
                <option>Rent Collection</option>
                <option>Occupancy Report</option>
                <option>Maintenance Activity</option>
                <option>Revenue Trends</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Date Range
              </label>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
              >
                <option>Last 3 Months</option>
                <option>Last 6 Months</option>
                <option>Last 12 Months</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Property
              </label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
              >
                <option>All Properties</option>
                {propertyOptions.map((property) => (
                  <option
                    key={getPropertyId(property)}
                    value={getPropertyId(property)}
                  >
                    {getPropertyName(property)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Export Format
              </label>
              <select
                value={selectedExportFormat}
                onChange={(e) => setSelectedExportFormat(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
              >
                <option>CSV</option>
              </select>
            </div>
          </div>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleExportReport}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-main px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-main/90"
            >
              <FileDown className="h-4 w-4" />
              Generate Custom Report
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="rounded-lg border border-gray-200 bg-white shadow-sm"
        >
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900">
              Recent Report Snapshot
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recentExports.map((exportItem) => (
                  <tr
                    key={exportItem.fileName}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {exportItem.fileName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {exportItem.date}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {exportItem.size}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <button
                        type="button"
                        onClick={handleExportReport}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand-main transition hover:text-brand-main/80"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <div
          aria-hidden="true"
          className="absolute inset-0 z-30 rounded-xl bg-white/60 backdrop-blur-[1px]"
        >
          <div className="sticky top-24 flex justify-center px-4">
            <div className="rounded-full border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-900 shadow-sm">
              Reports are coming soon
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

ReportsPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default ReportsPage;
