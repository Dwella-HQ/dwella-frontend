import type { PropertyDTO } from "./properties.schema";
import type { Property } from "@/data/mockLandlordData";

const DIRECT_IMAGE_URL_KEYS = [
  "url",
  "secureUrl",
  "fileUrl",
  "publicUrl",
  "location",
  "path",
  "src",
] as const;

const NESTED_IMAGE_KEYS = ["file", "image", "photo", "data"] as const;

function isUsableImageUrl(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("data:image/")
  );
}

export function extractImageUrl(value: unknown, depth = 0): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return isUsableImageUrl(trimmed) ? trimmed : null;
  }

  if (!value || typeof value !== "object" || depth > 2) return null;
  const record = value as Record<string, unknown>;

  for (const key of DIRECT_IMAGE_URL_KEYS) {
    const raw = record[key];
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (isUsableImageUrl(trimmed)) return trimmed;
    }
  }

  for (const key of NESTED_IMAGE_KEYS) {
    const nested = extractImageUrl(record[key], depth + 1);
    if (nested) return nested;
  }

  return null;
}

export function imageUrlsFromUnknown(value: unknown): string[] {
  const source = Array.isArray(value) ? value : value ? [value] : [];
  const urls = source.flatMap((item) => {
    if (Array.isArray(item)) return imageUrlsFromUnknown(item);
    const url = extractImageUrl(item);
    return url ? [url] : [];
  });
  return Array.from(new Set(urls));
}

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

function photoUrlsFromDto(dto: PropertyDTO): string[] {
  const record = dto as unknown as Record<string, unknown>;
  const candidates = [
    record.photos,
    record.images,
    record.propertyImages,
    record.propertyPhotos,
    record.coverPhoto,
    record.photo,
    record.image,
  ];

  return Array.from(
    new Set(candidates.flatMap((candidate) => imageUrlsFromUnknown(candidate))),
  );
}

function landlordDisplayName(dto: PropertyDTO): string {
  const landlord = dto.landlord;
  if (!landlord) return "Contact for details";
  return (
    landlord.landLordName?.trim() ||
    landlord.user?.fullName?.trim() ||
    "Contact for details"
  );
}

/**
 * Maps API PropertyDTO to frontend Property type
 */
export const mapPropertyDTOToProperty = (dto: PropertyDTO): Property => {
  const addressParts = [
    dto.address?.address || dto.address?.street,
    dto.address?.city,
    dto.address?.state,
    dto.address?.country,
  ].filter(Boolean);
  const address =
    addressParts.length > 0 ? addressParts.join(", ") : "Address not available";

  const status: "active" | "inactive" | "pending" = dto.isApproved
    ? "active"
    : "pending";

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

  const images = photoUrlsFromDto(dto);
  const fallbackImage =
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop";
  const image = images[0] || fallbackImage;

  const yearBuilt =
    dto.yearBuilt === null || dto.yearBuilt === undefined
      ? undefined
      : String(dto.yearBuilt);

  return {
    id: dto.id,
    name: dto.name,
    address,
    units: totalUnits,
    occupancy,
    monthlyRent: 0,
    nextDue: "N/A",
    status,
    image,
    amenities: dto.amenities || [],
    images: images.length > 0 ? images : [fallbackImage],
    yearBuilt,
    parkingSpace: dto.parkingSpace,
    propertyType: dto.propertyType ?? null,
    isOpenForServiceApartment: dto.isOpenForServiceApartment === true,
    landlordName: landlordDisplayName(dto),
    landlordAvatarUrl: dto.landlord?.profilePicture?.url ?? null,
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
