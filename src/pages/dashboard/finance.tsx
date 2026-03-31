import Head from "next/head";
import * as React from "react";
import type { NextPageWithLayout } from "../_app";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useToast } from "@/components/Toast";
import { getWalletsByLandlord, type WalletDTO } from "@/api/wallet";
import { ensureLandlordWallet, submitWalletBvn } from "@/api/wallet";
import {
  getWithdrawals,
  createWithdrawal,
  getWithdrawalBanks,
  resolveWithdrawalAccount,
  type WithdrawalRecipientDetailsDTO,
  type WithdrawalItemDTO,
  type WithdrawalCreateDTO,
} from "@/api/withdrawal";
import {
  createDeposit,
  getDepositsByWallet,
  type DepositItemDTO,
  type DepositCreateDTO,
} from "@/api/deposit";
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
  const maybeList =
    p?.data && Array.isArray(p.data)
      ? p.data
      : Array.isArray(p.withdrawals)
        ? p.withdrawals
        : Array.isArray((p.data as any)?.withdrawals)
          ? (p.data as any).withdrawals
          : Array.isArray((p.data as any)?.transactions)
            ? (p.data as any).transactions
            : [];

  return maybeList as WithdrawalItemDTO[];
};

const FinancePage: NextPageWithLayout = () => {
  const { showToast } = useToast();

  const [tab, setTab] = React.useState<FinanceTab>("overview");

  const { user, isLoading: isUserLoading } = useUser();
  const { selectedLandlord } = useSelectedLandlord();

  const [wallets, setWallets] = React.useState<WalletDTO[]>([]);
  const [activeWallet, setActiveWallet] = React.useState<WalletDTO | null>(
    null,
  );
  const [walletLoading, setWalletLoading] = React.useState(false);

  const landlordId = React.useMemo(() => {
    if (!user?.role) return null;
    if (user.role === "property_manager") return selectedLandlord?.id ?? null;
    if (user.role === "landlord" || user.role === "super_admin") {
      if (typeof window === "undefined") return null;
      return localStorage.getItem("landlordId");
    }
    return null;
  }, [selectedLandlord?.id, user?.role]);

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

  // Withdraw form state
  const [withdrawBanks, setWithdrawBanks] = React.useState<
    { bankCode?: string; bankName?: string; name?: string; code?: string }[]
  >([]);
  const [withdrawBanksLoading, setWithdrawBanksLoading] = React.useState(false);
  const [withdrawBankCode, setWithdrawBankCode] = React.useState("");
  const [withdrawAccountNumber, setWithdrawAccountNumber] = React.useState("");
  const [withdrawResolvedRecipient, setWithdrawResolvedRecipient] =
    React.useState<WithdrawalRecipientDetailsDTO | null>(null);
  const [withdrawResolveLoading, setWithdrawResolveLoading] =
    React.useState(false);
  const [withdrawAmount, setWithdrawAmount] = React.useState("");
  const [withdrawNarration, setWithdrawNarration] = React.useState("");
  const [withdrawSubmitting, setWithdrawSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const loadBanks = async () => {
      if (!activeWallet?.id) return;
      setWithdrawBanksLoading(true);
      const result = await getWithdrawalBanks(activeWallet.id);
      if (cancelled) return;
      if (result.success) {
        setWithdrawBanks(result.data);
      } else {
        setWithdrawBanks([]);
        showToast(result.error || "Failed to load banks", "error");
      }
      setWithdrawBanksLoading(false);
    };
    loadBanks();
    return () => {
      cancelled = true;
    };
  }, [activeWallet?.id, showToast]);

  const handleResolveWithdrawalRecipient = React.useCallback(async () => {
    if (!withdrawBankCode || !withdrawAccountNumber) {
      showToast("Bank code and account number are required", "error");
      return;
    }
    if (!activeWallet?.id) return;
    setWithdrawResolveLoading(true);
    const result = await resolveWithdrawalAccount({
      bankCode: withdrawBankCode,
      accountNumber: withdrawAccountNumber,
    });
    if (result.success) {
      const payload = result.data as any;
      const recipient =
        payload && payload.data ? payload.data : (payload as any);
      setWithdrawResolvedRecipient(recipient as WithdrawalRecipientDetailsDTO);
      showToast("Account resolved successfully", "success");
    } else {
      showToast(result.error || "Failed to resolve account", "error");
      setWithdrawResolvedRecipient(null);
    }
    setWithdrawResolveLoading(false);
  }, [activeWallet?.id, showToast, withdrawAccountNumber, withdrawBankCode]);

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
        const walletField = (w as any).walletId ?? (w as any).wallet?.id ?? "";
        return String(walletField) === String(activeWallet.id);
      });
      setWithdrawals(scoped);
    } else {
      setWithdrawals([]);
    }
    setDepositsLoading(false);
    setWithdrawalsLoading(false);
  }, [activeWallet?.id]);

  React.useEffect(() => {
    if (activeWallet?.id) {
      refreshLists();
    }
  }, [activeWallet?.id, refreshLists]);

  const handleSubmitWithdrawal = React.useCallback(async () => {
    if (!activeWallet?.id) {
      showToast("Wallet not ready", "error");
      return;
    }
    if (
      !withdrawAmount ||
      Number.isNaN(Number(withdrawAmount)) ||
      Number(withdrawAmount) <= 0
    ) {
      showToast("Enter a valid amount", "error");
      return;
    }
    if (!withdrawBankCode || !withdrawAccountNumber) {
      showToast("Bank code and account number are required", "error");
      return;
    }
    setWithdrawSubmitting(true);
    const payload: WithdrawalCreateDTO = {
      walletId: activeWallet.id,
      amount: Number(withdrawAmount),
      narration: withdrawNarration || undefined,
      recipientDetails:
        withdrawResolvedRecipient ??
        ({
          bankCode: withdrawBankCode,
          accountNumber: withdrawAccountNumber,
        } as any),
    };

    const result = await createWithdrawal(payload);
    if (result.success) {
      showToast("Withdrawal request created", "success");
      setWithdrawAmount("");
      setWithdrawNarration("");
      setWithdrawResolvedRecipient(null);
      setWithdrawAccountNumber("");
      setWithdrawBankCode("");
      refreshLists();
    } else {
      showToast(result.error || "Failed to create withdrawal", "error");
    }
    setWithdrawSubmitting(false);
  }, [
    activeWallet?.id,
    createWithdrawal,
    refreshLists,
    showToast,
    withdrawAccountNumber,
    withdrawAmount,
    withdrawBankCode,
    withdrawNarration,
    withdrawResolvedRecipient,
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
      showToast("Deposit request created", "success");
      setDepositAmount("");
      setDepositNarration("");
      refreshLists();
    } else {
      showToast(result.error || "Failed to create deposit", "error");
    }
    setDepositSubmitting(false);
  }, [
    activeWallet?.id,
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

    withdrawals.forEach((w) => {
      items.push({
        type: "withdrawal",
        id: String(w.id ?? Math.random()),
        amount: w.amount as any,
        status: w.status,
        narration: w.narration,
        createdAt: w.createdAt,
      });
    });

    deposits.forEach((d) => {
      items.push({
        type: "deposit",
        id: String(d.id ?? Math.random()),
        amount: d.amount as any,
        status: (d as any).status,
        narration: d.narration,
        createdAt: d.createdAt ?? (d as any).createdAt,
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
          <title>DWELLA NG · Finance</title>
        </Head>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand-main" />
        </div>
      </>
    );
  }

  if (!user || user.role === "tenant") {
    return (
      <>
        <Head>
          <title>DWELLA NG · Finance</title>
        </Head>
        <section className="space-y-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Finance page is not available for tenants.
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>DWELLA NG · Finance</title>
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
              <p className="mt-1 text-sm font-medium text-gray-900">
                {activeWallet?.id ?? "—"}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Currency: {activeWallet?.currency ?? "—"}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                BVN: {activeWallet?.bvn ? "Verified" : "Not verified"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Balance</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {activeWallet?.balance ?? "0"}
                </p>
              </div>
              <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Escrow Balance</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {activeWallet?.escrowBalance ?? "0"}
                </p>
              </div>
            </div>
          </div>

          {/* BVN verify (if needed) */}
          {activeWallet && !activeWallet.bvn ? (
            <BVNVerifyCard
              walletId={activeWallet.id}
              onVerified={refreshLists}
              onToast={showToast}
            />
          ) : null}
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

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Bank
                  </label>
                  <select
                    value={withdrawBankCode}
                    disabled={withdrawBanksLoading}
                    onChange={(e) => setWithdrawBankCode(e.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900"
                  >
                    <option value="">Select bank</option>
                    {withdrawBanks.map((b, idx) => {
                      const code = b.bankCode || b.code || "";
                      const name =
                        b.bankName || b.name || code || `Bank ${idx + 1}`;
                      return (
                        <option key={`${name}-${idx}`} value={code}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Account Number
                  </label>
                  <input
                    value={withdrawAccountNumber}
                    onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                    inputMode="numeric"
                    placeholder="Enter account number"
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleResolveWithdrawalRecipient}
                  disabled={withdrawResolveLoading}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition disabled:opacity-60"
                >
                  {withdrawResolveLoading ? "Resolving..." : "Resolve Account"}
                </button>
              </div>

              {withdrawResolvedRecipient ? (
                <div className="rounded-md border border-green-200 bg-green-50 p-4">
                  <p className="text-sm font-semibold text-green-900">
                    Recipient resolved
                  </p>
                  <p className="mt-1 text-sm text-green-800">
                    {withdrawResolvedRecipient.accountName
                      ? `Name: ${withdrawResolvedRecipient.accountName}`
                      : `Account resolved for ${withdrawAccountNumber}`}
                  </p>
                </div>
              ) : null}

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
                    setWithdrawResolvedRecipient(null);
                    setWithdrawAmount("");
                    setWithdrawNarration("");
                    setWithdrawAccountNumber("");
                    setWithdrawBankCode("");
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleSubmitWithdrawal}
                  disabled={withdrawSubmitting}
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
                            {w.recipientDetails?.accountName ??
                              w.recipientDetails?.accountNumber ??
                              "—"}
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
                  {depositSubmitting ? "Submitting..." : "Request Deposit"}
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
                            {(d as any).status ?? "—"}
                          </td>
                          <td className="py-3 pr-3 text-sm text-gray-700">
                            {formatDateValue((d as any).createdAt)}
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

const BVNVerifyCard = ({
  walletId,
  onVerified,
  onToast,
}: {
  walletId: string;
  onVerified: () => Promise<void> | void;
  onToast: (
    message: string,
    type?: "success" | "error" | "info" | "warning",
  ) => void;
}) => {
  const [bvn, setBvn] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleVerify = async () => {
    if (!bvn) {
      onToast("Enter your BVN", "error");
      return;
    }
    setSubmitting(true);
    const result = await submitWalletBvn(walletId, { bvn });
    if (result.success) {
      onToast("BVN verified successfully", "success");
      onVerified();
    } else {
      onToast(result.error || "BVN verification failed", "error");
    }
    setSubmitting(false);
  };

  return (
    <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
      <p className="text-sm font-semibold text-blue-900">Verify BVN</p>
      <p className="mt-1 text-sm text-blue-800">
        Submit your BVN to enable wallet operations.
      </p>

      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          value={bvn}
          onChange={(e) => setBvn(e.target.value)}
          placeholder="Enter BVN"
          inputMode="numeric"
          className="h-11 rounded-lg border border-blue-300 bg-white px-3 text-sm text-gray-900"
        />
        <button
          type="button"
          onClick={handleVerify}
          disabled={submitting}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition disabled:opacity-60"
        >
          {submitting ? "Verifying..." : "Verify"}
        </button>
      </div>
    </div>
  );
};

FinancePage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default FinancePage;
