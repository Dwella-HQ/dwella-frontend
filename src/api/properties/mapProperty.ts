import type { PropertyDTO } from "./properties.schema";
import type { Property } from "@/data/mockLandlordData";

function minRentFromUnits(dto: PropertyDTO): number {
  const units = Array.isArray(dto.units) ? dto.units : [];
  let min = Infinity;
  for (const u of units) {
    if (!u || typeof u !== "object") continue;
    const record = u as Record<string, unknown>;
    const raw = record.rentAmount ?? record.monthlyRent ?? record.rent;
    const n =
      typeof raw === "number"
        ? raw
        : typeof raw === "string"
          ? Number.parseFloat(raw)
          : NaN;
    if (Number.isFinite(n) && n > 0) min = Math.min(min, n);
  }
  return min === Infinity ? 0 : min;
}

/**
 * Maps API PropertyDTO to frontend Property type
 */
export const mapPropertyDTOToProperty = (dto: PropertyDTO): Property => {
  // Format address
  const addressParts = [
    dto.address?.street,
    dto.address?.city,
    dto.address?.state,
    dto.address?.country,
  ].filter(Boolean);
  const address =
    addressParts.length > 0 ? addressParts.join(", ") : "Address not available";

  // Determine status based on isApproved
  const status: "active" | "inactive" | "pending" = dto.isApproved
    ? "active"
    : "pending";

  // Calculate occupancy from units data
  const units = Array.isArray(dto.units) ? dto.units : [];
  const occupiedUnits = units.filter((unit: unknown) => {
    if (!unit || typeof unit !== "object") return false;
    const record = unit as { isAvailable?: boolean; tenant?: unknown };
    const hasTenant =
      record.tenant !== null &&
      record.tenant !== undefined &&
      typeof record.tenant === "object";
    return record.isAvailable === false || hasTenant;
  }).length;
  const occupancy =
    units.length > 0 ? Math.round((occupiedUnits / units.length) * 100) : 0;
  const totalUnits = units.length > 0 ? units.length : dto.numberOfUnits;

  // Get image from property photos array, or use default placeholder
  let image =
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop";

  // Check if photos array exists and has at least one photo with a URL
  // Photos can be in dto.photos array (from API response) or we need to check the structure
  const photos = dto.photos || [];
  if (Array.isArray(photos) && photos.length > 0) {
    // Find first photo with a valid URL
    const firstPhotoWithUrl = photos.find((photo: any) => photo?.url);
    if (firstPhotoWithUrl?.url) {
      image = firstPhotoWithUrl.url;
    }
  }

  // Get next due date (mock for now - will need payment API)
  const nextDue = "N/A"; // TODO: Calculate from payment data

  return {
    id: dto.id,
    name: dto.name,
    address,
    units: totalUnits,
    occupancy,
    monthlyRent: 0, // Rent is now at unit level, not property level
    nextDue,
    status,
    image,
    amenities: dto.amenities || [],
  };
};

/** Landing / public listings: same as {@link mapPropertyDTOToProperty} but fills monthly rent from unit `rentAmount` when present. */
export const mapPropertyDTOToPublicListingProperty = (
  dto: PropertyDTO,
): Property => {
  const base = mapPropertyDTOToProperty(dto);
  const fromUnits = minRentFromUnits(dto);
  return {
    ...base,
    monthlyRent: fromUnits > 0 ? fromUnits : base.monthlyRent,
  };
};
