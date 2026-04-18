import { z } from "zod";

export const verificationStatusEnum = z.enum([
  "VERIFIED",
  "PENDING",
  "REJECTED",
]);

// Create Verification Request (POST landlord/property — unused when those routes fail)
export const createVerificationRequestSchema = z.object({
  landlordId: z.string().uuid(),
});

export type CreateVerificationRequestDTO = z.infer<
  typeof createVerificationRequestSchema
>;

export const updateVerificationStatusRequestSchema = z.object({
  status: verificationStatusEnum,
  reason: z.string().optional(),
  supportingDocumentIds: z.array(z.string().uuid()).optional(),
});

export type UpdateVerificationStatusRequestDTO = z.infer<
  typeof updateVerificationStatusRequestSchema
>;

/** Backend shapes differ between landlord vs property verification rows — keep tolerant. */
export const verificationSchema = z
  .object({
    id: z.string(),
    landlordId: z.string().nullable().optional(),
    propertyId: z.string().nullable().optional(),
    /** e.g. `LANDLORD_VERIFICATION` | `PROPERTY_VERIFICATION` */
    type: z.string().optional(),
    status: z.union([verificationStatusEnum, z.string()]),
    verifiedAt: z.string().nullable().optional(),
    reason: z.string().nullable().optional(),
    supportingDocumentIds: z.array(z.string()).optional(),
    supportingDocuments: z.array(z.unknown()).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    deletedAt: z.string().nullable().optional(),
    landlord: z.unknown().nullable().optional(),
    property: z.unknown().nullable().optional(),
    verifiedBy: z.unknown().nullable().optional(),
  })
  .passthrough();

export type VerificationDTO = z.infer<typeof verificationSchema>;

export const verificationsResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(verificationSchema),
  message: z.string().optional(),
});

export type VerificationsResponseDTO = z.infer<
  typeof verificationsResponseSchema
>;

export const verificationResponseSchema = z.object({
  success: z.boolean().optional(),
  data: verificationSchema,
  message: z.string().optional(),
});

export type VerificationResponseDTO = z.infer<
  typeof verificationResponseSchema
>;
