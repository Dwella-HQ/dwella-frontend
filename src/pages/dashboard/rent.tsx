import Head from "next/head";
import * as React from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Download,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  FileText,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { mockRentPayments } from "@/data/mockLandlordData";
import type { RentPayment } from "@/data/mockLandlordData";
import {
  mockTenantPayments,
  getTenantPaymentSummary,
} from "@/data/mockTenantData";
import type { TenantPayment } from "@/data/mockTenantData";
import { useUser } from "@/contexts/UserContext";
import type { NextPageWithLayout } from "../_app";

// Tenant Payment History Component
const TenantPaymentHistory = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const summary = getTenantPaymentSummary(mockTenantPayments);

  const filteredPayments = mockTenantPayments.filter(
    (payment) =>
      payment.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.method?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.confirmationNumber
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Payment History
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-600">
            View all your rent payment transactions
          </p>
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/dashboard/rent/pay")}
          className="w-full lg:w-auto h-10 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 flex items-center justify-center gap-2"
        >
          Pay Rent
        </motion.button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-lg bg-green-50 p-4 sm:p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Total Paid
              </p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalPaid)}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                {summary.totalPaidCount} payments
              </p>
            </div>
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-green-100 flex-shrink-0">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-lg bg-blue-50 p-4 sm:p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Average Payment
              </p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900">
                {formatCurrency(Math.round(summary.averagePayment))}
              </p>
              <p className="mt-1 text-xs text-gray-600">Per month</p>
            </div>
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-lg bg-red-50 p-4 sm:p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Outstanding Amount
              </p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900">
                {formatCurrency(summary.outstandingAmount)}
              </p>
              <p className="mt-1 text-xs text-gray-600">Pending payments</p>
            </div>
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-red-100 flex-shrink-0">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by date, method, or confirmation number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 sm:h-12 rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
        />
      </div>

      {/* Payment Transaction List */}
      <div className="space-y-3">
        {filteredPayments.map((payment, index) => (
          <motion.div
            key={payment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div
                className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full flex-shrink-0 ${
                  payment.status === "paid"
                    ? "bg-green-100"
                    : "bg-yellow-100"
                }`}
              >
                {payment.status === "paid" ? (
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm sm:text-base font-medium text-gray-900">
                    {payment.type}
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      payment.status === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {payment.status === "paid" ? "Paid" : "Pending"}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <span>{payment.date}</span>
                  {payment.method && (
                    <>
                      <span>•</span>
                      <span>{payment.method}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{payment.confirmationNumber}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className="text-sm sm:text-base font-semibold text-gray-900">
                {formatCurrency(payment.amount)}
              </span>
              {payment.status === "paid" && (
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 transition"
                  title="Download receipt"
                >
                  <Download className="h-5 w-5" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

// Landlord/Manager Rent Page (existing)
const LandlordRentPage = () => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedPeriod, setSelectedPeriod] = React.useState("2025");

  // Calculate summary stats
  const collectedThisMonth = mockRentPayments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.rentAmount, 0);

  const pendingPayments = mockRentPayments.filter((p) => p.status === "due");
  const pendingAmount = pendingPayments.reduce(
    (sum, p) => sum + p.rentAmount,
    0
  );

  const overduePayments = mockRentPayments.filter(
    (p) => p.status === "overdue"
  );
  const overdueAmount = overduePayments.reduce(
    (sum, p) => sum + (p.balance || 0),
    0
  );

  // Filter payments based on search
  const filteredPayments = mockRentPayments.filter(
    (payment) =>
      payment.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.unit.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: RentPayment["status"]) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            <CheckCircle2 className="h-3 w-3" />
            Paid
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
            <AlertCircle className="h-3 w-3" />
            Overdue
          </span>
        );
      case "due":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
            <Clock className="h-3 w-3" />
            Due
          </span>
        );
    }
  };

  return (
    <section className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Rent</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">
              Monitor rent payments and manage collection
            </p>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full lg:w-auto h-10 rounded-lg bg-gray-900 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-gray-800 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span className="hidden lg:inline">Export Data</span>
            <span className="lg:hidden">Export</span>
          </motion.button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg bg-blue-50 p-4 lg:p-6 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 truncate">
                  Collected This Month
                </p>
                <p className="mt-1 lg:mt-2 text-xl lg:text-2xl font-bold text-gray-900 break-words leading-tight">
                  {formatCurrency(collectedThisMonth)}
                </p>
              </div>
              <div className="flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
                <CheckCircle2 className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-lg bg-green-50 p-4 lg:p-6 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-600 truncate">
                  Pending Payments
                </p>
                <p className="mt-1 lg:mt-2 text-xl lg:text-2xl font-bold text-gray-900 break-words leading-tight">
                  {formatCurrency(pendingAmount)}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  {pendingPayments.length} tenants
                </p>
              </div>
              <div className="flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-green-100 flex-shrink-0">
                <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="rounded-lg bg-orange-50 p-4 lg:p-6 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-600 truncate">
                  Overdue
                </p>
                <p className="mt-1 lg:mt-2 text-xl lg:text-2xl font-bold text-gray-900 break-words leading-tight">
                  {formatCurrency(overdueAmount)}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  {overduePayments.length} tenant
                </p>
              </div>
              <div className="flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-orange-100 flex-shrink-0">
                <AlertCircle className="h-4 w-4 lg:h-5 lg:w-5 text-orange-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2">
              <label
                htmlFor="period"
                className="text-sm font-medium text-gray-700"
              >
                Period:
              </label>
              <select
                id="period"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="h-[38px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>
            <div className="relative min-w-[300px] max-w-[2048px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by tenant, property, or unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-[38px] w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full table-auto min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Rent Amount
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Last Payment
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment, index) => (
                <motion.tr
                  key={payment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  whileHover={{ x: 4, transition: { duration: 0.2 } }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white flex-shrink-0">
                        {getInitials(payment.tenantName)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {payment.tenantName}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {payment.propertyName}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {payment.unit}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {formatCurrency(payment.rentAmount)}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {payment.dueDate}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {payment.lastPayment || "—"}
                  </td>
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {payment.balance ? formatCurrency(payment.balance) : "—"}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
  );
};

// Main Rent Page Component
const RentPage: NextPageWithLayout = () => {
  const { user, isLoading } = useUser();

  // Show loading state while checking user
  if (isLoading) {
    return (
      <>
        <Head>
          <title>Rent | DWELLA NG</title>
        </Head>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">Loading...</p>
        </div>
      </>
    );
  }

  // Determine which view to show based on role
  const renderRentPage = () => {
    if (!user) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p>Please log in to view your rent information</p>
        </div>
      );
    }

    if (user.role === "tenant") {
      return <TenantPaymentHistory />;
    } else {
      return <LandlordRentPage />;
    }
  };

  return (
    <>
      <Head>
        <title>Rent | DWELLA NG</title>
      </Head>
      {renderRentPage()}
    </>
  );
};

RentPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default RentPage;
