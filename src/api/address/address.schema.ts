import { z } from "zod";

// Create Address Request
export const createAddressRequestSchema = z.object({
  userId: z.string().uuid(),
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().optional(),
  country: z.string().default("Nigeria"),
});

export type CreateAddressRequestDTO = z.infer<typeof createAddressRequestSchema>;

// Update Address Request
export const updateAddressRequestSchema = createAddressRequestSchema.partial();

export type UpdateAddressRequestDTO = z.infer<typeof updateAddressRequestSchema>;

// Address Response
export const addressSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  street: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string().nullable(),
  country: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

export type AddressDTO = z.infer<typeof addressSchema>;

// Addresses Response (list)
export const addressesResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(addressSchema),
  message: z.string().optional(),
});

export type AddressesResponseDTO = z.infer<typeof addressesResponseSchema>;

// Single Address Response
export const addressResponseSchema = z.object({
  success: z.boolean().optional(),
  data: addressSchema,
  message: z.string().optional(),
});

export type AddressResponseDTO = z.infer<typeof addressResponseSchema>;





