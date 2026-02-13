import type { PropertyDTO } from "./properties.schema";
import type { Property } from "@/data/mockLandlordData";

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
  const address = addressParts.length > 0 
    ? addressParts.join(", ") 
    : "Address not available";

  // Determine status based on isApproved
  const status: "active" | "inactive" | "pending" = dto.isApproved
    ? "active"
    : "pending";

  // Calculate occupancy from units data
  const units = Array.isArray(dto.units) ? dto.units : [];
  const occupiedUnits = units.filter((unit: any) => !unit.isAvailable).length;
  const occupancy = units.length > 0 
    ? Math.round((occupiedUnits / units.length) * 100) 
    : 0;

  // Get image from property photos, or use default placeholder
  // Note: Backend is not currently saving property images, so we'll use a placeholder
  // When backend fixes image saving, we'll use: dto.photos[0]?.url
  let image = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop";
  if (Array.isArray(dto.photos) && dto.photos.length > 0 && dto.photos[0]?.url) {
    image = dto.photos[0].url;
  }

  // Get next due date (mock for now - will need payment API)
  const nextDue = "N/A"; // TODO: Calculate from payment data

  return {
    id: dto.id,
    name: dto.name,
    address,
    units: dto.numberOfUnits,
    occupancy,
    monthlyRent: 0, // Rent is now at unit level, not property level
    nextDue,
    status,
    image,
    amenities: dto.amenities || [],
  };
};
