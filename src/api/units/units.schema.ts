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

/** PATCH /property/unit/{unitId} */
export const updateUnitRequestSchema = z.object({
  name: z.string().min(1, "Unit name is required"),
  rentAmount: z.number(),
  numberOfBedrooms: z.number().int().min(0),
  numberOfBathrooms: z.number().int().min(0),
  isAvailable: z.boolean(),
});

export type UpdateUnitRequestDTO = z.infer<typeof updateUnitRequestSchema>;

const unitTenantUserSchema = z
  .object({
    id: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    fullName: z.string().nullable().optional(),
    phoneNumber: z.string().nullable().optional(),
  })
  .passthrough();

const unitTenantSchema = z
  .object({
    id: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    user: unitTenantUserSchema.nullable().optional(),
  })
  .passthrough();

const unitImageSchema = z
  .object({
    id: z.string().optional(),
    url: z.string().optional(),
  })
  .passthrough();

const unitPricingSchema = z.object({
  mode: z.string(),
  price: z.string(),
});

export const serviceApartmentOfferingSchema = z
  .object({
    id: z.string().optional(),
    minimumStay: z.number().nullable().optional(),
    maximumStay: z.number().nullable().optional(),
    clockoutTime: z.string().optional(),
    pricing: z.array(unitPricingSchema).nullable().optional(),
    rules: z.string().optional(),
    description: z.string().optional(),
  })
  .passthrough();

export const rentOfferingSchema = z
  .object({
    id: z.string().optional(),
    gracePeriod: z.number().nullable().optional(),
    securityDeposit: z.number().nullable().optional(),
    pricing: z.array(unitPricingSchema).nullable().optional(),
  })
  .passthrough();

// Unit Response (may need to be adjusted based on actual API response)
export const unitSchema = z
  .object({
    id: z.string().uuid(),
    propertyId: z.string().uuid().optional(), // May be nested in property object
    name: z.string(),
    rentAmount: z.number().optional().default(0),
    numberOfBedrooms: z.number().int(),
    numberOfBathrooms: z.number().int(),
    isAvailable: z.boolean(),
    amenities: z.array(z.string()).nullable().optional().default([]),
    createdAt: z.string(),
    updatedAt: z.string(),
    deletedAt: z.string().nullable().optional(),
    property: z.unknown().optional(), // Nested property object (can be complex, so using unknown)
    tenant: unitTenantSchema.nullable().optional(),
    images: z.array(unitImageSchema).optional(),
    serviceApartmentOffering: serviceApartmentOfferingSchema
      .nullable()
      .optional(),
    serviceApartmentOfferingId: z.string().nullable().optional(),
    rentOffering: rentOfferingSchema.nullable().optional(),
    rentOfferingId: z.string().nullable().optional(),
  })
  .passthrough();

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
