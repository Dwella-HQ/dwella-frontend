import { z } from "zod";

export const inviteStatusSchema = z.enum([
  "pending",
  "accepted",
  "rejected",
  "expired",
]);
export type InviteStatus = z.infer<typeof inviteStatusSchema>;
export const INVITE_STATUSES: InviteStatus[] = [
  "pending",
  "accepted",
  "rejected",
  "expired",
];

const invitedTenantUnitPropertySchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
  })
  .passthrough();

const invitedTenantUnitSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    property: invitedTenantUnitPropertySchema.optional(),
  })
  .passthrough();

/** Tenant invite row from GET /tenant/invite/query */
export const invitedTenantSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform((v) => String(v)),
    email: z.string().optional(),
    fullName: z.string().optional(),
    name: z.string().optional(),
    phoneNumber: z.string().optional(),
    unitId: z.string().optional(),
    unitName: z.string().optional(),
    status: z.string().optional(),
    invitedAt: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    leaseStartDate: z.string().optional(),
    leaseEndDate: z.string().optional(),
    rentFrequency: z.string().optional(),
    rentAmount: z.number().optional(),
    securityDeposit: z.number().optional(),
    serviceCharge: z.number().optional(),
    serviceChargeFrequency: z.string().optional(),
    documentId: z.string().optional(),
    idType: z.string().optional(),
    idNumber: z.string().optional(),
    idDocumentId: z.string().optional(),
    isEmployed: z.boolean().optional(),
    employerName: z.string().optional(),
    employerContact: z.string().optional(),
    nextOfKinDetails: z.unknown().optional().nullable(),
    token: z.string().optional(),
    expiresAt: z.string().optional(),
    unit: invitedTenantUnitSchema.optional(),
  })
  .passthrough();

export type InvitedTenantDTO = z.infer<typeof invitedTenantSchema>;

export const invitedTenantsListResponseSchema = z.union([
  z.object({
    success: z.boolean().optional(),
    data: z.array(invitedTenantSchema),
    message: z.string().optional(),
  }),
  z.array(invitedTenantSchema),
]);
