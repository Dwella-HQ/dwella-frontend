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
export type WalletTransactionsPaginationDTO = z.infer<typeof walletTransactionsPaginationSchema>;
export type WalletTransactionsResponseDTO = z.infer<typeof walletTransactionsResponseSchema>;

