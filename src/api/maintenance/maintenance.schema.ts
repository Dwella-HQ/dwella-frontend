import { z } from "zod";

// API response item - flexible to match backend shape
const maintenanceRequestItemSchema = z.object({
  id: z.string(),
  requestId: z.string().optional(),
  request_id: z.string().optional(),
  propertyName: z.string().optional(),
  property_name: z.string().optional(),
  unit: z.string().optional(),
  tenantName: z.string().optional(),
  tenant_name: z.string().optional(),
  type: z.string().optional(),
  subType: z.string().optional(),
  sub_type: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.string().optional(),
  reportedTime: z.string().optional(),
  reported_time: z.string().optional(),
  createdAt: z.string().optional(),
  created_at: z.string().optional(),
  description: z.string().optional(),
}).passthrough();

export type MaintenanceRequestItemDTO = z.infer<typeof maintenanceRequestItemSchema>;

export const maintenanceRequestsResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z.array(maintenanceRequestItemSchema).optional().default([]),
});

export type MaintenanceRequestsResponseDTO = z.infer<typeof maintenanceRequestsResponseSchema>;
