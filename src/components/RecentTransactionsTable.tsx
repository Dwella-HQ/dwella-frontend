import * as React from "react";

import type {
  Transaction,
  TransactionStatus,
} from "@/components/TransactionTable";

const statusClasses: Record<TransactionStatus, string> = {
  Successful: "bg-brand-success-bg text-brand-success-text",
  Pending: "bg-brand-pending-bg text-brand-pending-text",
  Failed: "bg-brand-failed-bg text-brand-failed-text",
};

export type RecentTransactionsTableProps = {
  transactions: Transaction[];
  onViewAll?: () => void;
};

export const RecentTransactionsTable = ({
  transactions,
  onViewAll,
}: RecentTransactionsTableProps) => {
  return (
    <div className="rounded-2xl border border-brand-border-light bg-brand-white shadow-sm">
      <div className="flex items-center justify-between border-b border-brand-border-light px-6 py-4">
        <div>
          <h3 className="text-base font-semibold text-brand-black">
            Recent Transactions
          </h3>
          <p className="text-xs text-brand-ash">
            Latest transactions with Partner
          </p>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="transition-fx text-sm font-medium text-brand-main hover:text-brand-main/80"
        >
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-border-light text-xs text-brand-ash">
          <thead className="bg-brand-light-bg text-[11px] uppercase tracking-wide text-brand-ash">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-brand-black">
                Transaction ID
              </th>
              <th className="px-6 py-3 text-left font-medium text-brand-black">
                Name
              </th>
              <th className="px-6 py-3 text-left font-medium text-brand-black">
                Tokens
              </th>
              <th className="px-6 py-3 text-left font-medium text-brand-black">
                Amount
              </th>
              <th className="px-6 py-3 text-left font-medium text-brand-black">
                Date
              </th>
              <th className="px-6 py-3 text-left font-medium text-brand-black">
                Account Number
              </th>
              <th className="px-6 py-3 text-left font-medium text-brand-black">
                Address
              </th>
              <th className="px-6 py-3 text-left font-medium text-brand-black">
                Status
              </th>
              <th className="px-6 py-3 text-right font-medium text-brand-black"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border-light text-sm text-brand-black">
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="transition-fx hover:bg-brand-main-bg/40"
              >
                <td className="px-6 py-4">
                  <span className="font-medium text-brand-black">
                    {transaction.id}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-brand-black">
                    {transaction.name}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-brand-black">
                    {transaction.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-brand-black">
                    {transaction.amount}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-brand-ash">
                    {transaction.timeAgo}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-brand-black">
                    {transaction.account}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-brand-ash">
                    {transaction.reference}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusClasses[transaction.status]}`}
                  >
                    {transaction.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    className="text-brand-ash hover:text-brand-black"
                  >
                    ⋮
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
