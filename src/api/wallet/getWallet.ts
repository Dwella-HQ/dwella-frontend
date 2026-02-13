import { apiGet } from "@/lib/apiClient";

import type { WalletDTO } from "./wallet.schema";
import { walletResponseSchema } from "./wallet.schema";

type GetWalletResult = 
  | { success: true; data: WalletDTO }
  | { success: false; error: string };

export const getWallet = async (id: string): Promise<GetWalletResult> => {
  const result = await apiGet<{ success: boolean; data: WalletDTO; message?: string }>(`/wallet/${id}`);

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = walletResponseSchema.parse(result.data);
    return { success: true, data: parsed.data };
  } catch (parseError) {
    console.error("Get wallet schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





