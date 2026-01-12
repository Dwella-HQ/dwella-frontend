import Head from "next/head";
import * as React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AddUnitModal } from "@/components/AddUnitModal";
import {
  Download,
  ExternalLink,
  Plus,
  Home,
  Users,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { mockUnits } from "@/data/mockPropertyDetails";
import { mockTenants } from "@/data/mockPropertyDetails";
import { mockProperties } from "@/data/mockLandlordData";
import type { Unit } from "@/data/mockLandlordData";
import type { NextPageWithLayout } from "../_app";

const UnitsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [isAddUnitOpen, setIsAddUnitOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(12);

  // Get all units with property and tenant info
  const allUnits = React.useMemo(() => {
    return mockUnits.map((unit) => {
      const property = mockProperties.find((p) => p.id === unit.propertyId);
      const tenant = unit.tenantId
        ? mockTenants.find((t) => t.id === unit.tenantId)
        : null;
      return {
        ...unit,
        propertyName: property?.name || "Unknown Property",
        tenantName: tenant?.name || null,
      };
    });
  }, []);

  // Calculate summary stats
  const totalUnits = allUnits.length;
  const occupiedUnits = allUnits.filter((u) => u.status === "occupied").length;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
  const totalMonthlyRent = allUnits.reduce((sum, u) => sum + u.monthlyRent, 0);
  const outstandingRent = allUnits
    .filter((u) => u.rentStatus === "overdue")
    .reduce((sum, u) => sum + u.monthlyRent, 0);

  // Pagination
  const totalPages = Math.ceil(allUnits.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedUnits = allUnits.slice(startIndex, endIndex);

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 1);
  };

  const getStatusBadge = (status: Unit["status"]) => {
    switch (status) {
      case "occupied":
        return (
          <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            Occupied
          </span>
        );
      case "vacant":
        return (
          <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            Vacant
          </span>
        );
      case "maintenance":
        return (
          <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
            Maintenance
          </span>
        );
    }
  };

  const getRentStatusBadge = (status: Unit["rentStatus"]) => {
    switch (status) {
      case "paid":
        return (
          <span className="text-sm font-medium text-green-700">Paid</span>
        );
      case "overdue":
        return (
          <span className="text-sm font-medium text-red-700">Overdue</span>
        );
    }
  };

  return (
    <>
      <Head>
        <title>All Units | DWELLA NG</title>
      </Head>

      <section className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">All Units</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">
              Manage individual units across all properties.
            </p>
          </div>
          <motion.button
            type="button"
            onClick={() => setIsAddUnitOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full lg:w-auto h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-gray-800 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden lg:inline">Add Unit</span>
            <span className="lg:hidden">Add</span>
          </motion.button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg border border-gray-200 bg-blue-50 p-4 lg:p-6 overflow-hidden"
          >
            <div className="flex items-center gap-2 lg:gap-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
                <Home className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-600 uppercase mb-1 truncate">
              Total Units
            </p>
            <p className="text-xl lg:text-2xl font-bold text-gray-900 break-words leading-tight">{totalUnits}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-lg border border-gray-200 bg-green-50 p-4 lg:p-6 overflow-hidden"
          >
            <div className="flex items-center gap-2 lg:gap-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 flex-shrink-0">
                <Users className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-600 uppercase mb-1 truncate">
              Occupancy
            </p>
            <p className="text-xl lg:text-2xl font-bold text-gray-900 break-words leading-tight">{occupancyRate}%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg border border-gray-200 bg-purple-50 p-4 lg:p-6 overflow-hidden"
          >
            <div className="flex items-center gap-2 lg:gap-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-600 uppercase mb-1 truncate">
              Total Monthly Rent
            </p>
            <p className="text-xl lg:text-2xl font-bold text-gray-900 break-words leading-tight">
              {formatCurrency(totalMonthlyRent)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-lg border border-gray-200 bg-orange-50 p-4 lg:p-6 overflow-hidden"
          >
            <div className="flex items-center gap-2 lg:gap-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 flex-shrink-0">
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-600 uppercase mb-1 truncate">
              Outstanding Rent
            </p>
            <p className="text-xl lg:text-2xl font-bold text-gray-900 break-words leading-tight">
              {formatCurrency(outstandingRent)}
            </p>
          </motion.div>
        </div>

        {/* Units List Table */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          {/* Table Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-gray-200 px-3 lg:px-6 py-4 gap-3">
            <div className="flex items-center gap-2 lg:gap-3">
              <h2 className="text-lg lg:text-xl font-bold text-gray-900">Units List</h2>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 lg:px-3 py-1 text-xs lg:text-sm font-medium text-blue-700 whitespace-nowrap">
                {totalUnits} Units
              </span>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-xs lg:text-sm font-medium text-gray-700 hover:text-gray-900 transition whitespace-nowrap"
            >
              <Download className="h-4 w-4" />
              <span className="hidden lg:inline">Export CSV</span>
              <span className="lg:hidden">Export</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full table-auto min-w-[1000px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    S/N
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Unit ID
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Rent
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Rent Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Next Due Date
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    View Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedUnits.map((unit, index) => (
                  <motion.tr
                    key={unit.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => router.push(`/dashboard/properties/${unit.propertyId}/units/${unit.unitId}`)}
                    className="hover:bg-gray-50 transition cursor-pointer"
                  >
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {String(startIndex + index + 1).padStart(2, "0")}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {unit.unitId}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {unit.propertyName}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {unit.type}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(unit.status)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      {unit.tenantName ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white flex-shrink-0">
                            {getInitials(unit.tenantName)}
                          </div>
                          <span className="text-sm text-gray-900">{unit.tenantName}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(unit.monthlyRent)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      {getRentStatusBadge(unit.rentStatus)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {unit.nextDueDate}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/dashboard/properties/${unit.propertyId}/units/${unit.unitId}`
                          )
                        }
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand-main hover:text-brand-main/80 transition"
                      >
                        View Details
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 px-3 sm:px-6 py-4 gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">Items per page</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-9 rounded-lg border border-gray-300 bg-white px-3 sm:px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                {startIndex + 1}-{Math.min(endIndex, allUnits.length)} of {allUnits.length} items
              </span>
              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
                  whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &lt;
                </motion.button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <motion.button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      currentPage === page
                        ? "bg-brand-main text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                    }`}
                  >
                    {page}
                  </motion.button>
                ))}
                <motion.button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
                  whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &gt;
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AddUnitModal
        isOpen={isAddUnitOpen}
        onClose={() => setIsAddUnitOpen(false)}
        propertyId=""
        onSuccess={() => {
          setIsAddUnitOpen(false);
          // In a real app, refetch units here
        }}
      />
    </>
  );
};

UnitsPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default UnitsPage;

