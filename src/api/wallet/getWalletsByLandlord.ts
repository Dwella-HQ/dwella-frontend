import { apiGet } from "@/lib/apiClient";
import type { WalletDTO } from "./wallet.schema";
import { walletSchema } from "./wallet.schema";

type GetWalletsByLandlordResult =
  | { success: true; data: WalletDTO[] }
  | { success: false; error: string };

export const getWalletsByLandlord = async (
  landlordId: string,
): Promise<GetWalletsByLandlordResult> => {
  const result = await apiGet<unknown>(`/wallet/landlord/${landlordId}`);

  if (!result.success) return result;

  try {
    const payload = result.data as any;
    let maybeWallets: any[] = [];

    if (Array.isArray(payload?.data)) {
      maybeWallets = payload.data;
    } else if (payload?.data && typeof payload.data === "object") {
      // Some backend responses return a single wallet object in `data`
      maybeWallets = [payload.data];
    } else if (Array.isArray(payload)) {
      maybeWallets = payload;
    } else if (Array.isArray(payload?.wallets)) {
      maybeWallets = payload.wallets;
    }

    const validated = maybeWallets.map((wallet: any) =>
      walletSchema.parse(wallet),
    );

    return { success: true, data: validated as WalletDTO[] };
  } catch (parseError) {
    console.error(
      "Get wallets by landlord schema validation error:",
      parseError,
    );
    return { success: false, error: "Invalid wallet payload format received" };
  }
};
