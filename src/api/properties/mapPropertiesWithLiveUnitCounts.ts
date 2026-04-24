import type { Property } from "@/data/mockLandlordData";
import { getUnitsByProperty } from "@/api/units";

import type { PropertyDTO } from "./properties.schema";
import { mapPropertyDTOToProperty } from "./mapProperty";

const isOccupiedUnit = (unit: unknown): boolean => {
  if (!unit || typeof unit !== "object") return false;
  const record = unit as {
    isAvailable?: boolean;
    tenant?: unknown;
  };
  const hasTenant =
    record.tenant !== null &&
    record.tenant !== undefined &&
    typeof record.tenant === "object";
  return record.isAvailable === false || hasTenant;
};

/**
 * Normalizes property cards/stats to live unit counts from /property/{id}/units.
 * Falls back to mapped property values if units are unavailable.
 */
export const mapPropertiesWithLiveUnitCounts = async (
  dtos: PropertyDTO[],
): Promise<Property[]> => {
  return Promise.all(
    dtos.map(async (dto) => {
      const base = mapPropertyDTOToProperty(dto);

      // If property payload already embeds units, trust that snapshot.
      if (Array.isArray(dto.units) && dto.units.length > 0) {
        return base;
      }

      const unitsResult = await getUnitsByProperty(dto.id);
      if (!unitsResult.success) {
        return base;
      }

      const unitList = unitsResult.data;
      const occupied = unitList.filter((u) => isOccupiedUnit(u)).length;
      const occupancy =
        unitList.length > 0
          ? Math.round((occupied / unitList.length) * 100)
          : base.occupancy;

      return {
        ...base,
        units: unitList.length,
        occupancy,
      };
    }),
  );
};

