import {
  getPropertiesQuery,
  getProperty,
  mapPropertyDTOToStayListings,
  resolvePropertyIdFromStayId,
  resolveUnitIdFromStayId,
  mapUnitOfferingToStayListing,
  type PropertyDTO,
} from "@/api/properties";
import { getUnitsByProperty } from "@/api/units";
import { toStayListing, type StayListing } from "@/data/mockShortStay";
import { mapPropertyDTOToPublicListingProperty } from "@/api/properties/mapProperty";

async function enrichPropertyUnits(dto: PropertyDTO): Promise<PropertyDTO> {
  const nested = Array.isArray(dto.units) ? dto.units : [];
  const hasOffering = nested.some(
    (unit) =>
      unit &&
      typeof unit === "object" &&
      Boolean(
        (unit as { serviceApartmentOffering?: unknown }).serviceApartmentOffering,
      ),
  );
  if (hasOffering) return dto;

  // Public query often omits nested offerings — pull units when SA-flagged or empty.
  if (!dto.isOpenForServiceApartment && nested.length > 0) return dto;

  const unitsResult = await getUnitsByProperty(dto.id);
  if (!unitsResult.success) return dto;
  return { ...dto, units: unitsResult.data };
}

export type GuestStayCatalog = {
  listings: StayListing[];
  /** True when both catalog queries failed — show an unavailable banner. */
  unavailable: boolean;
};

/**
 * Guest browse: real service apartments + other active listings from the
 * backend. Never fills empty results with demo properties.
 */
export async function loadGuestStayListings(): Promise<GuestStayCatalog> {
  const [saResult, allResult] = await Promise.all([
    getPropertiesQuery({ isOpenForServiceApartment: true }),
    getPropertiesQuery(),
  ]);

  const saListings: StayListing[] = [];
  if (saResult.success) {
    for (const dto of saResult.data) {
      if (dto.isApproved === false) continue;
      const enriched = await enrichPropertyUnits(dto);
      saListings.push(
        ...mapPropertyDTOToStayListings(enriched).filter(
          (listing) => listing.listingType === "short_let",
        ),
      );
    }
  }

  const saPropertyIds = new Set(
    saListings.map((l) => l.propertyId || resolvePropertyIdFromStayId(l.id)),
  );

  const otherListings: StayListing[] = [];
  if (allResult.success) {
    for (const dto of allResult.data) {
      if (dto.isApproved === false) continue;
      if (saPropertyIds.has(dto.id)) continue;
      if (dto.isOpenForServiceApartment) {
        const enriched = await enrichPropertyUnits(dto);
        otherListings.push(
          ...mapPropertyDTOToStayListings(enriched).filter(
            (listing) => listing.listingType === "short_let",
          ),
        );
        continue;
      }
      otherListings.push(
        toStayListing(mapPropertyDTOToPublicListingProperty(dto)),
      );
    }
  }

  const fromApi = [...saListings, ...otherListings];
  const unavailable = !saResult.success && !allResult.success;
  return { listings: fromApi, unavailable };
}

/** Detail page: property (+ optional unit offering). */
export async function loadStayListingById(
  stayId: string,
  unitIdFromQuery?: string | null,
): Promise<{
  listing: StayListing | null;
  guestPreview: boolean;
  error: string | null;
}> {
  const propertyId = resolvePropertyIdFromStayId(stayId);
  const unitId =
    unitIdFromQuery || resolveUnitIdFromStayId(stayId) || undefined;

  const authed = await getProperty(propertyId);
  if (authed.success) {
    const enriched = await enrichPropertyUnits(authed.data);
    const listing = pickStayListing(enriched, unitId, stayId);
    return { listing, guestPreview: false, error: null };
  }

  const statusCode = "statusCode" in authed ? authed.statusCode : undefined;
  const isUnauthorized =
    authed.error === "Unauthorized" || statusCode === 401;

  if (isUnauthorized) {
    const pub = await getPropertiesQuery();
    if (pub.success) {
      const dto = pub.data.find((p) => p.id === propertyId);
      if (dto) {
        const enriched = await enrichPropertyUnits(dto);
        return {
          listing: pickStayListing(enriched, unitId, stayId),
          guestPreview: true,
          error: null,
        };
      }
    }
    return { listing: null, guestPreview: true, error: null };
  }

  return { listing: null, guestPreview: false, error: authed.error };
}

function pickStayListing(
  dto: PropertyDTO,
  unitId: string | undefined,
  stayId: string,
): StayListing {
  const listings = mapPropertyDTOToStayListings(dto);
  if (unitId) {
    const match = listings.find((l) => l.unitId === unitId);
    if (match) return match;
    const units = Array.isArray(dto.units) ? dto.units : [];
    const unit = units.find(
      (u) => u && typeof u === "object" && (u as { id?: string }).id === unitId,
    );
    if (unit) return mapUnitOfferingToStayListing(dto, unit as never);
  }
  const byStayId = listings.find((l) => l.id === stayId);
  if (byStayId) return byStayId;
  return (
    listings.find((l) => l.listingType === "short_let") ||
    listings[0] ||
    toStayListing(mapPropertyDTOToPublicListingProperty(dto))
  );
}
