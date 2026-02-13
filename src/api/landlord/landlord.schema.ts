import { z } from "zod";

// Create Landlord Request
export const createLandlordRequestSchema = z.object({
  userId: z.string().uuid(),
  landLordName: z.string().min(1, "Landlord name is required"),
  bvn: z.string().min(1, "BVN is required"),
  profilePictureId: z.string().uuid().optional(),
  govermentIdDocumentId: z.string().uuid().optional(),
  landSurveyDocumentId: z.string().uuid().optional(),
  proofOfOwnershipDocumentId: z.string().uuid().optional(),
  taxIdentificationNumberDocumentId: z.string().uuid().optional(),
  address: z.object({
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
  }),
});

export type CreateLandlordRequestDTO = z.infer<typeof createLandlordRequestSchema>;

// Landlord Response
export const landlordSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().optional(),
  landLordName: z.string(),
  bvn: z.string().optional(),
  profilePictureId: z.string().uuid().optional(),
  govermentIdDocumentId: z.string().uuid().optional(),
  landSurveyDocumentId: z.string().uuid().optional(),
  proofOfOwnershipDocumentId: z.string().uuid().optional(),
  taxIdentificationNumberDocumentId: z.string().uuid().optional(),
  user: z
    .object({
      id: z.string().uuid(),
      email: z.string().email(),
    })
    .optional(),
  address: z
    .object({
      address: z.string().optional(),
      street: z.string().nullable().optional(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string(),
    })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
});

export type LandlordDTO = z.infer<typeof landlordSchema>;

// Landlords Response (list)
export const landlordsResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(landlordSchema),
  message: z.string().optional(),
});

export type LandlordsResponseDTO = z.infer<typeof landlordsResponseSchema>;

// Single Landlord Response
export const landlordResponseSchema = z.object({
  success: z.boolean().optional(),
  data: landlordSchema,
  message: z.string().optional(),
});

// Create Landlord Response (often partial fields)
export const createLandlordResponseSchema = z.object({
  success: z.boolean().optional(),
  data: landlordSchema.partial().optional(),
  message: z.string().optional(),
});

export type LandlordResponseDTO = z.infer<typeof landlordResponseSchema>;
export type CreateLandlordResponseDTO = z.infer<typeof createLandlordResponseSchema>;





