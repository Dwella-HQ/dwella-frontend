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
import type { Unit } from "@/data/mockLandlordData";
import type { NextPageWithLayout } from "../_app";
import { ADMIN_STAT_BG, ADMIN_STAT_LABEL } from "@/lib/adminDesignTokens";
import { getPropertiesByLandlord } from "@/api/properties";
import { getUnitsByProperty } from "@/api/units";
import { mapUnitDTOToUnit } from "@/api/units/mapUnit";
import type { UnitDTO } from "@/api/units/units.schema";
import { useToast } from "@/components/Toast";

type UnitListRow = {
  id: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  type: string;
  status: Unit["status"];
  tenantName: string | null;
  monthlyRent: number;
  rentStatus: Unit["rentStatus"];
  nextDueDate: string;
};

function pickString(
  source: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function extractTenantName(dto: UnitDTO): string | null {
  const root = dto as unknown as Record<string, unknown>;
  for (const key of [
    "tenant",
    "currentTenant",
    "activeTenant",
    "leaseTenant",
  ]) {
    const node = root[key];
    if (node && typeof node === "object") {
      const o = node as Record<string, unknown>;
      const direct =
        pickString(o, ["fullName", "name", "email", "userName"]) ?? null;
      if (direct) return direct;
      const userNode = o.user;
      if (userNode && typeof userNode === "object") {
        const fromUser = pickString(userNode as Record<string, unknown>, [
          "fullName",
          "name",
          "email",
        ]);
        if (fromUser) return fromUser;
      }
    }
  }
  return null;
}

function buildUnitListRow(
  dto: UnitDTO,
  propertyId: string,
  propertyName: string,
): UnitListRow {
  const mapped = mapUnitDTOToUnit(dto, propertyId);
  return {
    id: mapped.id,
    propertyId: mapped.propertyId,
    propertyName,
    unitId: mapped.unitId,
    type: mapped.type,
    status: mapped.status,
    tenantName: extractTenantName(dto),
    monthlyRent: mapped.monthlyRent,
    rentStatus: mapped.rentStatus,
    nextDueDate: mapped.nextDueDate,
  };
}

const UnitsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [isAddUnitOpen, setIsAddUnitOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(12);
  const [rows, setRows] = React.useState<UnitListRow[]>([]);
  const [pickerProperties, setPickerProperties] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);
  const [missingLandlordContext, setMissingLandlordContext] =
    React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const landlordId =
        typeof window !== "undefined"
          ? localStorage.getItem("landlordId")
          : null;

      if (!landlordId) {
        setMissingLandlordContext(true);
        setRows([]);
        setPickerProperties([]);
        setLoadError(null);
        setIsLoading(false);
        return;
      }

      setMissingLandlordContext(false);

      setIsLoading(true);
      setLoadError(null);

      const propsResult = await getPropertiesByLandlord(landlordId);
      if (cancelled) return;

      if (!propsResult.success) {
        setRows([]);
        setPickerProperties([]);
        setLoadError(propsResult.error);
        showToast(propsResult.error || "Failed to load properties", "error");
        setIsLoading(false);
        return;
      }

      const properties = propsResult.data;
      setPickerProperties(properties.map((p) => ({ id: p.id, name: p.name })));

      const unitResults = await Promise.all(
        properties.map((p) => getUnitsByProperty(p.id)),
      );

      if (cancelled) return;

      const combined: UnitListRow[] = [];
      properties.forEach((property, index) => {
        const unitRes = unitResults[index];
        if (!unitRes.success) return;
        for (const dto of unitRes.data) {
          combined.push(buildUnitListRow(dto, property.id, property.name));
        }
      });

      setRows(combined);
      setIsLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadToken, showToast]);

  const allUnits = rows;

  const handleExportCsv = React.useCallback(() => {
    if (allUnits.length === 0) {
      showToast("No units to export.", "error");
      return;
    }
    const escapeCell = (value: string) => {
      if (/[",\r\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };
    const header = [
      "S/N",
      "Unit ID",
      "Property",
      "Type",
      "Status",
      "Tenant",
      "Rent",
      "Rent Status",
      "Next Due Date",
    ];
    const lines = allUnits.map((u, index) =>
      [
        String(index + 1),
        u.unitId,
        u.propertyName,
        u.type,
        u.status,
        u.tenantName ?? "",
        String(u.monthlyRent),
        u.rentStatus,
        u.nextDueDate,
      ]
        .map((cell) => escapeCell(String(cell)))
        .join(","),
    );
    const csv = `\uFEFF${[header.join(","), ...lines].join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `dwelliva-units-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [allUnits, showToast]);

  // Calculate summary stats
  const totalUnits = allUnits.length;
  const occupiedUnits = allUnits.filter((u) => u.status === "occupied").length;
  const occupancyRate =
    totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
  const totalMonthlyRent = allUnits.reduce((sum, u) => sum + u.monthlyRent, 0);
  const outstandingRent = allUnits
    .filter((u) => u.rentStatus === "overdue")
    .reduce((sum, u) => sum + u.monthlyRent, 0);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(allUnits.length / itemsPerPage));
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
        return <span className="text-sm font-medium text-green-700">Paid</span>;
      case "overdue":
        return (
          <span className="text-sm font-medium text-red-700">Overdue</span>
        );
      case "pending":
        return (
          <span className="text-sm font-medium text-gray-600">Pending</span>
        );
      default:
        return (
          <span className="text-sm font-medium text-gray-600">Pending</span>
        );
    }
  };

  return (
    <>
      <Head>
        <title>All Units | Dwelliva</title>
      </Head>

      <section className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              All Units
            </h1>
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

        {missingLandlordContext ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Landlord context not found. Sign in again as a landlord to load
            units.
          </div>
        ) : null}

        {loadError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {loadError}
          </div>
        ) : null}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg border border-gray-200 p-4 lg:p-6 overflow-hidden"
            style={{ backgroundColor: ADMIN_STAT_BG.blue }}
          >
            <div className="flex items-center gap-2 lg:gap-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 flex-shrink-0">
                <Home
                  className="h-4 w-4"
                  style={{ color: ADMIN_STAT_LABEL.blue }}
                />
              </div>
            </div>
            <p
              className="text-xs font-medium uppercase mb-1 truncate"
              style={{ color: ADMIN_STAT_LABEL.blue }}
            >
              Total Units
            </p>
            <p className="text-xl lg:text-2xl font-bold text-gray-900 break-words leading-tight">
              {totalUnits}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-lg border border-gray-200 p-4 lg:p-6 overflow-hidden"
            style={{ backgroundColor: ADMIN_STAT_BG.green }}
          >
            <div className="flex items-center gap-2 lg:gap-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 flex-shrink-0">
                <Users
                  className="h-4 w-4"
                  style={{ color: ADMIN_STAT_LABEL.green }}
                />
              </div>
            </div>
            <p
              className="text-xs font-medium uppercase mb-1 truncate"
              style={{ color: ADMIN_STAT_LABEL.green }}
            >
              Occupancy
            </p>
            <p className="text-xl lg:text-2xl font-bold text-gray-900 break-words leading-tight">
              {occupancyRate}%
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg border border-gray-200 p-4 lg:p-6 overflow-hidden"
            style={{ backgroundColor: ADMIN_STAT_BG.purple }}
          >
            <div className="flex items-center gap-2 lg:gap-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 flex-shrink-0">
                <DollarSign
                  className="h-4 w-4"
                  style={{ color: ADMIN_STAT_LABEL.purple }}
                />
              </div>
            </div>
            <p
              className="text-xs font-medium uppercase mb-1 truncate"
              style={{ color: ADMIN_STAT_LABEL.purple }}
            >
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
            className="rounded-lg border border-gray-200 p-4 lg:p-6 overflow-hidden"
            style={{ backgroundColor: ADMIN_STAT_BG.orange }}
          >
            <div className="flex items-center gap-2 lg:gap-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 flex-shrink-0">
                <AlertCircle
                  className="h-4 w-4"
                  style={{ color: ADMIN_STAT_LABEL.orange }}
                />
              </div>
            </div>
            <p
              className="text-xs font-medium uppercase mb-1 truncate"
              style={{ color: ADMIN_STAT_LABEL.orange }}
            >
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
              <h2 className="text-lg lg:text-xl font-bold text-gray-900">
                Units List
              </h2>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 lg:px-3 py-1 text-xs lg:text-sm font-medium text-blue-700 whitespace-nowrap">
                {totalUnits} Units
              </span>
            </div>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={isLoading || allUnits.length === 0}
              className="inline-flex items-center gap-2 text-xs lg:text-sm font-medium text-gray-700 hover:text-gray-900 transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
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
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
                      Loading units...
                    </td>
                  </tr>
                ) : displayedUnits.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
                      No units yet. Add a unit to a property to see it here.
                    </td>
                  </tr>
                ) : (
                  displayedUnits.map((unit, index) => (
                    <motion.tr
                      key={unit.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() =>
                        router.push(
                          `/dashboard/properties/${unit.propertyId}/units/${unit.id}`,
                        )
                      }
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
                            <span className="text-sm text-gray-900">
                              {unit.tenantName}
                            </span>
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
                      <td
                        className="px-3 sm:px-6 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/dashboard/properties/${unit.propertyId}/units/${unit.id}`,
                            )
                          }
                          className="inline-flex items-center gap-1 text-sm font-medium text-brand-main hover:text-brand-main/80 transition"
                        >
                          View Details
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 px-3 sm:px-6 py-4 gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                Items per page
              </span>
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
                {startIndex + 1}-{Math.min(endIndex, allUnits.length)} of{" "}
                {allUnits.length} items
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
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
                  ),
                )}
                <motion.button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
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
        pickerProperties={pickerProperties}
        onSuccess={() => {
          setIsAddUnitOpen(false);
          setReloadToken((t) => t + 1);
        }}
      />
    </>
  );
};

UnitsPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default UnitsPage;
