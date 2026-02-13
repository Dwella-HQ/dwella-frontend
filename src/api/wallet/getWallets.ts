import { apiGet } from "@/lib/apiClient";

import type { WalletDTO } from "./wallet.schema";
import { walletResponseSchema } from "./wallet.schema";

type GetWalletsResult = 
  | { success: true; data: WalletDTO[] }
  | { success: false; error: string };

export const getWallets = async (): Promise<GetWalletsResult> => {
  const result = await apiGet<{ success: boolean; data: WalletDTO[]; message?: string }>("/wallet");

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    // Handle both array response and object with data array
    const wallets = Array.isArray(result.data) 
      ? result.data 
      : (result.data as any)?.data || [];
    
    // Validate each wallet
    const validatedWallets = wallets.map((wallet: any) => 
      walletResponseSchema.parse({ success: true, data: wallet })
    );
    
    return { success: true, data: validatedWallets.map((w: any) => w.data) };
  } catch (parseError) {
    console.error("Get wallets schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





