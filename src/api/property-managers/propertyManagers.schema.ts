import { z } from "zod";

// Property Manager Schema
export const propertyManagerSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(), // Made optional as API may return undefined
  phone: z.string().optional().nullable(),
  userId: z.string().uuid().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type PropertyManagerDTO = z.infer<typeof propertyManagerSchema>;

// Property Managers Response
export const propertyManagersResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z.array(propertyManagerSchema),
});

export type PropertyManagersResponseDTO = z.infer<typeof propertyManagersResponseSchema>;

// Create Property Manager Request (for invite endpoint)
export const invitePropertyManagerRequestSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  propertyIds: z.array(z.string().uuid()).optional(),
  permissions: z.array(z.string()).optional(),
});

export type InvitePropertyManagerRequestDTO = z.infer<typeof invitePropertyManagerRequestSchema>;

// Create Property Manager Request (legacy, kept for backward compatibility)
export const createPropertyManagerRequestSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  propertyIds: z.array(z.string().uuid()).optional(),
  permissions: z.array(z.string()).optional(),
});

export type CreatePropertyManagerRequestDTO = z.infer<typeof createPropertyManagerRequestSchema>;

// Property Manager Invitation Response
export const propertyManagerInvitationSchema = z.object({
  email: z.string().email(),
  fullName: z.string(),
  expiresAt: z.string(),
  token: z.string(),
  phoneNumber: z.string().nullable().optional(),
  id: z.string().uuid(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  properties: z.array(z.unknown()).optional(), // Array of property objects
  landlord: z.unknown().optional(), // Landlord object
  permissions: z.array(z.string()).optional(), // Array of permission strings
});

export type PropertyManagerInvitationDTO = z.infer<typeof propertyManagerInvitationSchema>;

// Invite Property Manager Response
export const invitePropertyManagerResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: propertyManagerInvitationSchema.optional(),
});

export type InvitePropertyManagerResponseDTO = z.infer<typeof invitePropertyManagerResponseSchema>;

// Create Property Manager Response (legacy)
export const createPropertyManagerResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: propertyManagerSchema.optional(),
});

export type CreatePropertyManagerResponseDTO = z.infer<typeof createPropertyManagerResponseSchema>;

