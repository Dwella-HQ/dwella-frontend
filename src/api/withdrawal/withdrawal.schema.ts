import { z } from "zod";

export const withdrawalRecipientDetailsSchema = z
  .object({
    accountName: z.string().optional(),
    bankCode: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
  })
  .passthrough();

export const withdrawalCreateSchema = z.object({
  walletId: z.string(),
  amount: z
    .number()
    .or(z.string().transform((v) => Number(v)))
    .refine((n) => !Number.isNaN(n), {
      message: "Invalid amount",
    }),
  narration: z.string().optional(),
  recipientDetails: withdrawalRecipientDetailsSchema.optional(),
});

export const withdrawalResolveAccountSchema = z.object({
  accountNumber: z.string(),
  bankCode: z.string(),
});

export const withdrawalUpdateSchema = z.object({
  // Keep it flexible: backend may require different fields depending on status transitions.
  amount: z
    .number()
    .or(z.string().transform((v) => Number(v)))
    .optional(),
  narration: z.string().optional(),
  recipientDetails: withdrawalRecipientDetailsSchema.optional(),
  status: z.string().optional(),
});

export const withdrawalBankSchema = z
  .object({
    bankCode: z.string().optional(),
    bankName: z.string().optional(),
    name: z.string().optional(),
    code: z.string().optional(),
  })
  .passthrough();

export const withdrawalItemSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    walletId: z.string().optional(),
    amount: z.union([z.number(), z.string()]).optional(),
    narration: z.string().optional(),
    recipientDetails: withdrawalRecipientDetailsSchema.optional(),
    status: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export type WithdrawalRecipientDetailsDTO = z.infer<
  typeof withdrawalRecipientDetailsSchema
>;
export type WithdrawalCreateDTO = z.infer<typeof withdrawalCreateSchema>;
export type WithdrawalResolveAccountDTO = z.infer<
  typeof withdrawalResolveAccountSchema
>;
export type WithdrawalUpdateDTO = z.infer<typeof withdrawalUpdateSchema>;
export type WithdrawalBankDTO = z.infer<typeof withdrawalBankSchema>;
export type WithdrawalItemDTO = z.infer<typeof withdrawalItemSchema>;

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number };
