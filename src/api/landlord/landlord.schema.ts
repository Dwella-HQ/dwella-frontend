import { z } from "zod";

// Create Landlord Request — OpenAPI now only requires userId.
// KYC/KYB/profile/bank are separate endpoints.
export const createLandlordRequestSchema = z.object({
  userId: z.string().uuid(),
});

export type CreateLandlordRequestDTO = z.infer<
  typeof createLandlordRequestSchema
>;

// Profile picture / file reference (from get landlord by user response)
const profilePictureSchema = z
  .object({
    id: z.string().uuid(),
    url: z.string().url(),
    label: z.string().optional(),
    fileName: z.string().optional(),
    mimeType: z.string().optional(),
  })
  .optional()
  .nullable();

const documentFileSchema = z
  .object({
    id: z.string().uuid().optional(),
    url: z.string().url().optional(),
    fileName: z.string().optional(),
    label: z.string().optional(),
    mimeType: z.string().optional(),
  })
  .passthrough()
  .optional()
  .nullable();

// Landlord Response
export const landlordSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().optional(),
  businessName: z.string().nullish(),
  businessEmail: z.string().nullish(),
  businessPhoneNumber: z.string().nullish(),
  verificationStatus: z
    .union([z.enum(["PENDING", "VERIFIED", "REJECTED"]), z.string()])
    .nullish(),
  approvalStatus: z.string().nullish(),
  // Some responses omit this field; normalize to empty string so parsing stays stable.
  landLordName: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  bvn: z.string().optional(),
  isApproved: z.boolean().optional(),
  isActive: z.boolean().optional(),
  profilePictureId: z.string().uuid().optional(),
  profilePicture: profilePictureSchema,
  govermentIdDocumentId: z.string().uuid().optional(),
  landSurveyDocumentId: z.string().uuid().optional(),
  proofOfOwnershipDocumentId: z.string().uuid().optional(),
  taxIdentificationNumberDocumentId: z.string().uuid().optional(),
  govermentIdDocument: documentFileSchema,
  governmentIdDocument: documentFileSchema,
  landSurveyDocument: documentFileSchema,
  proofOfOwnershipDocument: documentFileSchema,
  taxIdentificationNumberDocument: documentFileSchema,
  user: z
    .object({
      id: z.string().uuid(),
      email: z.string().email(),
      fullName: z.string().optional(),
      phoneNumber: z.string().nullable().optional(),
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
  bankAccount: z
    .object({
      accountName: z.string().optional(),
      accountNumber: z.string().optional(),
      accountCode: z.string().optional(),
      bankName: z.string().optional(),
      bankCode: z.string().optional(),
      bvn: z.string().optional(),
    })
    .optional()
    .nullable(),
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
export type CreateLandlordResponseDTO = z.infer<
  typeof createLandlordResponseSchema
>;
