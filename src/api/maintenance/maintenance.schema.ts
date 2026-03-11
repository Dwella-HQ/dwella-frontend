import { z } from "zod";

// API response item - flexible to match backend shape
const maintenanceRequestItemSchema = z
  .object({
    id: z.string(),
    requestId: z.string().optional(),
    request_id: z.string().optional(),
    propertyId: z.string().uuid().optional(),
    property_id: z.string().optional(),
    propertyName: z.string().optional(),
    property_name: z.string().optional(),
    unitId: z.string().uuid().optional(),
    unit_id: z.string().optional(),
    unit: z.any().optional(),
    tenantId: z.string().uuid().optional(),
    tenant_id: z.string().optional(),
    tenantName: z.string().optional(),
    tenant_name: z.string().optional(),
    level: z.string().optional(),
    type: z.any().optional(),
    subType: z.any().optional(),
    sub_type: z.string().optional(),
    priority: z
      .enum(["low", "medium", "high", "LOW", "MEDIUM", "HIGH"])
      .optional(),
    status: z.string().optional(),
    title: z.string().optional(),
    reportedTime: z.string().optional(),
    reported_time: z.string().optional(),
    createdAt: z.string().optional(),
    created_at: z.string().optional(),
    description: z.string().optional(),
    supportingFileIds: z.array(z.string()).optional(),
    supporting_file_ids: z.array(z.string()).optional(),
  })
  .passthrough();

export type MaintenanceRequestItemDTO = z.infer<
  typeof maintenanceRequestItemSchema
>;

export const maintenanceRequestsResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z.array(maintenanceRequestItemSchema).optional().default([]),
});

export type MaintenanceRequestsResponseDTO = z.infer<
  typeof maintenanceRequestsResponseSchema
>;

// Maintenance request types (GET /maintenance-request-types)
export const maintenanceRequestSubTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const maintenanceRequestTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  subTypes: z.array(maintenanceRequestSubTypeSchema).optional().default([]),
});

export type MaintenanceRequestSubTypeDTO = z.infer<
  typeof maintenanceRequestSubTypeSchema
>;

export type MaintenanceRequestTypeDTO = z.infer<
  typeof maintenanceRequestTypeSchema
>;

export const maintenanceRequestTypesResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z.array(maintenanceRequestTypeSchema).optional().default([]),
});

export type MaintenanceRequestTypesResponseDTO = z.infer<
  typeof maintenanceRequestTypesResponseSchema
>;

// Create / Update body (POST /maintenance-request, PATCH /maintenance-request/{id})
export const maintenanceRequestCreateSchema = z.object({
  propertyId: z.string().uuid().optional(),
  unitId: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
  level: z.enum(["PROPERTY", "UNIT"]).optional(),
  type: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  subType: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  supportingFileIds: z.array(z.string().uuid()).optional(),
});

export type MaintenanceRequestCreateDTO = z.infer<
  typeof maintenanceRequestCreateSchema
>;

// PATCH /maintenance-request/{id}/status
export const maintenanceRequestStatusSchema = z.object({
  status: z.string().min(1),
});

export type MaintenanceRequestStatusDTO = z.infer<
  typeof maintenanceRequestStatusSchema
>;
