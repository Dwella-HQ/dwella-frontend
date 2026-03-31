import { apiPost } from "@/lib/apiClient";

import type { WalletDTO } from "./wallet.schema";
import { walletResponseSchema } from "./wallet.schema";

type CreateLandlordWalletRequest = {
  landlordId: string;
  currency?: string;
  // Some backends may accept BVN later; this is optional to match contract variability.
  bvn?: string;
};

type CreateLandlordWalletResult = 
  | { success: true; data: WalletDTO }
  | { success: false; error: string };

export const createLandlordWallet = async (
  data: CreateLandlordWalletRequest
): Promise<CreateLandlordWalletResult> => {
  const result = await apiPost<{ success: boolean; data: WalletDTO; message?: string }>(
    "/wallet/landlord",
    {
      landlordId: data.landlordId,
      currency: data.currency || "NGN",
      ...(data.bvn ? { bvn: data.bvn } : {}),
    }
  );

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = walletResponseSchema.parse(result.data);
    return { success: true, data: parsed.data };
  } catch (parseError) {
    console.error("Create landlord wallet schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





