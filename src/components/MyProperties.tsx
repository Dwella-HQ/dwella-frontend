import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { MapPin, Home, Users } from "lucide-react";
import type { Property } from "@/data/mockLandlordData";

export type MyPropertiesProps = {
  properties: Property[];
  onViewAll?: () => void;
};

export const MyProperties = ({ properties, onViewAll }: MyPropertiesProps) => {
  const router = useRouter();

  return (
    // <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="pt-4 flex flex-col gap-4">
      <div className="flex items-center justify-between py-4">
        <h2 className="text-lg font-bold text-gray-900">My Properties</h2>
        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="text-sm font-medium text-brand-main hover:text-brand-main/80 transition"
          >
            View All
          </button>
        ) : (
          <Link
            href="/dashboard/properties"
            className="text-sm font-medium text-brand-main hover:text-brand-main/80 transition"
          >
            View All
          </Link>
        )}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:gap-10 lg:grid-cols-3">
        {properties.map((property, index) => (
          <motion.div
            key={property.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/dashboard/properties/${property.id}`)}
            className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md"
          >
            <motion.div
              className="relative min-h-52 w-full overflow-hidden bg-gray-200"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <Image
                src={property.image}
                alt={property.name}
                fill
                className="object-cover"
              />
              <div className="absolute left-3 top-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-bold ${
                    property.status === "active"
                      ? "text-white bg-brand-green"
                      : property.status === "pending"
                        ? "text-white bg-yellow-700"
                        : "text-white bg-gray-700"
                  }`}
                >
                  {property.status.charAt(0).toUpperCase() +
                    property.status.slice(1)}
                </span>
              </div>
              <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
                {property.amenities.slice(0, 3).map((amenity, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-gray-900/40 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm"
                  >
                    {amenity}
                  </span>
                ))}
                {property.amenities.length > 3 && (
                  <span className="rounded-full bg-gray-900/40 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    +{property.amenities.length - 3}
                  </span>
                )}
              </div>
            </motion.div>
            <div className="p-4 flex flex-col gap-1">
              <h3 className="text-base font-bold text-gray-900">
                {property.name}
              </h3>
              <div className="mt-2 flex items-center gap-1 text-sm font-normal text-gray-500">
                <MapPin className="h-4 w-4" />
                <span className="line-clamp-1">{property.address}</span>
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  <Home className="h-4 w-4" />
                  <span>{property.units} Units</span>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                  <Users className="h-4 w-4" />
                  <span>{property.occupancy}% Occupancy</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-gray-500">MONTHLY RENT</p>
                  <p className="text-sm font-semibold text-gray-900">
                    ₦{property.monthlyRent.toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col gap-2 text-right">
                  <p className="text-xs text-gray-500">NEXT DUE</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {property.nextDue}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
