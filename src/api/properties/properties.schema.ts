import { z } from "zod";

// Address Schema
export const addressSchema = z.object({
  address: z.string(),
  street: z.string().optional().nullable(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string().optional(),
  country: z.string().default("Nigeria"),
});

export type AddressDTO = z.infer<typeof addressSchema>;

// Create Property Request
export const createPropertyRequestSchema = z.object({
  landlordId: z.string().uuid(),
  name: z.string().min(1, "Property name is required"),
  yearBuilt: z
    .string()
    .length(4, "Year must be exactly 4 characters")
    .optional(),
  numberOfUnits: z.number().int().positive(),
  description: z.string().optional(),
  parkingSpace: z.boolean().default(false),
  photoIds: z.array(z.string().uuid()).optional(),
  documentIds: z.array(z.string().uuid()).optional(),
  address: addressSchema,
  amenities: z.array(z.string()).default([]),
});

export type CreatePropertyRequestDTO = z.infer<
  typeof createPropertyRequestSchema
>;

// Update Property Request (all fields optional)
export const updatePropertyRequestSchema =
  createPropertyRequestSchema.partial();

export type UpdatePropertyRequestDTO = z.infer<
  typeof updatePropertyRequestSchema
>;

// Address Schema for Property Response (more lenient)
export const propertyAddressSchema = z.object({
  id: z.string().uuid().optional(),
  address: z.string().optional(), // Allow 'address' field to be optional
  street: z.string().nullable().optional(), // Allow 'street' field as alternative
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// File/Document Schema
export const fileSchema = z.object({
  id: z.string().uuid(),
  label: z.string().optional(),
  fileName: z.string().optional(),
  filename: z.string().optional(),
  mimeType: z.string().optional(),
  url: z.string().optional(),
  folder: z.string().optional(),
  isPublic: z.boolean().optional(),
  size: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Landlord Schema (nested in property response)
export const landlordSchema = z.object({
  id: z.string().uuid(),
  landLordName: z.string().optional(),
  isActive: z.boolean().optional(),
  isApproved: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  user: z
    .object({
      id: z.string().uuid(),
      email: z.string().optional(),
      fullName: z.string().optional(),
      phoneNumber: z.string().optional(),
      isEmailVerified: z.boolean().optional(),
      isActive: z.boolean().optional(),
    })
    .optional(),
  address: propertyAddressSchema.optional(),
  profilePicture: fileSchema.optional().nullable(),
  govermentIdDocument: fileSchema.optional().nullable(),
  landSurveyDocument: fileSchema.optional().nullable(),
  proofOfOwnershipDocument: fileSchema.optional().nullable(),
  taxIdentificationNumberDocument: fileSchema.optional().nullable(),
});

// Property Response
export const propertySchema = z
  .object({
    id: z.string().uuid(),
    landlordId: z.string().uuid().optional(), // Made optional to match create response
    name: z.string(),
    isApproved: z.boolean().optional(),
    isActive: z.boolean().optional(),
    propertyType: z.string().nullable().optional(),
    yearBuilt: z
      .union([z.number().int().positive(), z.string()])
      .nullable()
      .optional(), // Accept both number and string
    numberOfUnits: z.preprocess((val) => {
      if (val === null || val === undefined) return 0;
      const num = typeof val === "string" ? parseInt(val, 10) : Number(val);
      return isNaN(num) ? 0 : Math.max(0, Math.floor(num));
    }, z.number().int().nonnegative()), // Allow 0 for properties without units yet, handle null/undefined/string
    description: z.string().optional().nullable(),
    parkingSpace: z.boolean().optional(),
    photoIds: z.array(z.string().uuid()).optional(),
    documentIds: z.array(z.string().uuid()).optional(),
    address: propertyAddressSchema.optional(), // Made optional to match create response
    amenities: z.array(z.string()).optional().default([]),
    createdAt: z.string(),
    updatedAt: z.string(),
    deletedAt: z.string().nullable().optional(), // Made optional to match create response
    landlord: landlordSchema.optional(), // Nested landlord object
    photos: z.array(fileSchema).optional().default([]), // Array of photo files
    documents: z.array(fileSchema).optional().default([]), // Array of document files
    units: z.array(z.unknown()).optional().default([]), // Array of units (will be typed separately)
  })
  .passthrough();

export type PropertyDTO = z.infer<typeof propertySchema>;

// Properties Response (list)
export const propertiesResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(propertySchema),
  message: z.string().optional(),
});

export type PropertiesResponseDTO = z.infer<typeof propertiesResponseSchema>;

// Single Property Response
export const propertyResponseSchema = z.object({
  success: z.boolean().optional(),
  data: propertySchema,
  message: z.string().optional(),
});

export type PropertyResponseDTO = z.infer<typeof propertyResponseSchema>;

// Create Property Response (more lenient for initial creation)
export const createPropertyResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      yearBuilt: z
        .union([z.number().int().positive(), z.string()])
        .nullable()
        .optional(),
      numberOfUnits: z.number().int().min(0).optional(), // Allow 0 for initial creation
      description: z.string().optional().nullable(),
      parkingSpace: z.boolean().optional(),
      photoIds: z.array(z.string().uuid()).optional(),
      documentIds: z.array(z.string().uuid()).optional(),
      address: propertyAddressSchema.optional(),
      amenities: z.array(z.string()).optional(),
      isApproved: z.boolean().optional(),
      isActive: z.boolean().optional(),
      propertyType: z.string().nullable().optional(),
      createdAt: z.string(),
      updatedAt: z.string(),
      landlordId: z.string().uuid().optional(),
      deletedAt: z.string().nullable().optional(),
      landlord: landlordSchema.optional(),
      photos: z.array(fileSchema).optional().default([]), // Array of photo files
      documents: z.array(fileSchema).optional().default([]), // Array of document files
      units: z.array(z.unknown()).optional().default([]), // Array of units
    })
    .partial(), // Allow partial data for the 'data' object
});

export type CreatePropertyResponseDTO = z.infer<
  typeof createPropertyResponseSchema
>;

// Approve Property Response
export const approvePropertyResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: propertySchema.optional(),
});

export type ApprovePropertyResponseDTO = z.infer<
  typeof approvePropertyResponseSchema
>;
