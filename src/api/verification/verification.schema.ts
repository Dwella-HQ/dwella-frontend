import { z } from "zod";

// Create Verification Request
export const createVerificationRequestSchema = z.object({
  landlordId: z.string().uuid(),
});

export type CreateVerificationRequestDTO = z.infer<typeof createVerificationRequestSchema>;

// Update Verification Status Request
export const updateVerificationStatusRequestSchema = z.object({
  status: z.enum(["VERIFIED", "PENDING", "REJECTED"]),
  reason: z.string().optional(),
  supportingDocumentIds: z.array(z.string().uuid()).optional(),
});

export type UpdateVerificationStatusRequestDTO = z.infer<typeof updateVerificationStatusRequestSchema>;

// Verification Response
export const verificationSchema = z.object({
  id: z.string().uuid(),
  landlordId: z.string().uuid(),
  status: z.enum(["VERIFIED", "PENDING", "REJECTED"]),
  reason: z.string().nullable(),
  supportingDocumentIds: z.array(z.string().uuid()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

export type VerificationDTO = z.infer<typeof verificationSchema>;

// Verifications Response (list)
export const verificationsResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(verificationSchema),
  message: z.string().optional(),
});

export type VerificationsResponseDTO = z.infer<typeof verificationsResponseSchema>;

// Single Verification Response
export const verificationResponseSchema = z.object({
  success: z.boolean().optional(),
  data: verificationSchema,
  message: z.string().optional(),
});

export type VerificationResponseDTO = z.infer<typeof verificationResponseSchema>;





