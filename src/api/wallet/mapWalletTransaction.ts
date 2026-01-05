import type { WalletTransactionDTO } from "./wallet.schema";
import type { Transaction, TransactionStatus } from "@/components/TransactionTable";

/**
 * Format currency amount to Naira format
 */
const formatAmount = (amount: string): string => {
  const numAmount = parseFloat(amount);
  return `₦${numAmount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

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
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? "s" : ""} ago`;
};

/**
 * Map API status to TransactionStatus
 */
const mapStatus = (status: string): TransactionStatus => {
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus === "successful" || normalizedStatus === "success") {
    return "Successful";
  }
  if (normalizedStatus === "pending") {
    return "Pending";
  }
  if (normalizedStatus === "failed" || normalizedStatus === "fail") {
    return "Failed";
  }
  // Default to successful if status doesn't match
  return "Successful";
};

/**
 * Extended Transaction type that includes wallet transaction metadata
 */
export type WalletTransactionWithMetadata = Transaction & {
  walletTransaction?: {
    id: number;
    type: "credit" | "debit";
    description: string;
    prev_balance: string;
    curr_balance: string;
    confirmed: boolean;
    reference: string;
    createdAt: string;
    updatedAt: string;
    email: string;
  };
};

/**
 * Map wallet transaction from API to Transaction type for UI
 */
export const mapWalletTransaction = (
  walletTx: WalletTransactionDTO
): WalletTransactionWithMetadata => {
  return {
    id: walletTx.reference,
    name: walletTx.description,
    reference: walletTx.reference,
    account: formatAmount(walletTx.prev_balance),
    type: walletTx.type === "credit" ? "Credit" : "Debit",
    amount: formatAmount(walletTx.amount),
    fee: "₦0.00", // API doesn't provide fee, defaulting to 0
    net: formatAmount(walletTx.curr_balance),
    timeAgo: formatTimeAgo(walletTx.createdAt),
    status: mapStatus(walletTx.status),
    walletTransaction: {
      id: walletTx.id,
      type: walletTx.type,
      description: walletTx.description,
      prev_balance: walletTx.prev_balance,
      curr_balance: walletTx.curr_balance,
      confirmed: walletTx.confirmed,
      reference: walletTx.reference,
      createdAt: walletTx.createdAt,
      updatedAt: walletTx.updatedAt,
      email: walletTx.email,
    },
  };
};

