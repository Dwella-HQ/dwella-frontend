import type { UnitDTO } from "./units.schema";
import type { Unit } from "@/data/mockLandlordData";

/**
 * Maps API UnitDTO to frontend Unit type
 */
export const mapUnitDTOToUnit = (dto: UnitDTO, propertyId: string): Unit => {
  // Determine status based on isAvailable
  const status: "occupied" | "vacant" | "maintenance" = dto.isAvailable
    ? "vacant"
    : "occupied"; // TODO: Add maintenance status when available

  // Determine rent status (mock for now - will need payment API)
  const rentStatus: "paid" | "overdue" = "paid"; // TODO: Calculate from payment data

  // Get next due date (mock for now - will need payment API)
  const nextDueDate = "N/A"; // TODO: Calculate from payment data

  // Generate unit type from bedrooms/bathrooms
  const unitType = `${dto.numberOfBedrooms}BR Apt`;

  // Use unit ID as unitId
  const unitId = dto.name;

  // Default image
  const image = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop";

  return {
    id: dto.id,
    propertyId,
    unitId,
    type: unitType,
    bedrooms: dto.numberOfBedrooms,
    bathrooms: dto.numberOfBathrooms,
    size: 0, // TODO: Add size field to API if available
    floor: "N/A", // TODO: Add floor field to API if available
    monthlyRent: dto.rentAmount,
    cautionFee: 0, // TODO: Add cautionFee field to API if available
    status,
    rentStatus,
    amenities: dto.amenities && Array.isArray(dto.amenities) ? dto.amenities : [],
    image,
    tenantId: undefined, // TODO: Add tenantId when available from API
    nextDueDate,
  };
};

