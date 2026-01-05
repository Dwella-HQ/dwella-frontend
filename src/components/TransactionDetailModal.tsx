import * as React from "react";
import { X } from "lucide-react";

import type {
  Transaction,
  TransactionStatus,
} from "@/components/TransactionTable";
import type { CustomerTransaction } from "@/components/CustomerTransactionTable";
import type { WalletTransactionWithMetadata } from "@/api/wallet/mapWalletTransaction";
import type { ConsumerTransactionWithMetadata } from "@/api/consumer/mapConsumerTransaction";

const statusClasses: Record<TransactionStatus, string> = {
  Successful: "bg-brand-success-bg text-brand-success-text",
  Pending: "bg-brand-pending-bg text-brand-pending-text",
  Failed: "bg-brand-failed-bg text-brand-failed-text",
};

export type TransactionDetailModalProps = {
  transaction: Transaction | CustomerTransaction | WalletTransactionWithMetadata | ConsumerTransactionWithMetadata | null;
  onClose: () => void;
  highlight?: string;
  primaryAction?: { label: string; variant: "primary" | "danger" };
  secondaryAction?: string;
  onReportIssue?: () => void;
  onShareReceipt?: () => void;
};

/**
 * Format date and time from ISO string
 */
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  return date.toLocaleString("en-NG", options).replace(",", " ·");
};

export const TransactionDetailModal = ({
  transaction,
  onClose,
  highlight = "NESCO",
  primaryAction = { label: "Report Issue", variant: "danger" },
  secondaryAction = "Share Receipt",
  onReportIssue,
  onShareReceipt,
}: TransactionDetailModalProps) => {
  if (!transaction) return null;

  // Check if this is a wallet transaction with metadata
  const isWalletTransaction = "walletTransaction" in transaction && transaction.walletTransaction;
  const walletTx = isWalletTransaction ? transaction.walletTransaction : null;
  
  // Check if this is a consumer transaction with metadata
  const isConsumerTransaction = "consumerTransaction" in transaction && transaction.consumerTransaction;
  const consumerTx = isConsumerTransaction ? transaction.consumerTransaction : null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-brand-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 space-y-8 rounded-2xl border border-brand-border-light bg-brand-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-medium capitalize tracking-wide text-brand-black">
              Transaction Details
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-brand-ash cursor-pointer hover:bg-brand-light-bg hover:text-brand-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-xl bg-brand-main-bg p-4">
          <p className="text-base font-medium text-brand-ash">
            {isWalletTransaction
              ? transaction.name
              : isConsumerTransaction
              ? `Token Purchase for ${transaction.name}`
              : `Token Purchase from ${highlight}`}
          </p>
          <p className="mt-1 text-base font-semibold text-brand-black">
            {transaction.amount}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium capitalize ${statusClasses[transaction.status]}`}
            >
              {transaction.status}
            </span>
            {isWalletTransaction && walletTx && (
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                walletTx.type === "credit" 
                  ? "bg-brand-success-bg text-brand-success-text" 
                  : "bg-brand-failed-bg text-brand-failed-text"
              }`}>
                {walletTx.type === "credit" ? "Credit" : "Debit"}
              </span>
            )}
          </div>
        </div>

        <dl className="grid gap-3 text-xs text-brand-ash border border-brand-border-light rounded-lg p-4">
          <div className="flex items-center justify-between text-base font-medium text-brand-black">
            <dt>Overview</dt>
          </div>
          {isWalletTransaction && walletTx ? (
            <>
              <div className="flex items-center justify-between">
                <dt>Reference</dt>
                <dd className="text-brand-black">{transaction.reference}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Description</dt>
                <dd className="text-brand-black">{transaction.name}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Transaction Type</dt>
                <dd className="text-brand-black capitalize">{transaction.type}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Amount</dt>
                <dd className="text-brand-black">{transaction.amount}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Previous Balance</dt>
                <dd className="text-brand-black">{transaction.account}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Current Balance</dt>
                <dd className="text-brand-black">{transaction.net}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Status</dt>
                <dd className="text-brand-black capitalize">{transaction.status}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Confirmed</dt>
                <dd className={`font-medium ${walletTx.confirmed ? "text-brand-success-text" : "text-brand-pending-text"}`}>
                  {walletTx.confirmed ? "Yes" : "No"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Date &amp; Time</dt>
                <dd className="text-brand-black">{formatDateTime(walletTx.createdAt)}</dd>
              </div>
            </>
          ) : isConsumerTransaction && consumerTx ? (
            <>
              <div className="flex items-center justify-between">
                <dt>Transaction Reference</dt>
                <dd className="text-brand-black">{consumerTx.transaction_reference}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Customer Name</dt>
                <dd className="text-brand-black">{consumerTx.customer}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Account Number</dt>
                <dd className="text-brand-black">{consumerTx.account_number}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Meter Number</dt>
                <dd className="text-brand-black">{consumerTx.meter_number}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Tokens (kWh)</dt>
                <dd className="text-brand-black">{consumerTx.kwh} kWh</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Token</dt>
                <dd className="text-brand-black font-mono text-xs">{consumerTx.token}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Amount</dt>
                <dd className="text-brand-black">{transaction.amount}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Transaction Charge</dt>
                <dd className="text-brand-black">{transaction.fee}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>VAT</dt>
                <dd className="text-brand-black">₦{parseFloat(consumerTx.vat).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Debt Reconciliation</dt>
                <dd className="text-brand-black">₦{parseFloat(consumerTx.debt_reconciliation).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Charged Amount</dt>
                <dd className="text-brand-black">₦{parseFloat(consumerTx.charged_amount).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Net Amount</dt>
                <dd className="text-brand-black">{transaction.net}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Payment Type</dt>
                <dd className="text-brand-black capitalize">{consumerTx.payment_type}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Account Type</dt>
                <dd className="text-brand-black">{consumerTx.account_type}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Tariff</dt>
                <dd className="text-brand-black">{consumerTx.tariff}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Feeder</dt>
                <dd className="text-brand-black capitalize">{consumerTx.feeder.replace(/-/g, " ")}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Status</dt>
                <dd className="text-brand-black capitalize">{transaction.status}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Date &amp; Time</dt>
                <dd className="text-brand-black">{formatDateTime(consumerTx.date)}</dd>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <dt>Transaction ID</dt>
                <dd className="text-brand-black">{transaction.id}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Token</dt>
                <dd className="text-brand-black">{transaction.type}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Amount</dt>
                <dd className="text-brand-black">{transaction.amount}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Fees</dt>
                <dd className="text-brand-black">{transaction.fee}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Net Amount</dt>
                <dd className="text-brand-black">{transaction.net}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Payment Method</dt>
                <dd className="text-brand-black">Bank Transfer</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Date &amp; Time</dt>
                <dd className="text-brand-black">Oct 04, 2025 · 09:42 AM</dd>
              </div>
            </>
          )}
        </dl>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onReportIssue}
            className={`transition-fx inline-flex flex-1 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium cursor-pointer ${
              primaryAction.variant === "primary"
                ? "bg-brand-main text-brand-white hover:bg-brand-main/90"
                : "bg-brand-failed-bg text-brand-failed-text hover:bg-brand-failed-text/90 hover:text-brand-white"
            }`}
          >
            {primaryAction.label}
          </button>
          <button
            type="button"
            onClick={onShareReceipt}
            className="transition-fx inline-flex flex-1 items-center justify-center rounded-lg border border-brand-main px-4 py-2 text-sm font-medium text-brand-main cursor-pointer hover:border-brand-main hover:text-brand-white hover:bg-brand-main"
          >
            {secondaryAction}
          </button>
        </div>
      </div>
    </>
  );
};
