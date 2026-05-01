import { z } from "zod";

export const rentItemSchema = z
  .object({
    id: z.string(),
    leaseId: z.string(),
    amount: z.number(),
    lateFee: z.number().optional().default(0),
    totalAmount: z.number().optional(),
    currency: z.string().optional(),
    status: z.string().optional(),
    paymentDate: z.string().nullable().optional(),
    startDate: z.string(),
    endDate: z.string(),
    dueDate: z.string(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export const rentsResponseSchema = z
  .object({
    success: z.boolean().optional(),
    message: z.string().optional(),
    data: z.union([z.array(rentItemSchema), rentItemSchema]).optional(),
  })
  .passthrough();

export const createRentRequestSchema = z.object({
  leaseId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  dueDate: z.string(),
  amount: z.number(),
});

export const createRentResponseSchema = z
  .object({
    success: z.boolean().optional(),
    message: z.string().optional(),
    data: rentItemSchema.optional(),
  })
  .passthrough();

export type RentItemDTO = z.infer<typeof rentItemSchema>;
export type CreateRentRequestDTO = z.infer<typeof createRentRequestSchema>;
