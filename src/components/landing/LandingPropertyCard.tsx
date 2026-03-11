import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Building2, Users } from "lucide-react";
import type { Property } from "@/data/mockLandlordData";

type Props = { property: Property; showListCta?: boolean };

export const LandingPropertyCard = ({ property, showListCta }: Props) => {
  const showAmenities = property.amenities.slice(0, 3);
  const extra = property.amenities.length - 3;

  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md">
      <Link href={"/property/" + property.id}>
        <div className="relative aspect-[4/3] w-full bg-gray-100">
          <Image src={property.image} alt={property.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
          {property.status === "active" && (
            <span className="absolute left-3 top-3 rounded-full bg-brand-green px-2.5 py-0.5 text-xs font-medium text-white">Active</span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900">{property.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-600">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            {property.address}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {showAmenities.map((a) => (
              <span key={a} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{a}</span>
            ))}
            {extra > 0 && <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">+{extra}</span>}
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{property.units} Units</span>
            <span className="flex items-center gap-1"><Users className="h-4 w-4" />{property.occupancy}% Occupancy</span>
          </div>
          <div className="mt-4 flex justify-between border-t border-gray-100 pt-3">
            <div>
              <p className="text-xs text-gray-500">MONTHLY RENT</p>
              <p className="font-semibold text-gray-900">N{property.monthlyRent.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">NEXT DUE</p>
              <p className="font-medium text-gray-900">{property.nextDue}</p>
            </div>
          </div>
        </div>
      </Link>
      {showListCta && (
        <div className="border-t border-gray-100 p-4">
          <Link href="/auth/signup?role=landlord" className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[var(--brand-main)] bg-white py-2.5 text-sm font-medium text-[var(--brand-main)] hover:bg-[var(--brand-main-bg)]">
            List Your Property
          </Link>
        </div>
      )}
    </article>
  );
};
