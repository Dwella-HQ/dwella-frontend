import { getWalletsByLandlord } from "./getWalletsByLandlord";
import { createLandlordWallet } from "./createLandlordWallet";

type EnsureLandlordWalletResult =
  | { success: true; walletId?: string }
  | { success: false; error: string };

export const ensureLandlordWallet = async (
  landlordId: string,
  currency: string = "NGN",
): Promise<EnsureLandlordWalletResult> => {
  const existing = await getWalletsByLandlord(landlordId);
  if (existing.success && existing.data?.length > 0) {
    return { success: true, walletId: existing.data[0].id };
  }

  const created = await createLandlordWallet({ landlordId, currency });
  if (created.success) {
    return { success: true, walletId: created.data.id };
  }

  const refreshed = await getWalletsByLandlord(landlordId);
  if (refreshed.success && refreshed.data?.length > 0) {
    return { success: true, walletId: refreshed.data[0].id };
  }

  return {
    success: false,
    error: created.error || "Failed to ensure landlord wallet",
  };
};

