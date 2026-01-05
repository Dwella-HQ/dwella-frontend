import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Eye, Flag, MoreVertical, Share2 } from "lucide-react";

export type TransactionStatus = "Successful" | "Pending" | "Failed";

export type Transaction = {
  id: string;
  name: string;
  reference: string;
  account: string;
  type: string;
  amount: string;
  fee: string;
  net: string;
  timeAgo: string;
  status: TransactionStatus;
};

const statusClasses: Record<TransactionStatus, string> = {
  Successful: "bg-brand-success-bg text-brand-success-text",
  Pending: "bg-brand-pending-bg text-brand-pending-text",
  Failed: "bg-brand-failed-bg text-brand-failed-text",
};

const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "id",
    header: "Payment Reference",
    cell: ({ row }) => (
      <span className="font-normal text-sm text-brand-black tracking-wide capitalize">
        {row.original.id}
      </span>
    ),
    meta: {
      headerClassName: "text-left",
      cellClassName: "text-left",
    },
  },
  {
    accessorKey: "name",
    header: "Description",
    cell: ({ row }) => (
      <span className="font-normal text-sm text-brand-black tracking-wide capitalize">
        {row.original.name}
      </span>
    ),
    meta: {
      headerClassName: "text-left",
      cellClassName: "text-left",
    },
  },
  {
    accessorKey: "amount",
    header: "Amount (₦)",
    cell: ({ row }) => (
      <span className="font-normal text-sm text-brand-black tracking-wide capitalize">
        {row.original.amount}
      </span>
    ),
    meta: {
      headerClassName: "text-left",
      cellClassName: "text-left",
    },
  },
  {
    accessorKey: "account",
    header: "Previous Balance (₦)",
    cell: ({ row }) => (
      <span className="font-normal text-sm text-brand-black tracking-wide capitalize">
        {row.original.account}
      </span>
    ),
    meta: {
      headerClassName: "text-left",
      cellClassName: "text-left",
    },
  },
  {
    accessorKey: "net",
    header: "New Balance (₦)",
    cell: ({ row }) => (
      <span className="font-normal text-sm text-brand-black tracking-wide capitalize">
        {row.original.net}
      </span>
    ),
    meta: {
      headerClassName: "text-left",
      cellClassName: "text-left",
    },
  },
  {
    accessorKey: "timeAgo",
    header: "Date",
    cell: ({ row }) => (
      <span className="font-normal text-sm text-brand-black tracking-wide capitalize">
        {row.original.timeAgo}
      </span>
    ),
    meta: {
      headerClassName: "text-left",
      cellClassName: "text-left",
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium capitalize ${statusClasses[row.original.status]}`}
      >
        {row.original.status}
      </span>
    ),
    meta: {
      headerClassName: "text-left",
      cellClassName: "text-left",
    },
  },
  {
    id: "actions",
    enableSorting: false,
    enableColumnFilter: false,
    header: "",
    cell: ({ row, table }) => {
      const transaction = row.original;
      const {
        options: { meta },
      } = table;

      return (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="rounded-md p-1 text-brand-ash transition-fx cursor-pointer hover:bg-brand-light-bg hover:text-brand-black"
              aria-label="Open actions"
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              sideOffset={6}
              className="w-44 rounded-lg border border-brand-border-light bg-brand-white p-1 shadow-lg focus:outline-none"
              onClick={(event) => event.stopPropagation()}
            >
              <DropdownMenu.Item
                onSelect={(event) => {
                  event.stopPropagation();
                  meta?.onView?.(transaction);
                }}
                className="transition-fx flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-brand-ash outline-none hover:bg-brand-main-bg hover:text-brand-main focus:bg-brand-main-bg focus:text-brand-main"
              >
                <Eye className="h-4 w-4" />
                View
              </DropdownMenu.Item>

              <DropdownMenu.Item
                onSelect={(event) => {
                  event.stopPropagation();
                  meta?.onReportIssue?.(transaction);
                }}
                className="transition-fx flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-brand-ash outline-none hover:bg-brand-main-bg hover:text-brand-main focus:bg-brand-main-bg focus:text-brand-main"
              >
                <Flag className="h-4 w-4" />
                Report Issue
              </DropdownMenu.Item>

              <DropdownMenu.Item
                onSelect={(event) => {
                  event.stopPropagation();
                  meta?.onShareReceipt?.(transaction);
                }}
                className="transition-fx flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-brand-ash outline-none hover:bg-brand-main-bg hover:text-brand-main focus:bg-brand-main-bg focus:text-brand-main"
              >
                <Share2 className="h-4 w-4" />
                Share Receipt
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      );
    },
    meta: {
      headerClassName: "text-left",
      cellClassName: "text-left",
    },
  },
];

export type TransactionTableProps = {
  transactions: Transaction[];
  onTransactionClick?: (transaction: Transaction) => void;
  onReportIssue?: (transaction: Transaction) => void;
  onShareReceipt?: (transaction: Transaction) => void;
};

export const TransactionTable = ({
  transactions,
  onTransactionClick,
  onReportIssue,
  onShareReceipt,
}: TransactionTableProps) => {
  // eslint-disable-next-line
  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      onView: onTransactionClick,
      onReportIssue,
      onShareReceipt,
    },
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-brand-border-light text-xs text-brand-ash">
        <thead className="bg-brand-light-bg text-[11px] uppercase tracking-wide text-brand-ash">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={`px-4 py-3 font-medium text-brand-black ${
                    header.column.columnDef.meta?.headerClassName ?? ""
                  }`}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-brand-border-light text-sm text-brand-black">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="transition-fx cursor-pointer hover:bg-brand-main-bg/40"
              onClick={() => onTransactionClick?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={`px-4 py-3 ${
                    cell.column.columnDef.meta?.cellClassName ?? ""
                  }`}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={table.getAllLeafColumns().length}
                className="px-4 py-6 text-center text-sm text-brand-ash"
              >
                No transactions found.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
};
