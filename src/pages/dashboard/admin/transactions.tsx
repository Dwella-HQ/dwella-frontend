import Head from "next/head";
import * as React from "react";
import { Loader2, RefreshCw, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  getTransactions,
  getTransactionById,
  type TransactionDTO,
} from "@/api/transaction";
import { getRentPaymentItems } from "@/api/rent-payment";
import type { RentPaymentItemDTO } from "@/api/rent-payment/rentPayment.schema";
import {
  buildRentPaymentIndex,
  formatActionLabel,
  formatTransactionRef,
  resolveLandlordLabel,
  resolveNarration,
  resolvePropertyLabel,
  resolveReceiverEmail,
  resolveSenderEmail,
  resolveTenantLabel,
  transactionApiId,
} from "@/lib/admin/transactionDisplay";

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

function parseCurrency(tx: TransactionDTO): string {
  const r = tx as Record<string, unknown>;
  const c = r.currency;
  return typeof c === "string" && c.trim() ? c.trim() : "NGN";
}

function formatUpdatedAt(tx: TransactionDTO): string {
  const r = tx as Record<string, unknown>;
  const u = r.updatedAt;
  if (typeof u !== "string") return "—";
  const d = new Date(u);
  return Number.isNaN(d.getTime()) ? u : d.toLocaleString("en-GB");
}

function gatewayPaidAtDisplay(tx: TransactionDTO): string {
  const r = tx as Record<string, unknown>;
  const meta = r.metaData;
  if (meta && typeof meta === "object") {
    const m = meta as Record<string, unknown>;
    const paid = m.paidAt ?? m.paid_at;
    if (typeof paid === "string" && paid.trim()) {
      const d = new Date(paid);
      return Number.isNaN(d.getTime()) ? paid : d.toLocaleString("en-GB");
    }
  }
  return "—";
}

function gatewayChannel(tx: TransactionDTO): string {
  const r = tx as Record<string, unknown>;
  const meta = r.metaData;
  if (meta && typeof meta === "object") {
    const m = meta as Record<string, unknown>;
    const ch = m.channel;
    if (typeof ch === "string" && ch.trim()) return ch.trim();
  }
  return "—";
}

function fullTransactionId(tx: TransactionDTO): string {
  const r = tx as Record<string, unknown>;
  return r.id != null ? String(r.id) : "—";
}

const PAGE_SIZE = 15;

const fieldShell =
  "h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-[12px] text-[#0F172A]";

const AdminTransactionsPage: NextPageWithLayout = () => {
  const [status, setStatus] = React.useState<"All" | "Pending" | "Success">(
    "All",
  );
  const [page, setPage] = React.useState(1);
  const [rows, setRows] = React.useState<TransactionDTO[]>([]);
  const [rentById, setRentById] = React.useState<
    Map<string, RentPaymentItemDTO>
  >(() => new Map());
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailListRow, setDetailListRow] =
    React.useState<TransactionDTO | null>(null);
  const [detailRemote, setDetailRemote] = React.useState<TransactionDTO | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailFetchNote, setDetailFetchNote] = React.useState<string | null>(
    null,
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const [txResult, rentResult] = await Promise.all([
      getTransactions(),
      getRentPaymentItems({ limit: 500 }),
    ]);
    setLoading(false);
    if (rentResult.success) {
      setRentById(buildRentPaymentIndex(rentResult.data));
    } else {
      setRentById(new Map());
    }
    if (!txResult.success) {
      setError(txResult.error);
      setRows([]);
      return;
    }
    setRows(txResult.data);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openDetailModal = React.useCallback((tx: TransactionDTO) => {
    setDetailListRow(tx);
    setDetailRemote(null);
    setDetailFetchNote(null);
    setDetailOpen(true);

    void (async () => {
      setDetailLoading(true);
      const r = tx as Record<string, unknown>;
      const candidates = [
        transactionApiId(tx),
        typeof r.reference === "string" ? r.reference : null,
        r.referenceId != null ? String(r.referenceId) : null,
      ].filter((x): x is string => Boolean(x && String(x).trim()));

      let loaded: TransactionDTO | null = null;
      let sawNetworkError = false;
      for (const id of candidates) {
        const res = await getTransactionById(id);
        if (res.success) {
          loaded = res.data;
          break;
        }
        if (
          res.error &&
          res.error !== "Invalid transaction response" &&
          res.error !== "Invalid response data format received"
        ) {
          sawNetworkError = true;
        }
      }
      setDetailLoading(false);
      if (loaded) {
        setDetailRemote(loaded);
        setDetailFetchNote(null);
      } else if (candidates.length === 0) {
        setDetailFetchNote(
          "This row has no transaction id — showing list payload only.",
        );
      } else if (sawNetworkError) {
        setDetailFetchNote(
          "Could not load details from the server — showing list payload only.",
        );
      } else {
        setDetailFetchNote(
          "Detail endpoint did not return usable data — showing list payload only.",
        );
      }
    })();
  }, []);

  const detailShown = detailRemote ?? detailListRow;

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
        <title>Dwelliva · Transactions</title>
      </Head>
      <AdminLayout title="Transactions">
        <section className="w-full min-w-0 space-y-4">
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

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["Total Transactions", String(stats.total)],
              ["Successful", String(stats.success)],
              ["Pending", String(stats.pending)],
              [
                "Other status",
                String(stats.total - stats.success - stats.pending),
              ],
              ["Records shown", String(rows.length)],
              ["Total volume", formatMoney(stats.volume)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-[#E2E8F0] bg-white p-3"
              >
                <p className="text-[11px] text-[#64748B]">{label}</p>
                <p className="text-xl font-semibold sm:text-2xl">{value}</p>
              </div>
            ))}
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
              {error}
            </p>
          ) : null}

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-3">
            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-[1fr_300px_auto] lg:items-center">
              <input className={fieldShell} placeholder="Search..." disabled />
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as "All" | "Pending" | "Success")
                }
                className={fieldShell}
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Success">Success</option>
              </select>
              <button
                type="button"
                className={`${fieldShell} inline-flex cursor-default items-center justify-center px-4`}
              >
                Filters
              </button>
            </div>
          </div>
          <div className="w-full min-w-0 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white p-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Transactions</p>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#64748B]" />
              ) : null}
            </div>
            <p className="mb-3 text-xs text-[#64748B]">
              From <code className="text-[11px]">GET /transaction</code>. Payer,
              property hint, and narration come from each row; rent-payment
              links fill gaps when IDs match. Open a row for full structured
              details (no raw JSON).
            </p>
            <div className="overflow-auto">
              <table className="w-full min-w-[1050px] text-xs">
                <thead className="text-[#64748B]">
                  <tr>
                    <th className="py-2.5 text-left">Reference</th>
                    <th className="py-2.5 text-left">From</th>
                    <th className="py-2.5 text-left">To</th>
                    <th className="py-2.5 text-left">Property / unit</th>
                    <th className="py-2.5 text-left">Amount</th>
                    <th className="py-2.5 text-left">Date</th>
                    <th className="py-2.5 text-left">Status</th>
                    <th className="py-2.5 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {slice.map((tx, i) => (
                    <tr
                      key={`${fullTransactionId(tx)}-${i}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => openDetailModal(tx)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ")
                          openDetailModal(tx);
                      }}
                      className="cursor-pointer border-t border-[#F1F5F9] hover:bg-[#F8FAFC]"
                    >
                      <td className="py-2.5 font-mono text-[11px]">
                        {formatTransactionRef(tx)}
                      </td>
                      <td className="max-w-[140px] truncate py-2.5">
                        {resolveTenantLabel(tx, rentById)}
                      </td>
                      <td className="max-w-[140px] truncate py-2.5">
                        {resolveLandlordLabel(tx)}
                      </td>
                      <td className="max-w-[180px] truncate py-2.5 text-[#334155]">
                        {resolvePropertyLabel(tx, rentById)}
                      </td>
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
                      <td className="max-w-[120px] truncate py-2.5 text-[#334155]">
                        {formatActionLabel(tx)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && filtered.length === 0 ? (
                <p className="py-8 text-center text-[12px] text-[#64748B]">
                  No transactions available.
                </p>
              ) : null}
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[11px] text-[#64748B]">
              <p>
                Page {safePage} · {filtered.length} record(s) shown
              </p>
              <div className="inline-flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage <= 1}
                  className="rounded border border-[#E2E8F0] bg-white px-2 py-0.5 disabled:opacity-40"
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
                  className="rounded border border-[#E2E8F0] bg-white px-2 py-0.5 disabled:opacity-40"
                >
                  {">"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <Dialog.Root
          open={detailOpen}
          onOpenChange={(open) => {
            setDetailOpen(open);
            if (!open) {
              setDetailListRow(null);
              setDetailRemote(null);
              setDetailFetchNote(null);
            }
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] max-h-[85vh] w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xl focus:outline-none sm:p-5">
              <div className="flex items-start justify-between gap-3 border-b border-[#F1F5F9] pb-3">
                <div>
                  <Dialog.Title className="text-base font-semibold text-[#0F172A]">
                    Transaction details
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-[12px] text-[#64748B]">
                    {detailLoading
                      ? "Loading from GET /transaction/{id}…"
                      : "Structured fields from the transaction record."}
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-md p-1 text-[#64748B] hover:bg-[#F1F5F9]"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Close>
              </div>

              {detailFetchNote ? (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900">
                  {detailFetchNote}
                </p>
              ) : null}

              {detailShown ? (
                <div className="mt-4 space-y-4 text-[12px]">
                  <section>
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                      Payment
                    </h3>
                    <dl className="grid grid-cols-[120px_1fr] gap-x-2 gap-y-2">
                      <dt className="text-[#64748B]">Amount</dt>
                      <dd className="font-medium">
                        {formatMoney(parseAmount(detailShown))}{" "}
                        <span className="font-normal text-[#64748B]">
                          ({parseCurrency(detailShown)})
                        </span>
                      </dd>
                      <dt className="text-[#64748B]">Status</dt>
                      <dd>{normalizeStatus(detailShown.status) || "—"}</dd>
                      <dt className="text-[#64748B]">Created</dt>
                      <dd>{formatTxDate(detailShown)}</dd>
                      <dt className="text-[#64748B]">Updated</dt>
                      <dd>{formatUpdatedAt(detailShown)}</dd>
                      <dt className="text-[#64748B]">Action</dt>
                      <dd>{formatActionLabel(detailShown)}</dd>
                      <dt className="text-[#64748B]">Method</dt>
                      <dd>
                        {typeof (detailShown as Record<string, unknown>)
                          .paymentMethod === "string"
                          ? String(
                              (detailShown as Record<string, unknown>)
                                .paymentMethod,
                            )
                          : "—"}
                      </dd>
                      <dt className="text-[#64748B]">Provider</dt>
                      <dd>
                        {typeof (detailShown as Record<string, unknown>)
                          .provider === "string"
                          ? String(
                              (detailShown as Record<string, unknown>).provider,
                            )
                          : "—"}
                      </dd>
                      <dt className="text-[#64748B]">Ledger type</dt>
                      <dd>
                        {typeof (detailShown as Record<string, unknown>)
                          .type === "string"
                          ? String(
                              (detailShown as Record<string, unknown>).type,
                            )
                          : "—"}
                      </dd>
                    </dl>
                  </section>

                  <section>
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                      Parties
                    </h3>
                    <dl className="grid grid-cols-[120px_1fr] gap-x-2 gap-y-2">
                      <dt className="text-[#64748B]">From (payer)</dt>
                      <dd className="font-medium">
                        {resolveTenantLabel(detailShown, rentById)}
                      </dd>
                      <dt className="text-[#64748B]">Payer email</dt>
                      <dd className="break-all">
                        {resolveSenderEmail(detailShown)}
                      </dd>
                      <dt className="text-[#64748B]">To (payee)</dt>
                      <dd className="font-medium">
                        {resolveLandlordLabel(detailShown)}
                      </dd>
                      <dt className="text-[#64748B]">Payee email</dt>
                      <dd className="break-all">
                        {resolveReceiverEmail(detailShown)}
                      </dd>
                      <dt className="text-[#64748B]">Property / unit</dt>
                      <dd>{resolvePropertyLabel(detailShown, rentById)}</dd>
                    </dl>
                  </section>

                  <section>
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                      Description
                    </h3>
                    <p className="whitespace-pre-wrap rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-[12px] text-[#334155]">
                      {(() => {
                        const n = resolveNarration(detailShown);
                        return n === "—"
                          ? "No narration on this transaction."
                          : n;
                      })()}
                    </p>
                  </section>

                  <section>
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                      Payment gateway
                    </h3>
                    <dl className="grid grid-cols-[120px_1fr] gap-x-2 gap-y-2">
                      <dt className="text-[#64748B]">Channel</dt>
                      <dd>{gatewayChannel(detailShown)}</dd>
                      <dt className="text-[#64748B]">Paid at</dt>
                      <dd>{gatewayPaidAtDisplay(detailShown)}</dd>
                    </dl>
                  </section>

                  <p className="border-t border-[#F1F5F9] pt-3 font-mono text-[10px] leading-relaxed text-[#94A3B8]">
                    Transaction ID: {fullTransactionId(detailShown)}
                  </p>
                </div>
              ) : null}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </AdminLayout>
    </>
  );
};

export default AdminTransactionsPage;
