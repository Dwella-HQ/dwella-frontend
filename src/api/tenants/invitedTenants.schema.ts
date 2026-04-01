import { z } from "zod";

/** Pending / invited tenant row from GET /property/{propertyId}/tenant-invites */
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
