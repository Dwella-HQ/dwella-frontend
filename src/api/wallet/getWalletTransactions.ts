import { createUrl } from "@/utils/createUrl";
import type { WalletTransactionsResponseDTO } from "./wallet.schema";
import { walletTransactionsResponseSchema } from "./wallet.schema";

const WALLET_TRANSACTIONS_ROUTE = "/partners/wallet-transactions";

type WalletTransactionsResult =
  | { success: true; data: WalletTransactionsResponseDTO }
  | { success: false; error: string };

export const getWalletTransactions = async (
  token: string,
  page?: number
): Promise<WalletTransactionsResult> => {
  try {
    const url = createUrl(
      WALLET_TRANSACTIONS_ROUTE,
      page ? { page: String(page) } : undefined
    );

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Failed to fetch wallet transactions: ${response.statusText}`,
      };
    }

    const payload = await response.json();

    // Wrap Zod parsing in try-catch to handle schema validation errors
    try {
      const parsed = walletTransactionsResponseSchema.parse(payload);
      return { success: true, data: parsed };
    } catch (parseError) {
      console.error("Wallet transactions schema validation error:", parseError);
      return {
        success: false,
        error: "Invalid wallet transactions data format received",
      };
    }
  } catch (error) {
    // Handle network errors, fetch failures, etc.
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      return {
        success: false,
        error: "Network error: Unable to connect to server",
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};

