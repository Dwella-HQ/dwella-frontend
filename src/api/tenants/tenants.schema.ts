import { z } from "zod";

// Create Tenant Request (using /user endpoint with roleName=tenant)
export const createTenantRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  roleName: z.literal("tenant"),
  fullName: z.string().min(1, "Full name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
});

export type CreateTenantRequestDTO = z.infer<typeof createTenantRequestSchema>;

// Update Tenant Request
export const updateTenantRequestSchema = createTenantRequestSchema.partial().extend({
  roleName: z.literal("tenant").optional(),
});

export type UpdateTenantRequestDTO = z.infer<typeof updateTenantRequestSchema>;

// Tenant Response (using user schema)
export const tenantSchema = z.object({
  id: z.string().or(z.number()),
  email: z.string().email(),
  fullName: z.string().optional(),
  name: z.string().optional(),
  phoneNumber: z.string().optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
  roleName: z.string().optional(),
  isActive: z.boolean().or(z.number()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type TenantDTO = z.infer<typeof tenantSchema>;

// Tenants Response (list)
export const tenantsResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.array(tenantSchema).or(z.object({
    users: z.array(tenantSchema),
    total: z.number().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
  })),
  message: z.string().optional(),
});

export type TenantsResponseDTO = z.infer<typeof tenantsResponseSchema>;

/** One row from `GET /tenant` (may include `user`, `leases`, `currentUnit`, etc.) */
export const tenantRecordSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
  })
  .passthrough();

export type TenantRecordDTO = z.infer<typeof tenantRecordSchema>;

// Single Tenant Response
export const tenantResponseSchema = z.object({
  success: z.boolean().optional(),
  data: tenantSchema,
  message: z.string().optional(),
});

export type TenantResponseDTO = z.infer<typeof tenantResponseSchema>;





