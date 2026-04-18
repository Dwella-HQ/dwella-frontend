import { z } from "zod";

/** Backend transaction rows vary — accept known keys and preserve the rest. */
export const transactionSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    reference: z.string().optional(),
    status: z.string().optional(),
    amount: z.union([z.number(), z.string()]).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export type TransactionDTO = z.infer<typeof transactionSchema>;
