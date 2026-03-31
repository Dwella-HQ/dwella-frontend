import { z } from "zod";

export const depositCreateSchema = z.object({
  walletId: z.string(),
  amount: z
    .number()
    .or(z.string().transform((v) => Number(v)))
    .refine((n) => !Number.isNaN(n), { message: "Invalid amount" }),
  narration: z.string().optional(),
});

export const depositItemSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    walletId: z.string().optional(),
    amount: z.union([z.number(), z.string()]).optional(),
    narration: z.string().optional(),
    reference: z.string().optional(),
    status: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    deletedAt: z.string().nullable().optional(),
  })
  .passthrough();

export type DepositCreateDTO = z.infer<typeof depositCreateSchema>;
export type DepositItemDTO = z.infer<typeof depositItemSchema>;

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number };
