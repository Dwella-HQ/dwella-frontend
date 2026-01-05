import * as React from "react";
import Image from "next/image";
import { MapPin } from "lucide-react";
import type { Property } from "@/data/mockLandlordData";

export type PropertyTableProps = {
  properties: Property[];
  onPropertyClick?: (property: Property) => void;
};

export const PropertyTable = ({ properties, onPropertyClick }: PropertyTableProps) => {
  const getStatusColor = (status: Property["status"]) => {
    switch (status) {
      case "active":
        return "bg-brand-green text-white";
      case "pending":
        return "bg-orange-500 text-white";
      case "inactive":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusLabel = (status: Property["status"]) => {
    switch (status) {
      case "active":
        return "Active";
      case "pending":
        return "Pending Verification";
      case "inactive":
        return "Inactive";
      default:
        return status;
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Property
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Address
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Units
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Occupancy
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Monthly Rent
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {properties.map((property) => (
              <tr
                key={property.id}
                onClick={() => onPropertyClick?.(property)}
                className="hover:bg-gray-50 cursor-pointer transition"
              >
                <td className="px-3 sm:px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                      <Image
                        src={property.image}
                        alt={property.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {property.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-4">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="whitespace-nowrap">{property.address}</span>
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                  {property.units}
                </td>
                <td className="px-3 sm:px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                      <div
                        className="h-full bg-brand-main rounded-full"
                        style={{ width: `${property.occupancy}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-900 whitespace-nowrap">{property.occupancy}%</span>
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                  ₦{property.monthlyRent.toLocaleString()}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                      property.status
                    )}`}
                  >
                    {getStatusLabel(property.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

