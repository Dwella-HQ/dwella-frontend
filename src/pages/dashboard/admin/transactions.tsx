import Head from "next/head";
import * as React from "react";
import { Loader2, RefreshCw } from "lucide-react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getTransactions, type TransactionDTO } from "@/api/transaction";

function txDisplayId(tx: TransactionDTO): string {
  const r = tx as Record<string, unknown>;
  return String(r.reference ?? r.referenceId ?? tx.id ?? "—");
}

function nestedName(tx: TransactionDTO, key: string): string {
  const r = tx as Record<string, unknown>;
  const block = r[key];
  if (!block || typeof block !== "object") return "—";
  const o = block as Record<string, unknown>;
  const name = o.fullName ?? o.name ?? o.businessName ?? o.title ?? o.email;
  return typeof name === "string" && name.trim() ? name : "—";
}

function nestedProperty(tx: TransactionDTO): string {
  const r = tx as Record<string, unknown>;
  const prop = r.property ?? r.estate;
  if (!prop || typeof prop !== "object") return "—";
  const o = prop as Record<string, unknown>;
  const name = o.name ?? o.title;
  return typeof name === "string" ? name : "—";
}

function parseAmount(tx: TransactionDTO): number {
  const r = tx as Record<string, unknown>;
  const raw =
    r.amount ?? r.totalAmount ?? r.value ?? r.payableAmount ?? r.amountInKobo;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  if (typeof raw === "string") {
    const n = parseFloat(raw.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function formatMoney(n: number): string {
  if (!n) return "—";
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return String(n);
  }
}

function formatTxDate(tx: TransactionDTO): string {
  const raw = tx.createdAt ?? (tx as Record<string, unknown>).transactionDate;
  if (typeof raw !== "string") return "—";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? raw : d.toLocaleDateString("en-GB");
}

function normalizeStatus(raw: unknown): string {
  if (raw === undefined || raw === null) return "";
  return String(raw).trim();
}

function uiStatus(tx: TransactionDTO): "Pending" | "Success" | "Other" {
  const s = normalizeStatus(tx.status).toLowerCase();
  if (s.includes("pending") || s.includes("processing") || s.includes("init"))
    return "Pending";
  if (
    s.includes("success") ||
    s.includes("completed") ||
    s.includes("paid") ||
    s.includes("confirmed")
  )
    return "Success";
  return "Other";
}

const PAGE_SIZE = 15;

const AdminTransactionsPage: NextPageWithLayout = () => {
  const [status, setStatus] = React.useState<"All" | "Pending" | "Success">(
    "All",
  );
  const [page, setPage] = React.useState(1);
  const [rows, setRows] = React.useState<TransactionDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getTransactions();
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      setRows([]);
      return;
    }
    setRows(result.data);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = React.useMemo(() => {
    return rows.filter((tx) => {
      const u = uiStatus(tx);
      if (status === "All") return true;
      if (status === "Pending") return u === "Pending";
      if (status === "Success") return u === "Success";
      return true;
    });
  }, [rows, status]);

  const stats = React.useMemo(() => {
    const total = rows.length;
    let pending = 0;
    let success = 0;
    let volume = 0;
    for (const tx of rows) {
      volume += parseAmount(tx);
      const u = uiStatus(tx);
      if (u === "Pending") pending += 1;
      if (u === "Success") success += 1;
    }
    return { total, pending, success, volume };
  }, [rows]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const slice = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  React.useEffect(() => {
    setPage(1);
  }, [status, rows.length]);

  return (
    <>
      <Head>
        <title>DWELLA NG · Transactions</title>
      </Head>
      <AdminLayout title="Transactions">
        <section className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[12px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-6 gap-2.5">
            {[
              ["Total Transactions", String(stats.total)],
              ["Successful", String(stats.success)],
              ["Pending", String(stats.pending)],
              [
                "Other status",
                String(stats.total - stats.success - stats.pending),
              ],
              ["Rows loaded", String(rows.length)],
              ["Volume (parsed)", formatMoney(stats.volume)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-[#E2E8F0] bg-white p-3"
              >
                <p className="text-[11px] text-[#64748B]">{label}</p>
                <p className="text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
              {error}
            </p>
          ) : null}

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
            <div className="grid grid-cols-[1fr_300px_auto] items-center gap-3 text-xs">
              <input
                className="h-9 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3"
                placeholder="Search..."
                disabled
              />
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as "All" | "Pending" | "Success")
                }
                className="h-9 rounded-md border border-[#E2E8F0] px-3"
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Success">Success</option>
              </select>
              <button
                type="button"
                className="h-9 rounded-md border border-[#E2E8F0] px-4"
              >
                Filters
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Transactions</p>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#64748B]" />
              ) : null}
            </div>
            <p className="mb-3 text-xs text-[#64748B]">
              GET /transaction · Parsed amount/status fields may vary by backend
              shape.
            </p>
            <div className="overflow-auto">
              <table className="w-full min-w-[1050px] text-xs">
                <thead className="text-[#64748B]">
                  <tr>
                    <th className="py-2.5 text-left">Transaction ID</th>
                    <th className="py-2.5 text-left">Tenant</th>
                    <th className="py-2.5 text-left">Landlord</th>
                    <th className="py-2.5 text-left">Property</th>
                    <th className="py-2.5 text-left">Amount</th>
                    <th className="py-2.5 text-left">Date</th>
                    <th className="py-2.5 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {slice.map((tx, i) => (
                    <tr
                      key={`${txDisplayId(tx)}-${i}`}
                      className="border-t border-[#F1F5F9]"
                    >
                      <td className="py-2.5 font-mono">{txDisplayId(tx)}</td>
                      <td className="py-2.5">{nestedName(tx, "tenant")}</td>
                      <td className="py-2.5">{nestedName(tx, "landlord")}</td>
                      <td className="py-2.5">{nestedProperty(tx)}</td>
                      <td className="py-2.5">{formatMoney(parseAmount(tx))}</td>
                      <td className="py-2.5">{formatTxDate(tx)}</td>
                      <td className="py-2.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                            uiStatus(tx) === "Pending"
                              ? "bg-gray-100 text-gray-700"
                              : uiStatus(tx) === "Success"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-50 text-blue-800"
                          }`}
                        >
                          {normalizeStatus(tx.status) || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && filtered.length === 0 ? (
                <p className="py-8 text-center text-[12px] text-[#64748B]">
                  No transactions loaded.
                </p>
              ) : null}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-[#64748B]">
              <p>
                Page {safePage} · {filtered.length} row(s) after filter
              </p>
              <div className="inline-flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage <= 1}
                  className="rounded border border-[#E2E8F0] px-2 py-0.5 disabled:opacity-40"
                >
                  {"<"}
                </button>
                <span className="rounded bg-[#1E66FF] px-2 py-0.5 text-white">
                  {safePage}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPage((prev) => Math.min(pageCount, prev + 1))
                  }
                  disabled={safePage >= pageCount}
                  className="rounded border border-[#E2E8F0] px-2 py-0.5 disabled:opacity-40"
                >
                  {">"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default AdminTransactionsPage;
