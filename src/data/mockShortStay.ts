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

const VILLA_IMAGES = [
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
];

const DEFAULT_AMENITIES = [
  "24/7 Power",
  "Security Gate",
  "Water Treatment",
  "Covered Parking",
  "Fiber Internet",
];

const DEFAULT_RULES = [
  "No parties or events",
  "No smoking",
  "Pets allowed on request",
];

const DEFAULT_REVIEWS: StayReview[] = [
  {
    id: "r1",
    author: "Adebayo S.",
    dateLabel: "June 2026",
    rating: 5,
    comment:
      "Absolutely stunning view and top-notch service. The host was very responsive.",
  },
  {
    id: "r2",
    author: "Chioma O.",
    dateLabel: "May 2026",
    rating: 5,
    comment:
      "Clean space, reliable power, and check-in was seamless. Would stay again.",
  },
  {
    id: "r3",
    author: "Tunde A.",
    dateLabel: "April 2026",
    rating: 4,
    comment:
      "Great location and amenities. Exact spot shared after booking as promised.",
  },
];

export const mockShortStayListings: StayListing[] = [
  {
    id: "stay-harmony-court",
    name: "Harmony Court — 3BR Duplex",
    address: "12 Iroko Street, Uyo, Akwa Ibom",
    units: 1,
    occupancy: 0,
    monthlyRent: 450000,
    nextDue: "—",
    status: "active",
    image: VILLA_IMAGES[0],
    images: VILLA_IMAGES,
    amenities: DEFAULT_AMENITIES,
    yearBuilt: "2018",
    parkingSpace: true,
    propertyType: "Duplex",
    landlordName: "Farouk Uche",
    listingType: "short_let",
    rating: 4.9,
    reviewCount: 128,
    pricePerNight: 150000,
    minNights: 2,
    maxNights: 30,
    description:
      "Experience luxury living in the heart of Victoria Island. This penthouse offers breathtaking ocean views, premium furnishings, and 24/7 power and security.",
    houseRules: DEFAULT_RULES,
    checkInTime: "14:00",
    checkOutTime: "11:00",
    locationLabel: "Victoria Island, Lagos",
    hostName: "Farouk Uche",
    beds: "3BR",
    reviews: DEFAULT_REVIEWS,
  },
  {
    id: "stay-lekki-haven",
    name: "Lekki Haven — Serviced Apartment",
    address: "15 Lake Shore, Lekki Phase 1, Lagos",
    units: 1,
    occupancy: 0,
    monthlyRent: 380000,
    nextDue: "—",
    status: "active",
    image: VILLA_IMAGES[1],
    images: [VILLA_IMAGES[1], VILLA_IMAGES[0], VILLA_IMAGES[2]],
    amenities: [
      "24/7 Power",
      "Fiber Internet",
      "Security Gate",
      "Water Treatment",
      "Gym Access",
    ],
    yearBuilt: "2021",
    parkingSpace: true,
    propertyType: "Serviced Apartment",
    landlordName: "Samuel Adebayo",
    listingType: "short_let",
    rating: 4.8,
    reviewCount: 86,
    pricePerNight: 120000,
    minNights: 1,
    maxNights: 21,
    description:
      "A bright serviced apartment in Lekki Phase 1 with workspace-ready internet, pool access, and daily housekeeping on request.",
    houseRules: DEFAULT_RULES,
    checkInTime: "15:00",
    checkOutTime: "11:00",
    locationLabel: "Lekki Phase 1, Lagos",
    hostName: "Samuel Adebayo",
    beds: "2BR",
    reviews: DEFAULT_REVIEWS,
  },
  {
    id: "stay-abuja-loft",
    name: "Maitama Loft — 2 Bedroom Flat",
    address: "7 Aguiyi Ironsi Street, Maitama, Abuja",
    units: 1,
    occupancy: 0,
    monthlyRent: 520000,
    nextDue: "—",
    status: "active",
    image: VILLA_IMAGES[2],
    images: [VILLA_IMAGES[2], VILLA_IMAGES[3], VILLA_IMAGES[0]],
    amenities: [
      "24/7 Power",
      "Security Gate",
      "Covered Parking",
      "Fiber Internet",
      "Smart TV",
    ],
    yearBuilt: "2019",
    parkingSpace: true,
    propertyType: "2 Bedroom Flat",
    landlordName: "Ngozi Eze",
    listingType: "short_let",
    rating: 4.7,
    reviewCount: 54,
    pricePerNight: 95000,
    minNights: 2,
    maxNights: 14,
    description:
      "Quiet Maitama loft with designer interiors, covered parking, and walkable access to cafes and embassies.",
    houseRules: DEFAULT_RULES,
    checkInTime: "14:00",
    checkOutTime: "12:00",
    locationLabel: "Maitama, Abuja",
    hostName: "Ngozi Eze",
    beds: "2BR",
    reviews: DEFAULT_REVIEWS,
  },
  {
    id: "stay-ph-self-contain",
    name: "Garden City Studio — Self Contain",
    address: "22 Azikiwe Road, Port Harcourt",
    units: 1,
    occupancy: 0,
    monthlyRent: 180000,
    nextDue: "—",
    status: "active",
    image: VILLA_IMAGES[3],
    images: [VILLA_IMAGES[3], VILLA_IMAGES[1], VILLA_IMAGES[2]],
    amenities: ["24/7 Power", "Water Treatment", "Security Gate", "Kitchenette"],
    yearBuilt: "2020",
    parkingSpace: false,
    propertyType: "Self Contain",
    landlordName: "Ifeanyi Okoro",
    listingType: "short_let",
    rating: 4.5,
    reviewCount: 31,
    pricePerNight: 45000,
    minNights: 1,
    maxNights: 30,
    description:
      "Compact self-contain perfect for solo travelers — reliable power, treated water, and a kitchenette for short stays.",
    houseRules: ["No parties or events", "No smoking", "Quiet hours after 10pm"],
    checkInTime: "13:00",
    checkOutTime: "11:00",
    locationLabel: "Port Harcourt, Rivers",
    hostName: "Ifeanyi Okoro",
    beds: "Studio",
    reviews: DEFAULT_REVIEWS,
  },
  {
    id: "rent-ikeja-flat",
    name: "Allen Avenue Residence — 3 Bedroom Flat",
    address: "45 Allen Avenue, Ikeja, Lagos",
    units: 12,
    occupancy: 75,
    monthlyRent: 650000,
    nextDue: "05 Aug 2026",
    status: "active",
    image: VILLA_IMAGES[1],
    images: [VILLA_IMAGES[1], VILLA_IMAGES[2]],
    amenities: ["24/7 Power", "Security Gate", "Water Treatment", "Elevator"],
    yearBuilt: "2016",
    parkingSpace: true,
    propertyType: "3 Bedroom Flat",
    landlordName: "Kemi Balogun",
    listingType: "long_term",
    rating: 4.6,
    reviewCount: 22,
    pricePerNight: 0,
    minNights: 0,
    maxNights: 0,
    description:
      "Spacious long-term flat in Ikeja with steady power backup and gated security — ideal for families relocating to Lagos.",
    houseRules: ["No subletting without approval", "No smoking indoors"],
    checkInTime: "—",
    checkOutTime: "—",
    locationLabel: "Ikeja, Lagos",
    hostName: "Kemi Balogun",
    beds: "3BR",
    reviews: DEFAULT_REVIEWS.slice(0, 2),
  },
  {
    id: "rent-enugu-duplex",
    name: "Independence Layout Duplex",
    address: "9 Nike Road, Independence Layout, Enugu",
    units: 4,
    occupancy: 50,
    monthlyRent: 420000,
    nextDue: "12 Aug 2026",
    status: "active",
    image: VILLA_IMAGES[0],
    images: [VILLA_IMAGES[0], VILLA_IMAGES[3]],
    amenities: ["Security Gate", "24/7 Power", "Covered Parking", "Garden"],
    yearBuilt: "2015",
    parkingSpace: true,
    propertyType: "Duplex",
    landlordName: "Chinedu Nwosu",
    listingType: "long_term",
    rating: 4.4,
    reviewCount: 12,
    pricePerNight: 0,
    minNights: 0,
    maxNights: 0,
    description:
      "Family duplex on a quiet Enugu street with covered parking and a private garden. Available for annual lease.",
    houseRules: ["No parties or events", "Pets allowed on request"],
    checkInTime: "—",
    checkOutTime: "—",
    locationLabel: "Independence Layout, Enugu",
    hostName: "Chinedu Nwosu",
    beds: "4BR",
    reviews: DEFAULT_REVIEWS.slice(0, 1),
  },
];

export const getMockStayById = (id: string): StayListing | undefined =>
  mockShortStayListings.find((listing) => listing.id === id);

/** Enrich a public Property with short-stay mock fields for UI before APIs land. */
export const toStayListing = (
  property: Property,
  overrides?: Partial<StayListing>,
): StayListing => {
  const mock = getMockStayById(property.id);
  if (mock) return { ...mock, ...overrides };

  const isShortLet =
    overrides?.listingType === "short_let" ||
    (property.propertyType || "").toLowerCase().includes("serviced") ||
    (property.name || "").toLowerCase().includes("short");

  return {
    ...property,
    listingType: isShortLet ? "short_let" : "long_term",
    rating: 4.6,
    reviewCount: 18,
    pricePerNight: isShortLet
      ? Math.max(Math.round(property.monthlyRent / 30), 35000)
      : 0,
    minNights: isShortLet ? 2 : 0,
    maxNights: isShortLet ? 30 : 0,
    description:
      property.name +
      " in " +
      property.address +
      ". Premium furnishings, reliable utilities, and responsive host support.",
    houseRules: DEFAULT_RULES,
    checkInTime: "14:00",
    checkOutTime: "11:00",
    locationLabel: property.address.split(",").slice(-2).join(",").trim() || property.address,
    hostName: property.landlordName || "Host",
    hostAvatarUrl: property.landlordAvatarUrl,
    beds: property.propertyType || undefined,
    reviews: DEFAULT_REVIEWS,
    images:
      property.images && property.images.length > 0
        ? property.images
        : [property.image, ...VILLA_IMAGES.slice(0, 2)],
    ...overrides,
  };
};
