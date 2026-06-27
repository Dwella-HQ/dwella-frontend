import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";
import type { NextPageWithLayout } from "../_app";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useToast } from "@/components/Toast";
import { getWalletsByLandlord, getWallet, type WalletDTO } from "@/api/wallet";
import { ensureLandlordWallet } from "@/api/wallet";
import {
  getWithdrawals,
  getWithdrawalQueues,
  createWithdrawal,
  type WithdrawalItemDTO,
  type WithdrawalCreateDTO,
} from "@/api/withdrawal";
import { getLandlordByUser, getLandlordSettings } from "@/api/landlord";
import type { LandlordBankAccountDTO } from "@/api/landlord";
import { resolvePayoutAccount } from "@/utils/payoutAccount";
import {
  createDeposit,
  extractDepositCheckoutUrl,
  getDepositsByWallet,
  type DepositItemDTO,
  type DepositCreateDTO,
} from "@/api/deposit";
import { SUPPORT_EMAIL } from "@/lib/supportContact";
import { format, parseISO } from "date-fns";
import { useUser } from "@/contexts/UserContext";
import { useSelectedLandlord } from "@/contexts/SelectedLandlordContext";

type FinanceTab = "overview" | "withdraw" | "deposit" | "transactions";

const formatDateValue = (value?: string) => {
  if (!value) return "—";
  try {
    return format(parseISO(value), "dd MMM yyyy, h:mm a");
  } catch {
    return value;
  }
};

const extractWithdrawalList = (payload: unknown): WithdrawalItemDTO[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as WithdrawalItemDTO[];

  const p = payload as { data?: unknown; withdrawals?: unknown };
  const data = p.data as
    | { withdrawals?: unknown; transactions?: unknown }
    | undefined;
  const maybeList =
    p?.data && Array.isArray(p.data)
      ? p.data
      : Array.isArray(p.withdrawals)
        ? p.withdrawals
        : Array.isArray(data?.withdrawals)
          ? data.withdrawals
          : Array.isArray(data?.transactions)
            ? data.transactions
            : [];

  return maybeList as WithdrawalItemDTO[];
};

const WITHDRAW_MIN = 0.01;

/** Filter DevTools console by this string to inspect withdrawal queue API probes. */
const WITHDRAWAL_QUEUE_LOG = "[Dwelliva Finance · Withdrawal queue]";

function withdrawalRecipientLabel(w: WithdrawalItemDTO): string {
  const r = w.recipientDetails;
  if (!r) return "—";
  const accountName = (r as { accountName?: string }).accountName;
  const fullName = (r as { fullName?: string }).fullName;
  const name = accountName ?? fullName;
  const tail = r.accountNumber;
  if (name && tail) return `${name} · ${tail}`;
  if (name) return name;
  if (tail) return String(tail);
  return "—";
}

function withdrawalWalletId(w: WithdrawalItemDTO): string {
  const record = w as WithdrawalItemDTO & { wallet?: { id?: unknown } };
  return String(record.walletId ?? record.wallet?.id ?? "");
}

const FinancePage: NextPageWithLayout = () => {
  const { showToast } = useToast();
  const router = useRouter();

  const [tab, setTab] = React.useState<FinanceTab>("overview");

  const { user, isLoading: isUserLoading } = useUser();
  const { selectedLandlord } = useSelectedLandlord();

  React.useEffect(() => {
    if (isUserLoading) return;
    if (user?.role === "property_manager") {
      void router.replace("/dashboard");
    }
  }, [isUserLoading, router, user?.role]);

  const [wallets, setWallets] = React.useState<WalletDTO[]>([]);
  const [activeWallet, setActiveWallet] = React.useState<WalletDTO | null>(
    null,
  );
  const [walletLoading, setWalletLoading] = React.useState(false);

  const [resolvedLandlordId, setResolvedLandlordId] = React.useState<
    string | null
  >(null);

  React.useEffect(() => {
    let cancelled = false;

    const resolveLandlordId = async () => {
      if (!user?.role || user.role === "tenant") {
        setResolvedLandlordId(null);
        return;
      }
      if (user.role === "property_manager") {
        setResolvedLandlordId(
          selectedLandlord?.id ? String(selectedLandlord.id) : null,
        );
        return;
      }
      if (user.role === "landlord" || user.role === "super_admin") {
        if (typeof window === "undefined") return;
        let id = localStorage.getItem("landlordId");
        if (!id && user.role === "landlord" && user.id) {
          const lr = await getLandlordByUser(String(user.id));
          if (lr.success && lr.data?.id) {
            id = String(lr.data.id);
            localStorage.setItem("landlordId", id);
          }
        }
        if (!cancelled) setResolvedLandlordId(id);
      }
    };

    if (!isUserLoading) {
      void resolveLandlordId();
    }

    return () => {
      cancelled = true;
    };
  }, [isUserLoading, selectedLandlord?.id, user?.id, user?.role]);

  const landlordId = resolvedLandlordId;

  React.useEffect(() => {
    let cancelled = false;

    const loadWallet = async () => {
      if (!landlordId || !user?.role || user.role === "tenant") return;
      setWalletLoading(true);

      // Ensure wallet exists (create if missing).
      const ensured = await ensureLandlordWallet(String(landlordId), "NGN");
      if (cancelled) return;
      if (!ensured.success) {
        showToast(ensured.error || "Failed to ensure wallet", "error");
        setWallets([]);
        setActiveWallet(null);
        setWalletLoading(false);
        return;
      }

      const walletsResult = await getWalletsByLandlord(String(landlordId));
      if (cancelled) return;
      if (!walletsResult.success) {
        showToast(walletsResult.error || "Failed to load wallets", "error");
        setWallets([]);
        setActiveWallet(null);
        setWalletLoading(false);
        return;
      }

      const list = walletsResult.data;
      setWallets(list);
      setActiveWallet(list[0] ?? null);
      setWalletLoading(false);
    };

    if (!isUserLoading) {
      loadWallet();
    }

    return () => {
      cancelled = true;
    };
  }, [isUserLoading, landlordId, showToast, user?.role]);

  const [payoutWallet, setPayoutWallet] = React.useState<WalletDTO | null>(
    null,
  );
  const [payoutWalletLoading, setPayoutWalletLoading] = React.useState(false);
  const [landlordBankAccount, setLandlordBankAccount] =
    React.useState<LandlordBankAccountDTO | null>(null);
  const [landlordBankLoading, setLandlordBankLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    if (!landlordId) {
      setLandlordBankAccount(null);
      return;
    }
    (async () => {
      setLandlordBankLoading(true);
      const res = await getLandlordSettings(landlordId);
      if (cancelled) return;
      setLandlordBankAccount(
        res.success && res.data.bankAccount ? res.data.bankAccount : null,
      );
      setLandlordBankLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [landlordId]);

  const payoutAccount = React.useMemo(
    () =>
      resolvePayoutAccount(
        payoutWallet?.withdrawalDetails,
        landlordBankAccount,
      ),
    [landlordBankAccount, payoutWallet?.withdrawalDetails],
  );

  React.useEffect(() => {
    let cancelled = false;
    if (!activeWallet?.id) {
      setPayoutWallet(null);
      return;
    }
    (async () => {
      setPayoutWalletLoading(true);
      const res = await getWallet(activeWallet.id);
      if (cancelled) return;
      setPayoutWallet(res.success ? res.data : null);
      setPayoutWalletLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeWallet]);

  // Withdraw form state (destination is fixed server-side on the wallet)
  const [withdrawAmount, setWithdrawAmount] = React.useState("");
  const [withdrawNarration, setWithdrawNarration] = React.useState("");
  const [withdrawSubmitting, setWithdrawSubmitting] = React.useState(false);

  // Deposits state
  const [deposits, setDeposits] = React.useState<DepositItemDTO[]>([]);
  const [depositsLoading, setDepositsLoading] = React.useState(false);
  const [depositAmount, setDepositAmount] = React.useState("");
  const [depositNarration, setDepositNarration] = React.useState("");
  const [depositSubmitting, setDepositSubmitting] = React.useState(false);

  // Withdrawals list state
  const [withdrawals, setWithdrawals] = React.useState<WithdrawalItemDTO[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = React.useState(false);

  const refreshLists = React.useCallback(async () => {
    if (!activeWallet?.id) return;
    setDepositsLoading(true);
    setWithdrawalsLoading(true);
    const [depResult, wResult] = await Promise.all([
      getDepositsByWallet(activeWallet.id),
      getWithdrawals(),
    ]);

    if (depResult.success) {
      setDeposits(depResult.data);
    } else {
      setDeposits([]);
    }

    if (wResult.success) {
      const all = extractWithdrawalList(wResult.data);
      const scoped = all.filter((w) => {
        return withdrawalWalletId(w) === String(activeWallet.id);
      });
      setWithdrawals(scoped);
    } else {
      setWithdrawals([]);
    }

    if (typeof window !== "undefined") {
      const walletId = activeWallet.id;
      const queuesResult = await getWithdrawalQueues(walletId);
      console.info(WITHDRAWAL_QUEUE_LOG, "GET /queues", {
        walletId,
        success: queuesResult.success,
        statusCode: queuesResult.success ? undefined : queuesResult.statusCode,
        error: queuesResult.success ? undefined : queuesResult.error,
        data: queuesResult.success ? queuesResult.data : null,
      });
      console.info(WITHDRAWAL_QUEUE_LOG, "GET /withdrawal (current list)", {
        success: wResult.success,
        data: wResult.success ? wResult.data : wResult,
      });
    }

    setDepositsLoading(false);
    setWithdrawalsLoading(false);
  }, [activeWallet]);

  React.useEffect(() => {
    if (activeWallet?.id) {
      refreshLists();
    }
  }, [activeWallet, refreshLists]);

  const handleSubmitWithdrawal = React.useCallback(async () => {
    if (!activeWallet?.id) {
      showToast("Wallet not ready", "error");
      return;
    }
    if (!payoutAccount.configured) {
      showToast(
        "Add a verified bank account in Settings before withdrawing.",
        "error",
      );
      return;
    }
    const amt = Number(withdrawAmount);
    if (!withdrawAmount || Number.isNaN(amt) || amt < WITHDRAW_MIN) {
      showToast(`Enter an amount of at least ${WITHDRAW_MIN}`, "error");
      return;
    }
    setWithdrawSubmitting(true);
    const payload: WithdrawalCreateDTO = {
      walletId: activeWallet.id,
      amount: amt,
      narration: withdrawNarration || undefined,
    };

    const result = await createWithdrawal(payload);
    if (result.success) {
      showToast("Withdrawal request created", "success");
      setWithdrawAmount("");
      setWithdrawNarration("");
      const wres = await getWallet(activeWallet.id);
      if (wres.success) setPayoutWallet(wres.data);
      refreshLists();
    } else {
      showToast(result.error || "Failed to create withdrawal", "error");
    }
    setWithdrawSubmitting(false);
  }, [
    activeWallet,
    payoutAccount.configured,
    refreshLists,
    showToast,
    withdrawAmount,
    withdrawNarration,
  ]);

  const handleSubmitDeposit = React.useCallback(async () => {
    if (!activeWallet?.id) {
      showToast("Wallet not ready", "error");
      return;
    }
    if (
      !depositAmount ||
      Number.isNaN(Number(depositAmount)) ||
      Number(depositAmount) <= 0
    ) {
      showToast("Enter a valid amount", "error");
      return;
    }
    setDepositSubmitting(true);
    const payload: DepositCreateDTO = {
      walletId: activeWallet.id,
      amount: Number(depositAmount),
      narration: depositNarration || undefined,
    };
    const result = await createDeposit(payload);
    if (result.success) {
      const checkoutUrl = extractDepositCheckoutUrl(result.data);
      if (checkoutUrl) {
        showToast("Deposit started. Redirecting to payment...", "success");
        window.location.href = checkoutUrl;
        return;
      }
      showToast(
        `Deposit started, but no checkout link was returned. Try again, or contact ${SUPPORT_EMAIL} if this keeps happening.`,
        "error",
      );
      refreshLists();
    } else {
      showToast(result.error || "Failed to create deposit", "error");
    }
    setDepositSubmitting(false);
  }, [
    activeWallet,
    depositAmount,
    depositNarration,
    refreshLists,
    showToast,
  ]);

  const transactions = React.useMemo(() => {
    const items: Array<{
      type: "deposit" | "withdrawal";
      id: string;
      amount?: string | number;
      status?: string;
      narration?: string;
      createdAt?: string;
    }> = [];

    withdrawals.forEach((w, index) => {
      items.push({
        type: "withdrawal",
        id: String(w.id ?? `withdrawal-${index}`),
        amount: w.amount,
        status: w.status,
        narration: w.narration,
        createdAt: w.createdAt,
      });
    });

    deposits.forEach((d, index) => {
      items.push({
        type: "deposit",
        id: String(d.id ?? `deposit-${index}`),
        amount: d.amount,
        status: d.status,
        narration: d.narration,
        createdAt: d.createdAt,
      });
    });

    return items.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  }, [deposits, withdrawals]);

  if (isUserLoading || (walletLoading && !activeWallet)) {
    return (
      <>
        <Head>
          <title>Dwelliva · Finance</title>
        </Head>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand-main" />
        </div>
      </>
    );
  }

  if (!user || user.role === "tenant" || user.role === "property_manager") {
    return (
      <>
        <Head>
          <title>Dwelliva · Finance</title>
        </Head>
        <section className="space-y-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Finance page is not available for this account.
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Dwelliva · Finance</title>
      </Head>

      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Finance
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Wallet details, deposits, withdrawals, and transaction history.
          </p>
        </div>

        {/* Wallet overview */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Active Wallet
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Currency: {activeWallet?.currency ?? "—"}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Balance</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {activeWallet?.balance ?? "0"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "overview", label: "Overview" },
              { id: "withdraw", label: "Withdraw" },
              { id: "deposit", label: "Deposit" },
              { id: "transactions", label: "Transactions" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                tab === t.id
                  ? "border-brand-main bg-brand-main text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "overview" ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">
              Use the tabs above to create deposits/withdrawals and view your
              transaction history.
            </p>
          </div>
        ) : null}

        {tab === "withdraw" ? (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-base font-semibold text-gray-900">
                Withdraw
              </h2>
              <p className="text-sm text-gray-600">
                Funds are sent only to the bank account on file for this wallet.
                Update it in{" "}
                <Link
                  href="/dashboard/settings"
                  className="font-medium text-brand-main underline underline-offset-2"
                >
                  Settings
                </Link>
                .
              </p>

              {payoutWalletLoading || landlordBankLoading ? (
                <p className="text-sm text-gray-600">Loading payout details…</p>
              ) : (
                <div
                  className={`rounded-lg border p-4 ${
                    payoutAccount.configured
                      ? "border-emerald-200 bg-emerald-50/80"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Payout account
                  </p>
                  {payoutAccount.configured && payoutAccount.view ? (
                    <div className="mt-2 space-y-1 text-sm text-gray-900">
                      <p className="font-semibold">
                        {payoutAccount.view.fullName?.trim() ||
                          "Linked account"}
                      </p>
                      <p className="text-gray-700">
                        {payoutAccount.view.bankName || "Bank"} ·{" "}
                        <span className="font-mono">
                          {payoutAccount.view.accountNumber}
                        </span>
                      </p>
                      {payoutAccount.view.source === "landlord_settings" ? (
                        <p className="text-xs text-gray-600">
                          From Settings → Payment Details
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-amber-900">
                      No verified payout account is linked yet. Add your bank
                      details in{" "}
                      <Link
                        href="/dashboard/settings"
                        className="font-medium underline"
                      >
                        Settings
                      </Link>{" "}
                      before requesting a withdrawal.
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
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
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
                    value={withdrawNarration}
                    onChange={(e) => setWithdrawNarration(e.target.value)}
                    placeholder="e.g. Withdrawal for rent"
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawAmount("");
                    setWithdrawNarration("");
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleSubmitWithdrawal}
                  disabled={
                    withdrawSubmitting ||
                    payoutWalletLoading ||
                    landlordBankLoading ||
                    !payoutAccount.configured
                  }
                  className="rounded-lg bg-brand-main px-4 py-2 text-sm font-medium text-white hover:bg-brand-main/90 transition disabled:opacity-60"
                >
                  {withdrawSubmitting ? "Submitting..." : "Request Withdrawal"}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                Your Withdrawals
              </h2>
              {withdrawalsLoading ? (
                <p className="mt-3 text-sm text-gray-600">Loading...</p>
              ) : withdrawals.length === 0 ? (
                <p className="mt-3 text-sm text-gray-600">
                  No withdrawals found for this wallet.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse">
                    <thead>
                      <tr className="text-left text-xs uppercase text-gray-500">
                        <th className="py-3 pr-3">ID</th>
                        <th className="py-3 pr-3">Amount</th>
                        <th className="py-3 pr-3">Status</th>
                        <th className="py-3 pr-3">Recipient</th>
                        <th className="py-3 pr-3">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((w) => (
                        <tr
                          key={String(w.id)}
                          className="border-t border-gray-100"
                        >
                          <td className="py-3 pr-3 text-sm text-gray-900">
                            {w.id ?? "—"}
                          </td>
                          <td className="py-3 pr-3 text-sm text-gray-700">
                            {w.amount ?? "—"}
                          </td>
                          <td className="py-3 pr-3 text-sm text-gray-700">
                            {w.status ?? "—"}
                          </td>
                          <td className="py-3 pr-3 text-sm text-gray-700">
                            {withdrawalRecipientLabel(w)}
                          </td>
                          <td className="py-3 pr-3 text-sm text-gray-700">
                            {formatDateValue(w.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {tab === "deposit" ? (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-base font-semibold text-gray-900">Deposit</h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Amount
                  </label>
                  <input
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="e.g. 1000"
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Narration (optional)
                  </label>
                  <input
                    value={depositNarration}
                    onChange={(e) => setDepositNarration(e.target.value)}
                    placeholder="e.g. Deposit to wallet"
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleSubmitDeposit}
                  disabled={depositSubmitting}
                  className="rounded-lg bg-brand-main px-4 py-2 text-sm font-medium text-white hover:bg-brand-main/90 transition disabled:opacity-60"
                >
                  {depositSubmitting ? "Starting..." : "Continue to Payment"}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                Your Deposits
              </h2>
              {depositsLoading ? (
                <p className="mt-3 text-sm text-gray-600">Loading...</p>
              ) : deposits.length === 0 ? (
                <p className="mt-3 text-sm text-gray-600">
                  No deposits found for this wallet.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse">
                    <thead>
                      <tr className="text-left text-xs uppercase text-gray-500">
                        <th className="py-3 pr-3">ID</th>
                        <th className="py-3 pr-3">Reference</th>
                        <th className="py-3 pr-3">Amount</th>
                        <th className="py-3 pr-3">Status</th>
                        <th className="py-3 pr-3">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.map((d) => (
                        <tr
                          key={String(d.id)}
                          className="border-t border-gray-100"
                        >
                          <td className="py-3 pr-3 text-sm text-gray-900">
                            {d.id ?? "—"}
                          </td>
                          <td className="py-3 pr-3 text-sm text-gray-700">
                            {d.reference ?? "—"}
                          </td>
                          <td className="py-3 pr-3 text-sm text-gray-700">
                            {d.amount ?? "—"}
                          </td>
                          <td className="py-3 pr-3 text-sm text-gray-700">
                            {d.status ?? "—"}
                          </td>
                          <td className="py-3 pr-3 text-sm text-gray-700">
                            {formatDateValue(d.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {tab === "transactions" ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              Transactions
            </h2>
            {transactions.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">
                No transactions found yet.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse">
                  <thead>
                    <tr className="text-left text-xs uppercase text-gray-500">
                      <th className="py-3 pr-3">Type</th>
                      <th className="py-3 pr-3">ID</th>
                      <th className="py-3 pr-3">Amount</th>
                      <th className="py-3 pr-3">Status</th>
                      <th className="py-3 pr-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-t border-gray-100">
                        <td className="py-3 pr-3 text-sm text-gray-900">
                          {t.type}
                        </td>
                        <td className="py-3 pr-3 text-sm text-gray-700">
                          {t.id}
                        </td>
                        <td className="py-3 pr-3 text-sm text-gray-700">
                          {t.amount ?? "—"}
                        </td>
                        <td className="py-3 pr-3 text-sm text-gray-700">
                          {t.status ?? "—"}
                        </td>
                        <td className="py-3 pr-3 text-sm text-gray-700">
                          {formatDateValue(t.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </section>
    </>
  );
};

FinancePage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default FinancePage;
