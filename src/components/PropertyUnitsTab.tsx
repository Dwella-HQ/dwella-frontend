import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Download, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { Unit, Tenant } from "@/data/mockLandlordData";

export type PropertyUnitsTabProps = {
  units: Unit[];
  propertyId: string;
  tenants?: Tenant[];
};

export const PropertyUnitsTab = ({ units, propertyId, tenants = [] }: PropertyUnitsTabProps) => {
  const router = useRouter();

  const handleRowClick = React.useCallback((unitId: string) => {
    router.push(`/dashboard/properties/${propertyId}/units/${unitId}`);
  }, [router, propertyId]);
  const getStatusColor = (status: Unit["status"]) => {
    switch (status) {
      case "occupied":
        return "bg-brand-green text-white";
      case "vacant":
        return "bg-orange-500 text-white";
      case "maintenance":
        return "bg-yellow-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getRentStatusColor = (status: Unit["rentStatus"]) => {
    switch (status) {
      case "paid":
        return "bg-brand-green text-white";
      case "overdue":
        return "bg-orange-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 1);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">Units List</h2>
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            {units.length} Units
          </span>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  S/N
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Unit ID
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Amenities
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Rent Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Next Due Date
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {units.map((unit, index) => {
                const tenant = unit.tenantId ? tenants.find((t) => t.id === unit.tenantId) : null;
                const tenantName = tenant ? tenant.name : "N/A";
                const tenantInitials = tenant ? getInitials(tenantName) : "N";
                const displayedAmenities = unit.amenities.slice(0, 2);
                const remainingAmenities = unit.amenities.length - 2;
                
                return (
                  <motion.tr
                    key={unit.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    whileHover={{ x: 4, transition: { duration: 0.2 } }}
                    onClick={() => handleRowClick(unit.unitId)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        <Image
                          src={unit.image}
                          alt={unit.unitId}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {unit.unitId}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {unit.type}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                          unit.status
                        )}`}
                      >
                        {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {displayedAmenities.map((amenity, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                          >
                            {amenity}
                          </span>
                        ))}
                        {remainingAmenities > 0 && (
                          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            +{remainingAmenities}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white flex-shrink-0">
                          {tenantInitials}
                        </div>
                        <span className="text-sm text-gray-700 whitespace-nowrap">{tenantName}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getRentStatusColor(
                          unit.rentStatus
                        )}`}
                      >
                        {unit.rentStatus === "paid" ? "Paid" : "Overdue"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {unit.nextDueDate}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/dashboard/properties/${propertyId}/units/${unit.unitId}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand-main hover:text-brand-main/80 transition"
                      >
                        View Details
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-3 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">Items per page</span>
            <select className="rounded-lg border border-gray-300 bg-white px-3 sm:px-4 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-main">
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="48">48</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
              1-{Math.min(12, units.length)} of {units.length} items
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled
              >
                &lt;
              </button>
              <button
                type="button"
                className="rounded-full bg-brand-main px-3 py-1.5 text-sm font-medium text-white"
              >
                1
              </button>
              <button
                type="button"
                className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                2
              </button>
              <button
                type="button"
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

