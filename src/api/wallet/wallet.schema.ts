import { z } from "zod";

export const walletTransactionSchema = z.object({
  id: z.number(),
  type: z.enum(["credit", "debit"]),
  description: z.string(),
  partner_id: z.number(),
  email: z.string(),
  amount: z.string(),
  prev_balance: z.string(),
  curr_balance: z.string(),
  confirmed: z.boolean(),
  reference: z.string(),
  genus: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

export const walletTransactionsPaginationSchema = z.object({
  prevPage: z.number().nullable(),
  currentPage: z.number(),
  nextPage: z.number().nullable(),
  pageTotal: z.number(),
  pageSize: z.number(),
});

export const walletTransactionsResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  data: z.object({
    total: z.number(),
    pagination: walletTransactionsPaginationSchema,
    transactions: z.array(walletTransactionSchema),
  }),
});

export type WalletTransactionDTO = z.infer<typeof walletTransactionSchema>;
export type WalletTransactionsPaginationDTO = z.infer<
  typeof walletTransactionsPaginationSchema
>;
export type WalletTransactionsResponseDTO = z.infer<
  typeof walletTransactionsResponseSchema
>;

const stringOrNumberToString = z
  .union([z.string(), z.number()])
  .transform((v) => String(v));

/** Saved payout account the backend uses for withdrawals (see TransferUserDetails). */
export const walletWithdrawalDetailsSchema = z
  .object({
    fullName: z.string().optional(),
    email: z.string().optional(),
    bankCode: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
  })
  .passthrough();

// Wallet Schema
export const walletSchema = z
  .object({
    id: z.string().uuid(),
    // Backend sometimes returns landlordId, sometimes landlord.id.
    landlordId: z.string().uuid().optional(),
    landlord: z
      .object({
        id: z.string().uuid().optional(),
      })
      .optional()
      .nullable(),
    bvn: z
      .string()
      .nullish()
      .transform((value) => value ?? ""),
    currency: z.string().default("NGN"),
    balance: stringOrNumberToString.optional(),
    escrowBalance: stringOrNumberToString.optional(),
    withdrawalDetails: walletWithdrawalDetailsSchema.optional().nullable(),
    isActive: z.boolean().default(true),
    createdAt: z.string(),
    updatedAt: z.string(),
    deletedAt: z.string().nullish(),
  })
  .transform((w) => ({
    ...w,
    landlordId: w.landlordId ?? w.landlord?.id,
  }));

export const walletResponseSchema = z.object({
  success: z.boolean().optional(),
  data: walletSchema,
  message: z.string().optional(),
});

export type WalletDTO = z.infer<typeof walletSchema>;
export type WalletResponseDTO = z.infer<typeof walletResponseSchema>;
