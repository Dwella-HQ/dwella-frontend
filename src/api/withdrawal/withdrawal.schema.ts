import { z } from "zod";

export const withdrawalRecipientDetailsSchema = z
  .object({
    accountName: z.string().optional(),
    /** Some responses use fullName (TransferUserDetails) instead of accountName. */
    fullName: z.string().optional(),
    bankCode: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
  })
  .passthrough();

const amountMin = 0.01;

export const withdrawalCreateSchema = z.object({
  walletId: z.string(),
  amount: z
    .number()
    .or(z.string().transform((v) => Number(v)))
    .refine((n) => !Number.isNaN(n), {
      message: "Invalid amount",
    })
    .refine((n) => n >= amountMin, {
      message: `Amount must be at least ${amountMin}`,
    }),
  narration: z.string().optional(),
});

export const withdrawalResolveAccountSchema = z.object({
  accountNumber: z.string(),
  bankCode: z.string(),
});

const optionalWithdrawalAmount = z
  .union([z.number(), z.string().transform((v) => Number(v))])
  .refine((n) => !Number.isNaN(n) && n >= amountMin, {
    message: `Amount must be at least ${amountMin}`,
  });

export const withdrawalUpdateSchema = z.object({
  walletId: z.string().optional(),
  amount: optionalWithdrawalAmount.optional(),
  narration: z.string().optional(),
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
