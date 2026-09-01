import type { Property } from "@/data/mockLandlordData";

export type ListingType = "short_let" | "long_term";

export type StayReview = {
  id: string;
  author: string;
  dateLabel: string;
  rating: number;
  comment: string;
};

export type StayListing = Property & {
  listingType: ListingType;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  minNights: number;
  maxNights: number;
  description: string;
  houseRules: string[];
  checkInTime: string;
  checkOutTime: string;
  locationLabel: string;
  hostName: string;
  hostAvatarUrl?: string | null;
  beds?: string;
  reviews: StayReview[];
  /** Underlying property id when `id` is a composite stay listing id. */
  propertyId?: string;
  /** Unit that owns the service-apartment offering, when applicable. */
  unitId?: string;
};

/** Map a public Property into the guest StayListing shape. No demo filler. */
export const toStayListing = (
  property: Property,
  overrides?: Partial<StayListing>,
): StayListing => {
  const isShortLet =
    overrides?.listingType === "short_let" ||
    (property.propertyType || "").toLowerCase().includes("serviced") ||
    (property.name || "").toLowerCase().includes("short");

  const images =
    property.images && property.images.length > 0
      ? property.images
      : property.image
        ? [property.image]
        : [];

  return {
    ...property,
    listingType: isShortLet ? "short_let" : "long_term",
    rating: 0,
    reviewCount: 0,
    pricePerNight: isShortLet
      ? Math.max(Math.round(property.monthlyRent / 30), 0)
      : 0,
    minNights: isShortLet ? 2 : 0,
    maxNights: isShortLet ? 30 : 0,
    description: [property.name, property.address].filter(Boolean).join(" · "),
    houseRules: [],
    checkInTime: "",
    checkOutTime: "",
    locationLabel:
      property.address.split(",").slice(-2).join(",").trim() || property.address,
    hostName: property.landlordName || "Host",
    hostAvatarUrl: property.landlordAvatarUrl,
    beds: property.propertyType || undefined,
    reviews: [],
    images,
    ...overrides,
  };
};
