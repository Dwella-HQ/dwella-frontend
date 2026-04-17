import { z } from "zod";

// GET /rent-payment — flexible item shape (backend may use snake_case or nested objects)
export const rentPaymentItemSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    propertyId: z.string().optional(),
    property_id: z.string().optional(),
    unitId: z.string().optional(),
    unit_id: z.string().optional(),
    tenantId: z.string().optional(),
    tenant_id: z.string().optional(),
    propertyName: z.string().optional(),
    property_name: z.string().optional(),
    tenantName: z.string().optional(),
    tenant_name: z.string().optional(),
    unit: z.any().optional(),
    unitNumber: z.string().optional(),
    unit_number: z.string().optional(),
    amount: z.any().optional(),
    paidAmount: z.any().optional(),
    paid_amount: z.any().optional(),
    total: z.any().optional(),
    paidAt: z.string().optional(),
    paid_at: z.string().optional(),
    paymentDate: z.string().optional(),
    payment_date: z.string().optional(),
    dueDate: z.string().optional(),
    due_date: z.string().optional(),
    createdAt: z.string().optional(),
    created_at: z.string().optional(),
    property: z.any().optional(),
    tenant: z.any().optional(),
  })
  .passthrough();

export type RentPaymentItemDTO = z.infer<typeof rentPaymentItemSchema>;
