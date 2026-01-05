import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Home, Users } from "lucide-react";
import type { Property } from "@/data/mockLandlordData";

export type PropertyCardProps = {
  property: Property;
  onClick?: () => void;
  index?: number;
};

export const PropertyCard = ({ property, onClick, index = 0 }: PropertyCardProps) => {
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
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
        {/* Status Badge */}
        <div className="absolute left-3 top-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              property.status === "active"
                ? "bg-brand-green text-white"
                : property.status === "pending"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-700 text-white"
            }`}
          >
            {property.status === "active"
              ? "Active"
              : property.status === "pending"
                ? "Pending Verification"
                : "Inactive"}
          </span>
        </div>
        {/* Amenities Overlay */}
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
        <h3 className="text-base font-bold text-gray-900">{property.name}</h3>
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
            <p className="text-sm font-semibold text-gray-900">{property.nextDue}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

