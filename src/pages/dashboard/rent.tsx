import Head from "next/head";
import * as React from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Download,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { mockRentPayments } from "@/data/mockLandlordData";
import type { RentPayment } from "@/data/mockLandlordData";
import type { NextPageWithLayout } from "../_app";

const RentPage: NextPageWithLayout = () => {
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
    <>
      <Head>
        <title>Rent | DWELLA NG</title>
      </Head>

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
    </>
  );
};

RentPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default RentPage;
