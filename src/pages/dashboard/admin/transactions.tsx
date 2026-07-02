import Head from "next/head";
import * as React from "react";
import { Download, Loader2, RefreshCw, X } from "lucide-react";
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
import { getWithdrawalItems, type WithdrawalItemDTO } from "@/api/withdrawal";
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
import { downloadCsv, todayStamp } from "@/utils/exportCsv";

function parseAmount(tx: TransactionDTO): number {
  const raw = rawTransactionAmount(tx);
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  if (typeof raw === "string") {
    const n = parseFloat(raw.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function rawTransactionAmount(tx: TransactionDTO): unknown {
  const r = tx as Record<string, unknown>;
  return (
    r.amount ?? r.totalAmount ?? r.value ?? r.payableAmount ?? r.amountInKobo
  );
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

function transactionSortTime(tx: TransactionDTO): number {
  const r = tx as Record<string, unknown>;
  const raw = r.createdAt ?? r.transactionDate ?? r.updatedAt;
  if (typeof raw !== "string") return 0;
  const time = new Date(raw).getTime();
  return Number.isFinite(time) ? time : 0;
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

function normalizedSearchText(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value).toLowerCase();
}

function transactionMatchesSearch(
  tx: TransactionDTO,
  rentById: Map<string, RentPaymentItemDTO>,
  withdrawal: WithdrawalItemDTO | null,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const r = tx as Record<string, unknown>;
  const fields = [
    fullTransactionId(tx),
    formatTransactionRef(tx),
    r.reference,
    r.referenceId,
    parseAmount(tx),
    formatMoney(parseAmount(tx)),
    parseCurrency(tx),
    formatTxDate(tx),
    formatUpdatedAt(tx),
    normalizeStatus(tx.status),
    formatActionLabel(tx),
    resolveTenantLabel(tx, rentById),
    resolveLandlordLabel(tx),
    resolvePropertyLabel(tx, rentById),
    resolveSenderEmail(tx),
    resolveReceiverEmail(tx),
    resolveNarration(tx),
    gatewayChannel(tx),
    r.provider,
    r.paymentMethod,
    r.type,
    withdrawal?.id,
    withdrawal?.status,
    withdrawal?.recipientDetails?.accountName,
    withdrawal?.recipientDetails?.fullName,
    withdrawal?.recipientDetails?.bankName,
    withdrawal?.recipientDetails?.accountNumber,
  ];

  return fields.some((field) => normalizedSearchText(field).includes(q));
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

function amountToNumber(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw === "string") {
    const n = Number(raw.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function formatDateTime(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) return "—";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? raw : d.toLocaleString("en-GB");
}

function nestedString(source: unknown, path: string[]): string | null {
  let current = source;
  for (const key of path) {
    if (!current || typeof current !== "object") return null;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" && current.trim() ? current.trim() : null;
}

function candidateStrings(source: unknown, paths: string[][]): string[] {
  return paths
    .map((path) => nestedString(source, path))
    .filter((value): value is string => Boolean(value));
}

function isWithdrawalTransaction(tx: TransactionDTO): boolean {
  return formatActionLabel(tx).toLowerCase().includes("withdrawal");
}

function findWithdrawalForTransaction(
  tx: TransactionDTO,
  withdrawals: WithdrawalItemDTO[],
): WithdrawalItemDTO | null {
  if (!isWithdrawalTransaction(tx) || withdrawals.length === 0) return null;

  const txRecord = tx as Record<string, unknown>;
  const txIds = new Set(
    [
      fullTransactionId(tx),
      formatTransactionRef(tx),
      nestedString(tx, ["reference"]),
      nestedString(tx, ["referenceId"]),
      nestedString(tx, ["walletTransactionId"]),
      nestedString(tx, ["walletTransaction", "id"]),
    ]
      .filter((id): id is string => Boolean(id && id !== "—"))
      .map((id) => id.toLowerCase()),
  );
  const txWalletId = nestedString(tx, ["walletId"]);
  const txAmount = parseAmount(tx);
  const txCreated = new Date(String(txRecord.createdAt ?? ""));

  let best: { item: WithdrawalItemDTO; score: number } | null = null;

  for (const item of withdrawals) {
    const itemRecord = item as Record<string, unknown>;
    let score = 0;

    const withdrawalIds = candidateStrings(item, [
      ["id"],
      ["reference"],
      ["referenceId"],
      ["transactionId"],
      ["walletTransactionId"],
      ["transaction", "id"],
      ["walletTransaction", "id"],
    ]).map((id) => id.toLowerCase());
    if (withdrawalIds.some((id) => txIds.has(id))) score += 12;

    if (txWalletId && item.walletId === txWalletId) score += 4;

    const itemAmount = amountToNumber(item.amount);
    if (itemAmount !== null && Math.abs(itemAmount - txAmount) < 0.01) {
      score += 3;
    }

    const itemCreated = new Date(String(itemRecord.createdAt ?? ""));
    if (
      !Number.isNaN(txCreated.getTime()) &&
      !Number.isNaN(itemCreated.getTime())
    ) {
      const diffHours =
        Math.abs(txCreated.getTime() - itemCreated.getTime()) / 36e5;
      if (diffHours <= 48) score += 2;
    }

    if (score > (best?.score ?? 0)) best = { item, score };
  }

  return best && best.score >= 7 ? best.item : null;
}

type DetailField = {
  label: string;
  value: React.ReactNode;
  breakAll?: boolean;
  emphasis?: boolean;
  mono?: boolean;
};

function cleanDetailValue(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || text === "—" || text.toLowerCase() === "n/a") return null;
  return text;
}

function detailField(
  label: string,
  value: unknown,
  options: Omit<DetailField, "label" | "value"> = {},
): DetailField | null {
  const text = cleanDetailValue(value);
  return text ? { label, value: text, ...options } : null;
}

function compactFields(
  fields: Array<DetailField | null | undefined>,
): DetailField[] {
  return fields.filter((field): field is DetailField => Boolean(field));
}

function transactionAmountLabel(tx: TransactionDTO): string | null {
  const amount = amountToNumber(rawTransactionAmount(tx));
  if (amount === null) return null;
  const currency = parseCurrency(tx);
  return `${formatMoney(amount)} (${currency})`;
}

function nestedDetailValue(source: unknown, paths: string[][]): string | null {
  for (const path of paths) {
    const value = nestedString(source, path);
    if (value) return value;
  }
  return null;
}

function paymentSummaryFields(tx: TransactionDTO): DetailField[] {
  const r = tx as Record<string, unknown>;
  return compactFields([
    detailField("Amount", transactionAmountLabel(tx), { emphasis: true }),
    detailField("Status", normalizeStatus(tx.status)),
    detailField("Action", formatActionLabel(tx)),
    detailField("Ledger type", r.type),
    detailField("Provider", r.provider),
    detailField("Method", r.paymentMethod),
    detailField("Created", formatDateTime(r.createdAt ?? r.transactionDate)),
    detailField("Updated", formatDateTime(r.updatedAt)),
    detailField("Reference", formatTransactionRef(tx), { mono: true }),
  ]);
}

function partyFields(
  tx: TransactionDTO,
  rentById: Map<string, RentPaymentItemDTO>,
): DetailField[] {
  return compactFields([
    detailField("From", resolveTenantLabel(tx, rentById), { emphasis: true }),
    detailField("Payer email", resolveSenderEmail(tx), { breakAll: true }),
    detailField("To", resolveLandlordLabel(tx), { emphasis: true }),
    detailField("Payee email", resolveReceiverEmail(tx), { breakAll: true }),
    detailField("Property / unit", resolvePropertyLabel(tx, rentById)),
  ]);
}

function gatewayFields(tx: TransactionDTO): DetailField[] {
  const r = tx as Record<string, unknown>;
  return compactFields([
    detailField("Channel", gatewayChannel(tx)),
    detailField("Paid at", gatewayPaidAtDisplay(tx)),
    detailField("Payment link", r.paymentUrl, { breakAll: true }),
    detailField(
      "Gateway ref",
      nestedDetailValue(tx, [
        ["metaData", "reference"],
        ["metaData", "gatewayReference"],
        ["gatewayReference"],
      ]),
      { breakAll: true },
    ),
    detailField(
      "Virtual account",
      nestedDetailValue(tx, [
        ["vba", "accountNumber"],
        ["virtualAccount", "accountNumber"],
      ]),
    ),
  ]);
}

function withdrawalFields(item: WithdrawalItemDTO): DetailField[] {
  const amount = amountToNumber(item.amount);
  return compactFields([
    detailField("Request ID", item.id, { breakAll: true, mono: true }),
    detailField("Status", item.status),
    detailField("Amount", amount === null ? null : formatMoney(amount), {
      emphasis: true,
    }),
    detailField("Created", formatDateTime(item.createdAt)),
    detailField("Updated", formatDateTime(item.updatedAt)),
    detailField(
      "Bank",
      item.recipientDetails?.bankName ?? item.recipientDetails?.bankCode,
    ),
    detailField(
      "Account",
      [
        item.recipientDetails?.accountName ?? item.recipientDetails?.fullName,
        item.recipientDetails?.accountNumber,
      ]
        .filter(Boolean)
        .join(" · "),
    ),
    detailField("Narration", item.narration),
  ]);
}

function DetailRows({ fields }: { fields: DetailField[] }) {
  return (
    <dl className="grid grid-cols-[120px_1fr] gap-x-2 gap-y-2">
      {fields.map((field) => (
        <React.Fragment key={field.label}>
          <dt className="text-[#64748B]">{field.label}</dt>
          <dd
            className={`${field.emphasis ? "font-medium" : ""} ${
              field.breakAll ? "break-all" : ""
            } ${field.mono ? "font-mono text-[11px]" : ""}`}
          >
            {field.value}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

const PAGE_SIZE = 15;

const fieldShell =
  "h-9 rounded-md border border-[#E2E8F0] bg-white px-3 text-[12px] text-[#0F172A]";

const AdminTransactionsPage: NextPageWithLayout = () => {
  const [status, setStatus] = React.useState<"All" | "Pending" | "Success">(
    "All",
  );
  const [actionFilter, setActionFilter] = React.useState("All");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [rows, setRows] = React.useState<TransactionDTO[]>([]);
  const [rentById, setRentById] = React.useState<
    Map<string, RentPaymentItemDTO>
  >(() => new Map());
  const [withdrawals, setWithdrawals] = React.useState<WithdrawalItemDTO[]>([]);
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
    const [txResult, rentResult, withdrawalResult] = await Promise.all([
      getTransactions(),
      getRentPaymentItems({ limit: 500 }),
      getWithdrawalItems(),
    ]);
    setLoading(false);
    if (rentResult.success) {
      setRentById(buildRentPaymentIndex(rentResult.data));
    } else {
      setRentById(new Map());
    }
    setWithdrawals(withdrawalResult.success ? withdrawalResult.data : []);
    if (!txResult.success) {
      setError(txResult.error);
      setRows([]);
      return;
    }
    setRows(
      [...txResult.data].sort(
        (a, b) => transactionSortTime(b) - transactionSortTime(a),
      ),
    );
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
          "Only the available table details are shown for this transaction.",
        );
      } else if (sawNetworkError) {
        setDetailFetchNote(
          "We could not refresh this transaction right now, so the available details are shown.",
        );
      } else {
        setDetailFetchNote(
          "No extra details were returned for this transaction.",
        );
      }
    })();
  }, []);

  const detailShown = detailRemote ?? detailListRow;

  const actionOptions = React.useMemo(() => {
    const options = new Set<string>();
    rows.forEach((tx) => {
      const label = formatActionLabel(tx);
      if (label !== "—") options.add(label);
    });
    return [...options].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filtered = React.useMemo(() => {
    return rows.filter((tx) => {
      const u = uiStatus(tx);
      const action = formatActionLabel(tx);
      const withdrawal = findWithdrawalForTransaction(tx, withdrawals);
      const matchesStatus =
        status === "All" ||
        (status === "Pending" && u === "Pending") ||
        (status === "Success" && u === "Success");
      const matchesAction = actionFilter === "All" || action === actionFilter;
      return (
        matchesStatus &&
        matchesAction &&
        transactionMatchesSearch(tx, rentById, withdrawal, searchQuery)
      );
    });
  }, [actionFilter, rentById, rows, searchQuery, status, withdrawals]);

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
  }, [actionFilter, searchQuery, status, rows.length]);

  const paginationItems = React.useMemo<(number | "ellipsis")[]>(() => {
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, index) => index + 1);
    }

    const pages = new Set([1, pageCount, safePage - 1, safePage, safePage + 1]);
    const sorted = [...pages]
      .filter((n) => n >= 1 && n <= pageCount)
      .sort((a, b) => a - b);
    const items: (number | "ellipsis")[] = [];

    sorted.forEach((pageNumber, index) => {
      const previous = sorted[index - 1];
      if (previous && pageNumber - previous > 1) {
        items.push("ellipsis");
      }
      items.push(pageNumber);
    });

    return items;
  }, [pageCount, safePage]);

  const firstVisibleRecord =
    filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const lastVisibleRecord = Math.min(safePage * PAGE_SIZE, filtered.length);
  const detailWithdrawal = React.useMemo(
    () =>
      detailShown
        ? findWithdrawalForTransaction(detailShown, withdrawals)
        : null,
    [detailShown, withdrawals],
  );
  const detailPaymentFields = React.useMemo(
    () => (detailShown ? paymentSummaryFields(detailShown) : []),
    [detailShown],
  );
  const detailPartyFields = React.useMemo(
    () => (detailShown ? partyFields(detailShown, rentById) : []),
    [detailShown, rentById],
  );
  const detailGatewayFields = React.useMemo(
    () => (detailShown ? gatewayFields(detailShown) : []),
    [detailShown],
  );
  const detailWithdrawalFields = React.useMemo(
    () => (detailWithdrawal ? withdrawalFields(detailWithdrawal) : []),
    [detailWithdrawal],
  );

  const handleExportTransactions = React.useCallback(() => {
    downloadCsv(
      `admin-transactions-${todayStamp()}.csv`,
      [
        { header: "S/N", value: (_tx, index) => index + 1 },
        { header: "Transaction ID", value: (tx) => fullTransactionId(tx) },
        { header: "Reference", value: (tx) => formatTransactionRef(tx) },
        { header: "From", value: (tx) => resolveTenantLabel(tx, rentById) },
        { header: "To", value: (tx) => resolveLandlordLabel(tx) },
        {
          header: "Payer Email",
          value: (tx) => resolveSenderEmail(tx),
        },
        {
          header: "Payee Email",
          value: (tx) => resolveReceiverEmail(tx),
        },
        {
          header: "Property / Unit",
          value: (tx) => resolvePropertyLabel(tx, rentById),
        },
        { header: "Amount", value: (tx) => parseAmount(tx) },
        { header: "Currency", value: (tx) => parseCurrency(tx) },
        { header: "Date", value: (tx) => formatTxDate(tx) },
        { header: "Updated", value: (tx) => formatUpdatedAt(tx) },
        { header: "Status", value: (tx) => normalizeStatus(tx.status) },
        { header: "Action", value: (tx) => formatActionLabel(tx) },
        {
          header: "Provider",
          value: (tx) => (tx as Record<string, unknown>).provider,
        },
        {
          header: "Payment Method",
          value: (tx) => (tx as Record<string, unknown>).paymentMethod,
        },
        { header: "Channel", value: (tx) => gatewayChannel(tx) },
        { header: "Narration", value: (tx) => resolveNarration(tx) },
      ],
      filtered,
    );
  }, [filtered, rentById]);

  return (
    <>
      <Head>
        <title>Dwelliva · Transactions</title>
      </Head>
      <AdminLayout title="Transactions" showHeaderSearch={false}>
        <section className="w-full min-w-0 space-y-4">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleExportTransactions}
              disabled={loading || filtered.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[12px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
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
              ["Records shown", String(filtered.length)],
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
            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-[1fr_220px_220px_auto] lg:items-center">
              <input
                className={fieldShell}
                placeholder="Search by reference, user, amount, status, action..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as "All" | "Pending" | "Success")
                }
                className={fieldShell}
              >
                <option value="All">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Success">Success</option>
              </select>
              <select
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
                className={fieldShell}
              >
                <option value="All">All actions</option>
                {actionOptions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
              {searchQuery || status !== "All" || actionFilter !== "All" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatus("All");
                    setActionFilter("All");
                  }}
                  className={`${fieldShell} inline-flex items-center justify-center px-4 hover:bg-[#F8FAFC]`}
                >
                  Clear
                </button>
              ) : null}
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
              Review payments, deposits, and withdrawals. Open any row to see
              the details available for that transaction.
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
                  No transactions match your filters.
                </p>
              ) : null}
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[11px] text-[#64748B]">
              <p>
                Showing {firstVisibleRecord}-{lastVisibleRecord} of{" "}
                {filtered.length} record(s) · Page {safePage} of {pageCount}
              </p>
              <div className="inline-flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage <= 1}
                  className="rounded border border-[#E2E8F0] bg-white px-2 py-0.5 hover:bg-[#F8FAFC] disabled:opacity-40"
                  aria-label="Previous page"
                >
                  Prev
                </button>
                {paginationItems.map((item, index) =>
                  item === "ellipsis" ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-1 text-[#94A3B8]"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      aria-current={item === safePage ? "page" : undefined}
                      className={`rounded border px-2 py-0.5 ${
                        item === safePage
                          ? "border-[#1E66FF] bg-[#1E66FF] text-white"
                          : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
                <span className="px-1 text-[#64748B]">/ {pageCount}</span>
                <button
                  type="button"
                  onClick={() =>
                    setPage((prev) => Math.min(pageCount, prev + 1))
                  }
                  disabled={safePage >= pageCount}
                  className="rounded border border-[#E2E8F0] bg-white px-2 py-0.5 hover:bg-[#F8FAFC] disabled:opacity-40"
                  aria-label="Next page"
                >
                  Next
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
                      ? "Refreshing the latest transaction details…"
                      : "Showing the details available for this transaction."}
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
                  {detailPaymentFields.length ? (
                    <section>
                      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                        Summary
                      </h3>
                      <DetailRows fields={detailPaymentFields} />
                    </section>
                  ) : null}

                  {detailPartyFields.length ? (
                    <section>
                      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                        People and property
                      </h3>
                      <DetailRows fields={detailPartyFields} />
                    </section>
                  ) : null}

                  {isWithdrawalTransaction(detailShown) ? (
                    <section>
                      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                        Withdrawal request
                      </h3>
                      {detailWithdrawalFields.length ? (
                        <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2">
                          <DetailRows fields={detailWithdrawalFields} />
                        </div>
                      ) : (
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                          No linked withdrawal request was found for this
                          transaction yet. Approval controls are not available
                          for this record.
                        </p>
                      )}
                    </section>
                  ) : null}

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

                  {detailGatewayFields.length ? (
                    <section>
                      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                        Payment gateway
                      </h3>
                      <DetailRows fields={detailGatewayFields} />
                    </section>
                  ) : null}

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
