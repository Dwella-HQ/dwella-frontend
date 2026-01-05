import type {
  HighlightsDTO,
  TrendDTO,
  RecentTransactionDTO,
} from "./analytics.schema";
import type { Transaction, TransactionStatus } from "@/components/TransactionTable";

/**
 * Format time ago from ISO date string
 */
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? "s" : ""} ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes !== 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return "Yesterday";
  }
  if (diffInDays < 30) {
    return `${diffInDays} days ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? "s" : ""} ago`;
};

/**
 * Format currency amount to Naira format
 */
const formatAmount = (amount: number): string => {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format number with commas
 */
const formatNumber = (num: number, decimals = 1): string => {
  return num.toLocaleString("en-NG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Map API status to TransactionStatus
 */
const mapStatus = (status: string): TransactionStatus => {
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus === "completed" || normalizedStatus === "successful" || normalizedStatus === "success") {
    return "Successful";
  }
  if (normalizedStatus === "pending") {
    return "Pending";
  }
  if (normalizedStatus === "failed" || normalizedStatus === "fail") {
    return "Failed";
  }
  return "Successful";
};

/**
 * Map recent transaction from API to Transaction type for UI
 */
export const mapRecentTransaction = (
  transaction: RecentTransactionDTO
): Transaction => {
  return {
    id: transaction.reference,
    name: transaction.name,
    reference: transaction.meterNumber, // Using meterNumber as reference for address column
    account: transaction.accountNumber,
    type: `${formatNumber(transaction.tokens)} kWh`,
    amount: formatAmount(transaction.amount),
    fee: "₦0.00",
    net: formatAmount(transaction.amount),
    timeAgo: formatTimeAgo(transaction.createdAt),
    status: mapStatus(transaction.status),
  };
};

/**
 * Format highlights for display
 */
export const formatHighlights = (highlights: HighlightsDTO) => {
  return {
    vendedTokens: {
      value: `${formatNumber(highlights.vendedTokens.value)} kWh`,
      change: `${highlights.vendedTokens.change}%`,
      isPositive: highlights.vendedTokens.change >= 0,
    },
    revenue: {
      value: formatAmount(highlights.revenue.value),
      change: `${highlights.revenue.change}%`,
      isPositive: highlights.revenue.change >= 0,
    },
    successfulTransactions: {
      value: String(highlights.successfulTransactions.value),
      change: `${highlights.successfulTransactions.change}%`,
      isPositive: highlights.successfulTransactions.change >= 0,
    },
    failedTransactions: {
      value: String(highlights.failedTransactions.value),
      change: `${highlights.failedTransactions.change}%`,
      isPositive: highlights.failedTransactions.change >= 0,
    },
  };
};

/**
 * Format trend data for chart
 */
export const formatTrendData = (trend: TrendDTO) => {
  return {
    labels: trend.labels,
    vendedTokens: trend.vendedTokens,
    revenue: trend.revenue,
  };
};
