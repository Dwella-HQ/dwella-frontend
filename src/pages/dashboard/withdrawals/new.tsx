import Head from "next/head";
import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/router";
import type { NextPageWithLayout } from "../../_app";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useToast } from "@/components/Toast";
import { getWallets, getWalletsByLandlord, getWallet } from "@/api/wallet";
import type { WalletDTO } from "@/api/wallet";
import { createWithdrawal } from "@/api/withdrawal";
import { useUser } from "@/contexts/UserContext";
import { useSelectedLandlord } from "@/contexts/SelectedLandlordContext";

const WITHDRAW_MIN = 0.01;

function isWalletPayoutConfigured(
  d: WalletDTO["withdrawalDetails"],
): boolean {
  if (!d) return false;
  const acc = String(d.accountNumber ?? "").replace(/\D/g, "");
  const code = String(d.bankCode ?? "").trim();
  return acc.length === 10 && code.length > 0;
}

const WithdrawalsNewPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, isLoading } = useUser();
  const { selectedLandlord } = useSelectedLandlord();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [wallets, setWallets] = React.useState<WalletDTO[]>([]);
  const [walletsLoading, setWalletsLoading] = React.useState(false);
  const [walletId, setWalletId] = React.useState<string>("");

  const [amount, setAmount] = React.useState<string>("");
  const [narration, setNarration] = React.useState<string>("");
  const [selectedWalletDetail, setSelectedWalletDetail] =
    React.useState<WalletDTO | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const loadWallets = async () => {
      setWalletsLoading(true);
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
        setWallets(result.data);
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
    if (!walletId) {
      setSelectedWalletDetail(null);
      return;
    }
    (async () => {
      setDetailLoading(true);
      const res = await getWallet(walletId);
      if (cancelled) return;
      setSelectedWalletDetail(res.success ? res.data : null);
      setDetailLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [walletId]);

  const handleSubmit = React.useCallback(async () => {
    if (!walletId) {
      showToast("Wallet is required", "error");
      return;
    }
    if (!isWalletPayoutConfigured(selectedWalletDetail?.withdrawalDetails)) {
      showToast(
        "Add a verified bank account in Settings before withdrawing.",
        "error",
      );
      return;
    }
    const amt = Number(amount);
    if (!amount || Number.isNaN(amt) || amt < WITHDRAW_MIN) {
      showToast(`Enter an amount of at least ${WITHDRAW_MIN}`, "error");
      return;
    }

    setIsSubmitting(true);
    const result = await createWithdrawal(
      {
        walletId,
        amount: amt,
        narration: narration || undefined,
      },
      {
        idempotencyKey: undefined,
      },
    );
    if (result.success) {
      showToast("Withdrawal request created", "success");
      router.push("/dashboard/withdrawals");
    } else {
      showToast(result.error || "Failed to create withdrawal", "error");
    }
    setIsSubmitting(false);
  }, [amount, narration, router, selectedWalletDetail, showToast, walletId]);

  const payoutOk = isWalletPayoutConfigured(
    selectedWalletDetail?.withdrawalDetails,
  );

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
            Withdrawals are paid only to your saved bank account. Manage that
            account in {""}
            <Link
              href="/dashboard/settings"
              className="font-medium text-brand-main underline underline-offset-2"
            >
              Settings
            </Link>
            .
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-5">
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
                      {w.currency ? ` · ${w.currency}` : ""}
                    </option>
                  ))
                )}
              </select>
            </div>

            {detailLoading ? (
              <p className="text-sm text-gray-600">Loading payout details…</p>
            ) : (
              <div
                className={`rounded-lg border p-4 ${
                  payoutOk
                    ? "border-emerald-200 bg-emerald-50/80"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Payout account
                </p>
                {payoutOk ? (
                  <div className="mt-2 space-y-1 text-sm text-gray-900">
                    <p className="font-semibold">
                      {selectedWalletDetail?.withdrawalDetails?.fullName?.trim() ||
                        selectedWalletDetail?.withdrawalDetails?.email ||
                        "Linked account"}
                    </p>
                    <p className="text-gray-700">
                      {selectedWalletDetail?.withdrawalDetails?.bankName ||
                        "Bank"}{" "}
                      ·{" "}
                      <span className="font-mono">
                        {selectedWalletDetail?.withdrawalDetails?.accountNumber}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-amber-900">
                    No verified payout account is linked. Update your bank
                    details in {""}
                    <Link
                      href="/dashboard/settings"
                      className="font-medium underline"
                    >
                      Settings
                    </Link>
                    .
                  </p>
                )}
              </div>
            )}

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
                <p className="mt-1 text-xs text-gray-500">
                  Minimum {WITHDRAW_MIN} NGN
                </p>
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
                disabled={
                  isSubmitting || detailLoading || !payoutOk || !walletId
                }
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
