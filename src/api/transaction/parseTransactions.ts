import type { TransactionDTO } from "./transaction.schema";
import { transactionSchema } from "./transaction.schema";

function extractArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  const inner = obj.data;
  if (Array.isArray(inner)) return inner;
  if (inner && typeof inner === "object") {
    const nested = inner as Record<string, unknown>;
    for (const key of ["items", "results", "rows", "records"]) {
      const v = nested[key];
      if (Array.isArray(v)) return v;
    }
  }
  for (const key of ["items", "results", "rows", "records"]) {
    const v = obj[key];
    if (Array.isArray(v)) return v;
  }
  return [];
}

export function parseTransactionList(raw: unknown): TransactionDTO[] {
  return extractArray(raw)
    .map((item) => transactionSchema.safeParse(item))
    .filter((r): r is { success: true; data: TransactionDTO } => r.success)
    .map((r) => r.data);
}
