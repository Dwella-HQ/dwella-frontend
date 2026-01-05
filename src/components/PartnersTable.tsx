import * as React from "react";
import Link from "next/link";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

export type PartnerStatus = "Active" | "Suspended" | "Inactive";

export type Partner = {
  id: string;
  name: string;
  email: string;
  vendedTokens: string;
  dateAdded: string;
  status: PartnerStatus;
};

const statusClasses: Record<PartnerStatus, string> = {
  Active: "bg-brand-success-bg text-brand-success-text",
  Suspended: "bg-brand-failed-bg text-brand-failed-text",
  Inactive: "bg-brand-pending-bg text-brand-pending-text",
};

const columns: ColumnDef<Partner>[] = [
  {
    accessorKey: "id",
    header: "Partner ID",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-main/10 text-sm font-normal text-brand-ash">
          {row.original.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)}
        </div>
        <div>
          <p className="text-sm font-medium text-brand-black">
            {row.original.name}
          </p>
          <p className="text-xs text-brand-ash">{row.original.email}</p>
        </div>
      </div>
    ),
    meta: {
      headerClassName: "text-left",
      cellClassName: "text-left",
    },
  },
  {
    accessorKey: "vendedTokens",
    header: "Vended Tokens",
    cell: ({ row }) => (
      <span className="text-sm font-normal text-brand-black">
        {row.original.vendedTokens}
      </span>
    ),
    meta: {
      headerClassName: "text-left",
      cellClassName: "text-left",
    },
  },
  {
    accessorKey: "dateAdded",
    header: "Date added",
    cell: ({ row }) => (
      <span className="text-sm font-normal text-brand-black">
        {row.original.dateAdded}
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
    id: "action",
    header: "Action",
    cell: ({ row }) => (
      <Link
        href={`/dashboard/partners/${row.original.id}`}
        className="cursor-pointer text-sm font-medium text-brand-main transition-fx hover:text-brand-main/80"
      >
        Manage
      </Link>
    ),
    meta: {
      headerClassName: "text-left",
      cellClassName: "text-left",
    },
  },
];

export type PartnersTableProps = {
  partners: Partner[];
};

export const PartnersTable = ({ partners }: PartnersTableProps) => {
  // eslint-disable-next-line react-compiler/react-compiler
  const table = useReactTable({
    data: partners,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
                No partners found.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
};
