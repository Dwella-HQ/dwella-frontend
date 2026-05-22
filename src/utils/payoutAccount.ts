import type { LandlordBankAccountDTO } from "@/api/landlord/updateLandlord";
import type { WalletDTO } from "@/api/wallet";

const PAY_ACCOUNT_LEN = 10;

export type PayoutAccountView = {
  fullName?: string;
  bankName?: string;
  accountNumber?: string;
  bankCode?: string;
  source: "wallet" | "landlord_settings";
};

/** Payout fields on GET /wallet/:id (`withdrawalDetails`). */
export function isWalletWithdrawalDetailsConfigured(
  details: WalletDTO["withdrawalDetails"] | null | undefined,
): boolean {
  if (!details) return false;
  const acc = String(details.accountNumber ?? "").replace(/\D/g, "");
  const code = String(details.bankCode ?? "").trim();
  return acc.length === PAY_ACCOUNT_LEN && code.length > 0;
}

/** Bank account from GET /landlord/:id/settings (saved in Settings → Payment Details). */
export function isLandlordBankAccountConfigured(
  bank: LandlordBankAccountDTO | null | undefined,
): boolean {
  if (!bank) return false;
  const acc = String(bank.accountNumber ?? "").replace(/\D/g, "");
  const code = String(bank.bankCode ?? "").trim();
  const name = String(bank.accountName ?? "").trim();
  return acc.length === PAY_ACCOUNT_LEN && code.length > 0 && name.length > 0;
}

/** Prefer wallet payout details; fall back to landlord settings bank account. */
export function resolvePayoutAccount(
  walletDetails: WalletDTO["withdrawalDetails"] | null | undefined,
  landlordBank: LandlordBankAccountDTO | null | undefined,
): { configured: boolean; view: PayoutAccountView | null } {
  if (isWalletWithdrawalDetailsConfigured(walletDetails)) {
    return {
      configured: true,
      view: {
        fullName: walletDetails?.fullName?.trim() || undefined,
        bankName: walletDetails?.bankName,
        accountNumber: walletDetails?.accountNumber,
        bankCode: walletDetails?.bankCode,
        source: "wallet",
      },
    };
  }

  if (isLandlordBankAccountConfigured(landlordBank)) {
    return {
      configured: true,
      view: {
        fullName: landlordBank!.accountName,
        bankName: landlordBank!.bankName,
        accountNumber: landlordBank!.accountNumber,
        bankCode: landlordBank!.bankCode,
        source: "landlord_settings",
      },
    };
  }

  return { configured: false, view: null };
}
