import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }

  interface TableMeta<TData> {
    onView?: (row: TData) => void;
    onReportIssue?: (row: TData) => void;
    onShareReceipt?: (row: TData) => void;
  }
}
