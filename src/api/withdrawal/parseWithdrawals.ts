import type { WithdrawalItemDTO } from "./withdrawal.schema";
import { withdrawalItemSchema } from "./withdrawal.schema";

function extractArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  const inner = obj.data;
  if (Array.isArray(inner)) return inner;
  if (inner && typeof inner === "object") {
    const nested = inner as Record<string, unknown>;
    for (const key of ["items", "results", "rows", "records", "withdrawals"]) {
      const v = nested[key];
      if (Array.isArray(v)) return v;
    }
  }
  for (const key of ["items", "results", "rows", "records", "withdrawals"]) {
    const v = obj[key];
    if (Array.isArray(v)) return v;
  }
  return [];
}

export function parseWithdrawalList(raw: unknown): WithdrawalItemDTO[] {
  return extractArray(raw)
    .map((item) => withdrawalItemSchema.safeParse(item))
    .filter((r): r is { success: true; data: WithdrawalItemDTO } => r.success)
    .map((r) => r.data);
}
