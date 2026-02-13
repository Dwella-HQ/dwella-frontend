import { apiPost } from "@/lib/apiClient";

type DisableWalletResult = 
  | { success: true; message: string }
  | { success: false; error: string };

export const disableWallet = async (id: string): Promise<DisableWalletResult> => {
  const result = await apiPost<{ success: boolean; message: string }>(`/wallet/${id}/disable`, {});

  if (!result.success) {
    return result;
  }

  return { success: true, message: result.data.message || "Wallet disabled successfully" };
};





