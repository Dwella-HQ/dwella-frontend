import Head from "next/head";
import * as React from "react";
import { useRouter } from "next/router";
import type { NextPageWithLayout } from "../../_app";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useToast } from "@/components/Toast";
import { getWallets, getWalletsByLandlord } from "@/api/wallet";
import {
  getWithdrawalBanks,
  createWithdrawal,
  resolveWithdrawalAccount,
} from "@/api/withdrawal";
import type { WithdrawalRecipientDetailsDTO } from "@/api/withdrawal";
import { useUser } from "@/contexts/UserContext";
import { useSelectedLandlord } from "@/contexts/SelectedLandlordContext";

const WithdrawalsNewPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, isLoading } = useUser();
  const { selectedLandlord } = useSelectedLandlord();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [wallets, setWallets] = React.useState<{ id: string }[]>([]);
  const [walletsLoading, setWalletsLoading] = React.useState(false);
  const [walletId, setWalletId] = React.useState<string>("");

  const [banks, setBanks] = React.useState<
    { bankCode?: string; bankName?: string; name?: string; code?: string }[]
  >([]);
  const [banksLoading, setBanksLoading] = React.useState(false);
  const [bankCode, setBankCode] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");

  const [resolvedRecipient, setResolvedRecipient] =
    React.useState<WithdrawalRecipientDetailsDTO | null>(null);
  const [resolveLoading, setResolveLoading] = React.useState(false);

  const [amount, setAmount] = React.useState<string>("");
  const [narration, setNarration] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;
    const loadWallets = async () => {
      setWalletsLoading(true);
      // Withdrawals are wallet-scoped; for managers we use the selected landlord,
      // for landlords we use the stored landlordId.
      const landlordId =
        user?.role === "property_manager"
          ? selectedLandlord?.id
          : user?.role === "landlord" || user?.role === "super_admin"
            ? typeof window !== "undefined"
              ? localStorage.getItem("landlordId")
              : null
            : null;

      if (user?.role === "property_manager" && !landlordId) {
        showToast("Select a landlord to continue.", "error");
        setWallets([]);
        setWalletsLoading(false);
        return;
      }

      const result =
        landlordId && typeof landlordId === "string"
          ? await getWalletsByLandlord(landlordId)
          : await getWallets();
      if (cancelled) return;
      if (result.success) {
        setWallets(result.data.map((w) => ({ id: w.id })));
        if (result.data[0]?.id) {
          setWalletId(String(result.data[0].id));
        }
      } else {
        showToast(result.error || "Failed to load wallets", "error");
      }
      setWalletsLoading(false);
    };
    loadWallets();
    return () => {
      cancelled = true;
    };
  }, [showToast, user, selectedLandlord?.id]);

  React.useEffect(() => {
    let cancelled = false;
    const loadBanks = async () => {
      if (!walletId) return;
      setBanksLoading(true);
      const result = await getWithdrawalBanks(walletId);
      if (cancelled) return;
      if (result.success) {
        setBanks(result.data);
      } else {
        showToast(result.error || "Failed to load banks", "error");
        setBanks([]);
      }
      setBanksLoading(false);
    };
    loadBanks();
    return () => {
      cancelled = true;
    };
  }, [walletId, showToast]);

  const handleResolveAccount = React.useCallback(async () => {
    if (!bankCode || !accountNumber) {
      showToast("Bank code and account number are required", "error");
      return;
    }
    setResolveLoading(true);
    const result = await resolveWithdrawalAccount({
      accountNumber,
      bankCode,
    });

    if (result.success) {
      // Backend may respond with { data: {...recipientDetails} } or directly the recipient details.
      const payload = result.data as unknown as { data?: unknown };
      const recipient = (
        payload && payload.data ? payload.data : payload
      ) as any;
      setResolvedRecipient(recipient as WithdrawalRecipientDetailsDTO);
      showToast("Account resolved successfully", "success");
    } else {
      showToast(result.error || "Failed to resolve account", "error");
      setResolvedRecipient(null);
    }
    setResolveLoading(false);
  }, [accountNumber, bankCode, showToast]);

  const handleSubmit = React.useCallback(async () => {
    if (!walletId) {
      showToast("Wallet is required", "error");
      return;
    }
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }
    if (!bankCode || !accountNumber) {
      showToast("Bank code and account number are required", "error");
      return;
    }

    const payload = {
      walletId,
      amount: Number(amount),
      narration: narration || undefined,
      recipientDetails:
        resolvedRecipient ?? ({ bankCode, accountNumber } as any),
    };

    setIsSubmitting(true);
    const result = await createWithdrawal(payload, {
      idempotencyKey: undefined,
    });
    if (result.success) {
      showToast("Withdrawal request created", "success");
      router.push("/dashboard/withdrawals");
    } else {
      showToast(result.error || "Failed to create withdrawal", "error");
    }
    setIsSubmitting(false);
  }, [
    accountNumber,
    amount,
    bankCode,
    narration,
    resolvedRecipient,
    router,
    showToast,
    walletId,
  ]);

  return (
    <>
      <Head>
        <title>DWELLA NG · New Withdrawal</title>
      </Head>

      <section className="space-y-6">
        {isLoading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            Loading...
          </div>
        ) : user?.role === "tenant" ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Withdrawals are not available for tenants.
          </div>
        ) : null}

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            New Withdrawal
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Choose a wallet, resolve the recipient account, then submit.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Wallet
                </label>
                <select
                  value={walletId}
                  disabled={walletsLoading}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900"
                >
                  {wallets.length === 0 ? (
                    <option value="">No wallets found</option>
                  ) : (
                    wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.id}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Bank
                </label>
                <select
                  value={bankCode}
                  disabled={banksLoading}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900"
                >
                  <option value="">Select bank</option>
                  {banks.map((b, idx) => {
                    const code = b.bankCode || b.code || undefined;
                    const name =
                      b.bankName || b.name || code || `Bank ${idx + 1}`;
                    return (
                      <option key={`${name}-${idx}`} value={code || ""}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Account Number
                </label>
                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  inputMode="numeric"
                  placeholder="Enter account number"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleResolveAccount}
                  disabled={resolveLoading}
                  className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition disabled:opacity-60"
                >
                  {resolveLoading ? "Resolving..." : "Resolve Account"}
                </button>
              </div>
            </div>

            {resolvedRecipient ? (
              <div className="rounded-md border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-900">
                  Recipient resolved
                </p>
                <p className="mt-1 text-sm text-green-800">
                  {resolvedRecipient.accountName
                    ? `Name: ${resolvedRecipient.accountName}`
                    : `Account resolved for ${accountNumber}`}
                </p>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Amount
                </label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder="e.g. 5000"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Narration (optional)
                </label>
                <input
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  placeholder="e.g. Withdrawal for rent"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-lg bg-brand-main px-4 py-2 text-sm font-medium text-white hover:bg-brand-main/90 transition disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Request Withdrawal"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

WithdrawalsNewPage.getLayout = (page) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default WithdrawalsNewPage;
