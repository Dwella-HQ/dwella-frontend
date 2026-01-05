import Head from "next/head";
import * as React from "react";
import { Search, WalletIcon, UsersIcon, Loader2 } from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { TransactionTable } from "@/components/TransactionTable";
import { CustomerTransactionTable } from "@/components/CustomerTransactionTable";
import { TransactionDetailModal } from "@/components/TransactionDetailModal";
import type {
  Transaction,
  TransactionStatus,
} from "@/components/TransactionTable";
import type { CustomerTransaction } from "@/components/CustomerTransactionTable";
import {
  StatusFilterDropdown,
  type StatusFilterDropdownValue,
} from "@/components/StatusFilterDropdown";
import {
  DateRangeFilterDropdown,
  type DateRangeFilterValue,
  type DateRangePreset,
} from "@/components/DateRangeFilterDropdown";
import type { DateRange } from "react-day-picker";
import { getWalletTransactions, mapWalletTransaction } from "@/api/wallet";
import type { WalletTransactionWithMetadata } from "@/api/wallet";
import { getConsumerTransactions, mapConsumerTransaction } from "@/api/consumer";
import type { ConsumerTransactionWithMetadata } from "@/api/consumer";

import type { NextPageWithLayout } from "../_app";

const TransactionsPage: NextPageWithLayout = () => {
  const [activeTab, setActiveTab] = React.useState<"wallet" | "customers">(
    "wallet"
  );
  const [selectedTransaction, setSelectedTransaction] = React.useState<
    Transaction | CustomerTransaction | WalletTransactionWithMetadata | ConsumerTransactionWithMetadata | null
  >(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | TransactionStatus
  >("all");
  const [dateFilter, setDateFilter] = React.useState<DateRangeFilterValue>({
    preset: "last_12_months",
  });
  const [searchQuery, setSearchQuery] = React.useState("");

  // Wallet transactions state
  const [walletTransactions, setWalletTransactions] = React.useState<
    WalletTransactionWithMetadata[]
  >([]);
  const [isLoadingWallet, setIsLoadingWallet] = React.useState(false);
  const [walletError, setWalletError] = React.useState<string | null>(null);
  const [walletPagination, setWalletPagination] = React.useState<{
    total: number;
    currentPage: number;
    pageTotal: number;
    pageSize: number;
    prevPage: number | null;
    nextPage: number | null;
  } | null>(null);

  // Consumer transactions state
  const [consumerTransactions, setConsumerTransactions] = React.useState<
    ConsumerTransactionWithMetadata[]
  >([]);
  const [isLoadingConsumer, setIsLoadingConsumer] = React.useState(false);
  const [consumerError, setConsumerError] = React.useState<string | null>(null);
  const [consumerPagination, setConsumerPagination] = React.useState<{
    total: number;
    currentPage: number;
    pageTotal: number;
    pageSize: number;
    prevPage: number | null;
    nextPage: number | null;
  } | null>(null);

  const token = React.useMemo(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken");
    }
    return null;
  }, []);

  const handleStatusFilterChange = React.useCallback(
    (value: StatusFilterDropdownValue) => {
      if (value === "Active" || value === "Suspended" || value === "Inactive") {
        // Partner statuses are not applicable for transactions
        return;
      }
      setStatusFilter(value);
    },
    []
  );

  const handleReportIssue = React.useCallback(
    (transaction: Transaction | CustomerTransaction) => {
      console.info("Report issue for transaction:", transaction.id);
    },
    []
  );

  const handleShareReceipt = React.useCallback(
    (transaction: Transaction | CustomerTransaction) => {
      console.info("Share receipt for transaction:", transaction.id);
    },
    []
  );

  // Fetch wallet transactions
  const fetchWalletTransactions = React.useCallback(async () => {
    if (!token || activeTab !== "wallet") return;

    setIsLoadingWallet(true);
    setWalletError(null);

    const result = await getWalletTransactions(token, currentPage);

    if (result.success) {
      const mapped = result.data.data.transactions.map(mapWalletTransaction);
      setWalletTransactions(mapped);
      setWalletPagination({
        total: result.data.data.total,
        currentPage: result.data.data.pagination.currentPage,
        pageTotal: result.data.data.pagination.pageTotal,
        pageSize: result.data.data.pagination.pageSize,
        prevPage: result.data.data.pagination.prevPage,
        nextPage: result.data.data.pagination.nextPage,
      });
    } else {
      setWalletError(result.error);
      setWalletTransactions([]);
    }

    setIsLoadingWallet(false);
  }, [token, activeTab, currentPage]);

  // Fetch consumer transactions
  const fetchConsumerTransactions = React.useCallback(async () => {
    if (!token || activeTab !== "customers") return;

    setIsLoadingConsumer(true);
    setConsumerError(null);

    const result = await getConsumerTransactions(token, currentPage);

    if (result.success) {
      const mapped = result.data.data.transactions.map(mapConsumerTransaction);
      setConsumerTransactions(mapped);
      setConsumerPagination({
        total: result.data.data.total,
        currentPage: result.data.data.pagination.currentPage,
        pageTotal: result.data.data.pagination.pageTotal,
        pageSize: result.data.data.pagination.pageSize,
        prevPage: result.data.data.pagination.prevPage,
        nextPage: result.data.data.pagination.nextPage,
      });
    } else {
      setConsumerError(result.error);
      setConsumerTransactions([]);
    }

    setIsLoadingConsumer(false);
  }, [token, activeTab, currentPage]);

  React.useEffect(() => {
    if (activeTab === "wallet") {
      fetchWalletTransactions();
    } else if (activeTab === "customers") {
      fetchConsumerTransactions();
    }
  }, [fetchWalletTransactions, fetchConsumerTransactions, activeTab]);

  // Reset to page 1 when switching tabs
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Search filter function for wallet transactions
  const matchesSearchQuery = React.useCallback((transaction: WalletTransactionWithMetadata, query: string): boolean => {
    if (!query.trim()) return true;

    const searchLower = query.toLowerCase();
    const searchableText = [
      transaction.id,
      transaction.reference,
      transaction.name,
      transaction.amount,
      transaction.account,
      transaction.net,
      transaction.type,
    ].join(" ").toLowerCase();

    return searchableText.includes(searchLower);
  }, []);

  // Search filter function for consumer transactions
  const matchesConsumerSearchQuery = React.useCallback((transaction: ConsumerTransactionWithMetadata, query: string): boolean => {
    if (!query.trim()) return true;

    const searchLower = query.toLowerCase();
    const searchableText = [
      transaction.id,
      transaction.reference,
      transaction.name,
      transaction.account,
      transaction.amount,
      transaction.net,
      transaction.type,
    ].join(" ").toLowerCase();

    return searchableText.includes(searchLower);
  }, []);

  // Calculate date range from preset
  const getDateRangeFromPreset = React.useCallback((preset: DateRangePreset): DateRange | null => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (preset) {
      case "last_7_days": {
        const from = new Date(today);
        from.setDate(from.getDate() - 7);
        return { from, to: today };
      }
      case "last_30_days": {
        const from = new Date(today);
        from.setDate(from.getDate() - 30);
        return { from, to: today };
      }
      case "last_6_months": {
        const from = new Date(today);
        from.setMonth(from.getMonth() - 6);
        return { from, to: today };
      }
      case "last_12_months": {
        const from = new Date(today);
        from.setMonth(from.getMonth() - 12);
        return { from, to: today };
      }
      case "custom":
        return null; // Use dateFilter.range for custom
      default:
        return null;
    }
  }, []);

  // Get the effective date range for filtering
  const effectiveDateRange = React.useMemo(() => {
    if (dateFilter.preset === "custom" && dateFilter.range) {
      return dateFilter.range;
    }
    return getDateRangeFromPreset(dateFilter.preset);
  }, [dateFilter, getDateRangeFromPreset]);

  // Check if a date falls within the date range
  const isDateInRange = React.useCallback((dateString: string): boolean => {
    if (!effectiveDateRange || !effectiveDateRange.from) {
      return true; // No filter applied
    }

    const transactionDate = new Date(dateString);
    const from = new Date(effectiveDateRange.from);
    from.setHours(0, 0, 0, 0);

    const to = effectiveDateRange.to ? new Date(effectiveDateRange.to) : new Date();
    to.setHours(23, 59, 59, 999);

    return transactionDate >= from && transactionDate <= to;
  }, [effectiveDateRange]);

  const filteredWalletTransactions = React.useMemo(() => {
    let filtered = walletTransactions;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.status === statusFilter
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((transaction) =>
        matchesSearchQuery(transaction, searchQuery)
      );
    }

    // Apply date filter
    filtered = filtered.filter((transaction) => {
      if (!transaction.walletTransaction) return true;
      return isDateInRange(transaction.walletTransaction.createdAt);
    });

    return filtered;
  }, [walletTransactions, statusFilter, searchQuery, matchesSearchQuery, isDateInRange]);

  const filteredCustomerTransactions = React.useMemo(() => {
    let filtered = consumerTransactions;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.status === statusFilter
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((transaction) =>
        matchesConsumerSearchQuery(transaction, searchQuery)
      );
    }

    // Apply date filter
    filtered = filtered.filter((transaction) => {
      if (!transaction.consumerTransaction) return true;
      return isDateInRange(transaction.consumerTransaction.date);
    });

    return filtered;
  }, [consumerTransactions, statusFilter, searchQuery, matchesConsumerSearchQuery, isDateInRange]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, dateFilter]);

  const handleDatePresetChange = React.useCallback(
    (preset: DateRangePreset) => {
      setDateFilter((previous) => ({
        preset,
        range: preset === "custom" ? previous.range : undefined,
      }));
    },
    []
  );

  const handleCustomRangeChange = React.useCallback(
    (range: DateRange | undefined) => {
      setDateFilter((previous) => ({
        preset: range ? "custom" : previous.preset,
        range,
      }));
    },
    []
  );

  const handleSearchChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  return (
    <>
      <Head>
        <title>NESCO Partners · Transactions</title>
      </Head>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 border-b border-brand-border-light">
            <button
              type="button"
              onClick={() => setActiveTab("wallet")}
              className={`transition-fx relative px-4 py-3 text-base font-medium transition-colors ${
                activeTab === "wallet"
                  ? "text-brand-main"
                  : "text-brand-ash hover:text-brand-black"
              }`}
            >
              <span className="flex items-center gap-2">
                Wallet History
                <WalletIcon className="h-4 w-4 text-brand-main" />
              </span>
              {activeTab === "wallet" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-main" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("customers")}
              className={`transition-fx relative px-4 py-3 text-base font-medium transition-colors ${
                activeTab === "customers"
                  ? "text-brand-main"
                  : "text-brand-ash hover:text-brand-black"
              }`}
            >
              <span className="flex items-center gap-2">
                Customers
                <UsersIcon className="h-4 w-4 text-brand-main" />
              </span>
              {activeTab === "customers" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-main" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-brand-border-light bg-brand-white p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ash" />
            <input
              type="text"
              placeholder="Search transactions"
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-1/3 rounded-lg border border-brand-border-light bg-brand-light-bg py-2 pl-10 pr-4 text-sm text-brand-black placeholder:text-brand-ash focus:border-brand-main focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusFilterDropdown
              value={statusFilter}
              onChange={handleStatusFilterChange}
            />
          </div>

          <div className="flex items-center gap-3">
            <DateRangeFilterDropdown
              value={dateFilter}
              onPresetChange={handleDatePresetChange}
              onCustomRangeChange={handleCustomRangeChange}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-brand-border-light bg-brand-white shadow-sm">
          {activeTab === "wallet" ? (
            <>
              {isLoadingWallet ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-main" />
                </div>
              ) : walletError ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm text-brand-failed-text">{walletError}</p>
                </div>
              ) : filteredWalletTransactions.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm text-brand-ash">No transactions found</p>
                </div>
              ) : (
                <TransactionTable
                  transactions={filteredWalletTransactions}
                  onTransactionClick={setSelectedTransaction}
                  onReportIssue={handleReportIssue}
                  onShareReceipt={handleShareReceipt}
                />
              )}
              {walletPagination && !isLoadingWallet && !walletError && (
                <div className="flex items-center justify-between border-t border-brand-border-light px-6 py-4 text-xs text-brand-ash">
                  <span>
                    Page {walletPagination.currentPage} of {walletPagination.pageTotal}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }
                      disabled={!walletPagination.prevPage}
                      className="transition-fx inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border-light text-sm hover:border-brand-main hover:text-brand-main disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ‹
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: walletPagination.pageTotal }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                              currentPage === page
                                ? "bg-brand-main text-brand-white"
                                : "border border-brand-border-light hover:border-brand-main hover:text-brand-main"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((p) =>
                          walletPagination.nextPage ? walletPagination.nextPage : p
                        )
                      }
                      disabled={!walletPagination.nextPage}
                      className="transition-fx inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border-light text-sm hover:border-brand-main hover:text-brand-main disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ›
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{walletPagination.pageSize}/Page</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {isLoadingConsumer ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-main" />
                </div>
              ) : consumerError ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm text-brand-failed-text">{consumerError}</p>
                </div>
              ) : filteredCustomerTransactions.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm text-brand-ash">No transactions found</p>
                </div>
              ) : (
                <CustomerTransactionTable
                  transactions={filteredCustomerTransactions}
                  onTransactionClick={setSelectedTransaction}
                  onReportIssue={handleReportIssue}
                  onShareReceipt={handleShareReceipt}
                />
              )}
              {consumerPagination && !isLoadingConsumer && !consumerError && (
                <div className="flex items-center justify-between border-t border-brand-border-light px-6 py-4 text-xs text-brand-ash">
                  <span>
                    Page {consumerPagination.currentPage} of {consumerPagination.pageTotal}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }
                      disabled={!consumerPagination.prevPage}
                      className="transition-fx inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border-light text-sm hover:border-brand-main hover:text-brand-main disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ‹
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: consumerPagination.pageTotal }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
                              currentPage === page
                                ? "bg-brand-main text-brand-white"
                                : "border border-brand-border-light hover:border-brand-main hover:text-brand-main"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((p) =>
                          consumerPagination.nextPage ? consumerPagination.nextPage : p
                        )
                      }
                      disabled={!consumerPagination.nextPage}
                      className="transition-fx inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border-light text-sm hover:border-brand-main hover:text-brand-main disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ›
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{consumerPagination.pageSize}/Page</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onReportIssue={() => {
            if (selectedTransaction) {
              handleReportIssue(selectedTransaction);
            }
          }}
          onShareReceipt={() => {
            if (selectedTransaction) {
              handleShareReceipt(selectedTransaction);
            }
          }}
        />
      )}
    </>
  );
};

TransactionsPage.getLayout = (page) => (
  <DashboardLayout
    heading="Transactions"
    byText="Monitor and manage partner and customer activities."
  >
    {page}
  </DashboardLayout>
);

export default TransactionsPage;
