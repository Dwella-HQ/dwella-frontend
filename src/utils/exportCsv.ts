export type CsvColumn<T> = {
  header: string;
  value: (row: T, index: number) => unknown;
};

export function csvCell(value: unknown): string {
  if (value === undefined || value === null) return "";
  const text =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "boolean"
        ? value
          ? "Yes"
          : "No"
        : String(value);

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function safeExportFilename(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function downloadCsv<T>(
  filename: string,
  columns: CsvColumn<T>[],
  rows: T[],
): void {
  const header = columns.map((column) => csvCell(column.header)).join(",");
  const lines = rows.map((row, rowIndex) =>
    columns.map((column) => csvCell(column.value(row, rowIndex))).join(","),
  );
  const csv = `\uFEFF${[header, ...lines].join("\r\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
