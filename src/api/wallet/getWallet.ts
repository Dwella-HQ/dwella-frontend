import { apiGet } from "@/lib/apiClient";

import type { WalletDTO } from "./wallet.schema";
import { walletResponseSchema, walletSchema } from "./wallet.schema";

type GetWalletResult =
  | { success: true; data: WalletDTO }
  | { success: false; error: string };

export const getWallet = async (id: string): Promise<GetWalletResult> => {
  const result = await apiGet<{
    success: boolean;
    data: WalletDTO;
    message?: string;
  }>(`/wallet/${id}`);

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = walletResponseSchema.parse(result.data);
    // Re-parse nested wallet with tolerant schema (handles numeric balances etc.)
    const wallet = walletSchema.parse(parsed.data);
    return { success: true, data: wallet };
  } catch (parseError) {
    console.error("Get wallet schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};
