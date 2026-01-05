import { z } from "zod";

// Highlights Schema
export const highlightsVendedTokensSchema = z.object({
  value: z.number(),
  change: z.number(),
});

export const highlightsRevenueSchema = z.object({
  value: z.number(),
  change: z.number(),
});

export const highlightsSuccessfulTransactionsSchema = z.object({
  value: z.number(),
  change: z.number(),
});

export const highlightsFailedTransactionsSchema = z.object({
  value: z.number(),
  change: z.number(),
});

export const highlightsSchema = z.object({
  vendedTokens: highlightsVendedTokensSchema,
  revenue: highlightsRevenueSchema,
  successfulTransactions: highlightsSuccessfulTransactionsSchema,
  failedTransactions: highlightsFailedTransactionsSchema,
});

// Trend Schema
export const trendSchema = z.object({
  labels: z.array(z.string()),
  vendedTokens: z.array(z.number()),
  revenue: z.array(z.number()),
});

// Recent Transaction Schema
export const recentTransactionSchema = z.object({
  id: z.number(),
  reference: z.string(),
  name: z.string(),
  tokens: z.number(),
  amount: z.number(),
  accountNumber: z.string(),
  meterNumber: z.string(),
  status: z.string(),
  createdAt: z.string(),
});

// Dashboard Analytics Response Schema
export const dashboardAnalyticsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    highlights: highlightsSchema,
    trend: trendSchema,
    recentTransactions: z.array(recentTransactionSchema),
  }),
});

export type HighlightsVendedTokensDTO = z.infer<typeof highlightsVendedTokensSchema>;
export type HighlightsRevenueDTO = z.infer<typeof highlightsRevenueSchema>;
export type HighlightsSuccessfulTransactionsDTO = z.infer<typeof highlightsSuccessfulTransactionsSchema>;
export type HighlightsFailedTransactionsDTO = z.infer<typeof highlightsFailedTransactionsSchema>;
export type HighlightsDTO = z.infer<typeof highlightsSchema>;
export type TrendDTO = z.infer<typeof trendSchema>;
export type RecentTransactionDTO = z.infer<typeof recentTransactionSchema>;
export type DashboardAnalyticsResponseDTO = z.infer<typeof dashboardAnalyticsResponseSchema>;
