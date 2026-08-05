import type { PropertyDTO } from "./properties.schema";
import type { UnitDTO } from "@/api/units/units.schema";
import {
  nightlyPriceFromOffering,
  type ServiceApartmentOfferingDTO,
} from "./serviceApartmentOffering";
import { mapPropertyDTOToPublicListingProperty } from "./mapProperty";
import {
  toStayListing,
  type StayListing,
} from "@/data/mockShortStay";

function asUnitRecord(unit: unknown): Record<string, unknown> | null {
  if (!unit || typeof unit !== "object") return null;
  return unit as Record<string, unknown>;
}

function offeringFromUnit(
  unit: Record<string, unknown>,
): ServiceApartmentOfferingDTO | null {
  const offering = unit.serviceApartmentOffering;
  if (!offering || typeof offering !== "object") return null;
  return offering as ServiceApartmentOfferingDTO;
}

function unitImageUrls(unit: Record<string, unknown>): string[] {
  const images = Array.isArray(unit.images) ? unit.images : [];
  return images
    .map((img) =>
      img && typeof img === "object" && typeof (img as { url?: string }).url === "string"
        ? (img as { url: string }).url
        : "",
    )
    .filter(Boolean);
}

function splitRules(rules: string | undefined | null): string[] {
  if (!rules?.trim()) return [];
  return rules
    .split(/\n|;|•/)
    .map((r) => r.trim())
    .filter(Boolean);
}

/**
 * Maps a property + optional unit offering into a guest StayListing.
 * When `unit` has a service-apartment offering, listingType is short_let.
 */
export const mapUnitOfferingToStayListing = (
  propertyDto: PropertyDTO,
  unit: UnitDTO | Record<string, unknown>,
): StayListing => {
  const base = mapPropertyDTOToPublicListingProperty(propertyDto);
  const record = asUnitRecord(unit) ?? {};
  const offering = offeringFromUnit(record);
  const unitId = typeof record.id === "string" ? record.id : undefined;
  const unitName =
    typeof record.name === "string" && record.name.trim()
      ? record.name.trim()
      : "Unit";
  const beds =
    typeof record.numberOfBedrooms === "number"
      ? record.numberOfBedrooms
      : undefined;
  const baths =
    typeof record.numberOfBathrooms === "number"
      ? record.numberOfBathrooms
      : undefined;
  const unitImages = unitImageUrls(record);
  const nightly = nightlyPriceFromOffering(offering);
  const minNights =
    typeof offering?.minimumStay === "number" && offering.minimumStay > 0
      ? offering.minimumStay
      : 1;
  const maxNights =
    typeof offering?.maximumStay === "number" && offering.maximumStay > 0
      ? offering.maximumStay
      : 30;
  const description =
    offering?.description?.trim() ||
    propertyDto.description?.trim() ||
    `${base.name} — ${unitName}`;
  const rules = splitRules(offering?.rules);

  const listingId = unitId ? `${propertyDto.id}__${unitId}` : propertyDto.id;

  return toStayListing(
    {
      ...base,
      id: listingId,
      name: `${base.name} — ${unitName}`,
      images: unitImages.length > 0 ? unitImages : base.images,
      image: unitImages[0] || base.image,
      monthlyRent: nightly > 0 ? nightly * 30 : base.monthlyRent,
    },
    {
      listingType: "short_let",
      pricePerNight: nightly,
      minNights,
      maxNights,
      description,
      ...(rules.length > 0 ? { houseRules: rules } : {}),
      checkOutTime: offering?.clockoutTime || "11:00",
      checkInTime: "14:00",
      beds:
        beds != null
          ? `${beds}BR${baths != null ? ` · ${baths}BA` : ""}`
          : undefined,
      unitId,
      propertyId: propertyDto.id,
    },
  );
};

/**
 * Expand a property DTO into guest cards.
 * Prefers one card per unit that has a service-apartment offering.
 * If the property is flagged open for SA but units lack offerings, returns one
 * short_let card from property-level data.
 */
export const mapPropertyDTOToStayListings = (
  propertyDto: PropertyDTO,
): StayListing[] => {
  const units = Array.isArray(propertyDto.units) ? propertyDto.units : [];
  const withOffering = units
    .map((u) => asUnitRecord(u))
    .filter((u): u is Record<string, unknown> => Boolean(u))
    .filter((u) => Boolean(offeringFromUnit(u)));

  if (withOffering.length > 0) {
    return withOffering.map((unit) =>
      mapUnitOfferingToStayListing(propertyDto, unit),
    );
  }

  if (propertyDto.isOpenForServiceApartment) {
    const base = mapPropertyDTOToPublicListingProperty(propertyDto);
    return [
      toStayListing(base, {
        listingType: "short_let",
        propertyId: propertyDto.id,
        description:
          propertyDto.description?.trim() ||
          `${base.name} available as a service apartment.`,
      }),
    ];
  }

  return [toStayListing(mapPropertyDTOToPublicListingProperty(propertyDto))];
};

/** Resolve property id from a StayListing id (`propertyId` or `property__unit`). */
export const resolvePropertyIdFromStayId = (stayId: string): string => {
  const idx = stayId.indexOf("__");
  return idx === -1 ? stayId : stayId.slice(0, idx);
};

export const resolveUnitIdFromStayId = (stayId: string): string | null => {
  const idx = stayId.indexOf("__");
  return idx === -1 ? null : stayId.slice(idx + 2);
};
