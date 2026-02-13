import { z } from "zod";

// Create Unit Request (from property endpoint)
export const createUnitRequestSchema = z.object({
  name: z.string().min(1, "Unit name is required"),
  rentAmount: z.number().positive(),
  numberOfBedrooms: z.number().int().positive(),
  numberOfBathrooms: z.number().int().positive(),
  isAvailable: z.boolean().default(true),
  amenities: z.array(z.string()).optional().default([]),
});

export type CreateUnitRequestDTO = z.infer<typeof createUnitRequestSchema>;

// Unit Response (may need to be adjusted based on actual API response)
export const unitSchema = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid().optional(), // May be nested in property object
  name: z.string(),
  rentAmount: z.number(),
  numberOfBedrooms: z.number().int(),
  numberOfBathrooms: z.number().int(),
  isAvailable: z.boolean(),
  amenities: z.array(z.string()).nullable().optional().default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
  property: z.unknown().optional(), // Nested property object (can be complex, so using unknown)
});

export type UnitDTO = z.infer<typeof unitSchema>;

// Units Response (list)
export const unitsResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(unitSchema),
  message: z.string().optional(),
});

export type UnitsResponseDTO = z.infer<typeof unitsResponseSchema>;

// Single Unit Response
export const unitResponseSchema = z.object({
  success: z.boolean().optional(),
  data: unitSchema,
  message: z.string().optional(),
});

export type UnitResponseDTO = z.infer<typeof unitResponseSchema>;





