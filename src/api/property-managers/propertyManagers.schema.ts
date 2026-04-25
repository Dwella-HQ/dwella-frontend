import { z } from "zod";

// User nested in property manager response
const propertyManagerUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional().nullable(),
  fullName: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  role: z.object({ id: z.string(), name: z.string() }).optional(),
});

// Profile picture (landlord card avatar)
const profilePictureRefSchema = z
  .object({
    id: z.string().uuid(),
    url: z.string().url(),
  })
  .optional()
  .nullable();

// Landlord nested in property manager response (for select-landlord flow)
export const propertyManagerLandlordSchema = z.object({
  id: z.string().uuid(),
  landLordName: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  profilePicture: profilePictureRefSchema,
  user: z
    .object({
      id: z.string().uuid(),
      email: z.string().email().optional().nullable(),
      fullName: z.string().optional().nullable(),
      phoneNumber: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});
export type PropertyManagerLandlordDTO = z.infer<
  typeof propertyManagerLandlordSchema
>;

// Property Manager Schema (matches API: id, user, landlord, permissions, etc.)
export const propertyManagerSchema = z
  .object({
    id: z.string().uuid(),
    fullName: z.string().optional(),
    name: z.string().optional(),
    email: z.union([z.string().email(), z.null()]).optional(),
    phone: z.string().optional().nullable(),
    userId: z.string().uuid().optional(),
    user: propertyManagerUserSchema.optional().nullable(),
    permissions: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    landlord: propertyManagerLandlordSchema.optional().nullable(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export type PropertyManagerDTO = z.infer<typeof propertyManagerSchema>;

// Property Managers Response (API may return array directly or { data: array })
export const propertyManagersResponseSchema = z.union([
  z.array(propertyManagerSchema),
  z.object({
    success: z.boolean().optional(),
    message: z.string().optional(),
    data: z.array(propertyManagerSchema),
  }),
]);

export type PropertyManagersResponseDTO = z.infer<
  typeof propertyManagersResponseSchema
>;

// Create Property Manager Request (for invite endpoint)
export const invitePropertyManagerRequestSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  propertyIds: z.array(z.string().uuid()).optional(),
  permissions: z.array(z.string()).optional(),
});

export type InvitePropertyManagerRequestDTO = z.infer<
  typeof invitePropertyManagerRequestSchema
>;

// Create Property Manager Request (legacy, kept for backward compatibility)
export const createPropertyManagerRequestSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  propertyIds: z.array(z.string().uuid()).optional(),
  permissions: z.array(z.string()).optional(),
});

export type CreatePropertyManagerRequestDTO = z.infer<
  typeof createPropertyManagerRequestSchema
>;

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

export type PropertyManagerInvitationDTO = z.infer<
  typeof propertyManagerInvitationSchema
>;

// Invite Property Manager Response
export const invitePropertyManagerResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: propertyManagerInvitationSchema.optional(),
});

export type InvitePropertyManagerResponseDTO = z.infer<
  typeof invitePropertyManagerResponseSchema
>;

// Create Property Manager Response (legacy)
export const createPropertyManagerResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: propertyManagerSchema.optional(),
});

export type CreatePropertyManagerResponseDTO = z.infer<
  typeof createPropertyManagerResponseSchema
>;
