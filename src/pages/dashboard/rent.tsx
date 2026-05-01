import Head from "next/head";
import * as React from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { addDays, format, isValid, parse, parseISO } from "date-fns";
import { DashboardLayout } from "@/components/DashboardLayout";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Download,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  FileText,
  AlertTriangle,
  ArrowLeft,
  UserRound,
  CalendarClock,
  MoreVertical,
} from "lucide-react";
import {
  createRentPayment,
  generateRentPaymentIdempotencyKey,
} from "@/api/rent-payment";
import {
  getRentsByLease,
  getAggregatedRents,
  createRent,
  markRentAsPaid,
  isLeaseActiveFlag,
  resolveTenantActiveLeaseId,
} from "@/api/rent";
import type { RentItemDTO } from "@/api/rent";
import { getTenantByUser, getTenant, getTenantList } from "@/api/tenants";
import type { TenantRecordDTO } from "@/api/tenants";
import { useUser } from "@/contexts/UserContext";
import type { NextPageWithLayout } from "../_app";
import { ADMIN_STAT_BG, ADMIN_STAT_LABEL } from "@/lib/adminDesignTokens";
import { useToast } from "@/components/Toast";

type LandlordRentStatus = "paid" | "due" | "overdue";

type LandlordRentRow = {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyName: string;
  unit: string;
  rentAmount: number;
  dueDate: string;
  lastPayment?: string;
  status: LandlordRentStatus;
  balance?: number;
};

type TenantPaymentRow = {
  id: string;
  type: string;
  date: string;
  method?: string;
  confirmationNumber: string;
  amount: number;
  status: "paid" | "pending";
};

type TenantOption = {
  id: string;
  label: string;
};

/** Tenant with resolved active lease + unit (for landlord rent table + create flow). */
type LandlordTenantPick = {
  id: string;
  label: string;
  activeLeaseId: string;
  propertyName: string;
  unit: string;
};

function formatRentDueForLandlordTable(iso: string): string {
  if (!iso || iso === "—") return "—";
  try {
    const d = parseISO(iso);
    if (isValid(d)) return format(d, "dd MMM yyyy");
  } catch {
    /* ignore */
  }
  return iso;
}

function tenantDetailToLandlordPick(
  tr: Record<string, unknown>,
  tenantId: string,
): LandlordTenantPick | null {
  const leases = Array.isArray(tr.leases)
    ? (tr.leases as Array<Record<string, unknown>>)
    : [];
  const activeLeaseId = resolveTenantActiveLeaseId(leases, null);
  if (!activeLeaseId) return null;
  const user = (tr.user as Record<string, unknown>) || {};
  const label =
    (typeof user.fullName === "string" && user.fullName) ||
    (typeof tr.fullName === "string" && tr.fullName) ||
    (typeof tr.email === "string" ? tr.email : `Tenant ${tenantId}`);
  const cu = tr.currentUnit as Record<string, unknown> | undefined;
  const unit = typeof cu?.name === "string" ? cu.name : "—";
  const prop = cu?.property as Record<string, unknown> | undefined;
  const propertyName = typeof prop?.name === "string" ? prop.name : "—";
  return {
    id: tenantId,
    label: String(label),
    activeLeaseId,
    propertyName,
    unit,
  };
}

function landlordPickFromListRecord(
  rec: Record<string, unknown>,
  tenantId: string,
): LandlordTenantPick | null {
  const leases = rec.leases;
  if (!Array.isArray(leases) || leases.length === 0) return null;
  if (!leases.some((l) => isLeaseActiveFlag(l as Record<string, unknown>))) {
    return null;
  }
  const activeLeaseId = resolveTenantActiveLeaseId(
    leases as Array<Record<string, unknown>>,
    null,
  );
  if (!activeLeaseId) return null;
  const cu = rec.currentUnit as Record<string, unknown> | undefined;
  const prop = cu?.property as Record<string, unknown> | undefined;
  if (
    !cu ||
    typeof cu.name !== "string" ||
    !prop ||
    typeof prop.name !== "string"
  ) {
    return null;
  }
  const user = (rec.user as Record<string, unknown>) || {};
  const label =
    (typeof user.fullName === "string" && user.fullName) ||
    (typeof rec.fullName === "string" && rec.fullName) ||
    (typeof rec.email === "string" ? rec.email : `Tenant ${tenantId}`);
  return {
    id: tenantId,
    label: String(label),
    activeLeaseId,
    propertyName: prop.name,
    unit: cu.name,
  };
}

function leaseHasUnpaidRent(rents: RentItemDTO[], leaseId: string): boolean {
  return rents.some(
    (r) => r.leaseId === leaseId && (r.status || "").toLowerCase() !== "paid",
  );
}

function mapRentItemToLandlordRow(
  rent: RentItemDTO,
  pick: LandlordTenantPick | undefined,
): LandlordRentRow {
  const dueRaw = rent.dueDate || "—";
  const dueDateObj = parsePaymentDate(dueRaw);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const paid = (rent.status || "").toLowerCase() === "paid";
  let status: LandlordRentStatus = "due";
  if (paid) {
    status = "paid";
  } else if (!dueDateObj || dueRaw === "—") {
    status = "due";
  } else if (dueDateObj < today) {
    status = "overdue";
  } else {
    status = "due";
  }
  const payDateRaw =
    rent.paymentDate != null && String(rent.paymentDate).length > 0
      ? String(rent.paymentDate)
      : null;

  return {
    id: rent.id,
    tenantId: pick?.id ?? "",
    tenantName: pick?.label ?? "Tenant",
    propertyName: pick?.propertyName ?? "—",
    unit: pick?.unit ?? "—",
    rentAmount: rent.totalAmount ?? rent.amount ?? 0,
    dueDate: formatRentDueForLandlordTable(dueRaw === "—" ? "" : dueRaw),
    lastPayment:
      paid && payDateRaw
        ? formatRentDueForLandlordTable(payDateRaw)
        : paid
          ? formatRentDueForLandlordTable(dueRaw === "—" ? "" : dueRaw)
          : "—",
    status,
    balance:
      status === "overdue" ? (rent.totalAmount ?? rent.amount ?? 0) : undefined,
  };
}

const parsePaymentDate = (value: string): Date | null => {
  if (!value || value === "—") return null;
  try {
    const iso = parseISO(value);
    if (isValid(iso)) return iso;
  } catch {
    // ignore parse error and try known UI format
  }
  try {
    const formatted = parse(value, "dd MMM yyyy", new Date());
    if (isValid(formatted)) return formatted;
  } catch {
    // ignore parse error and try Date fallback
  }
  const fallback = new Date(value);
  return isValid(fallback) ? fallback : null;
};

const formatTenantPaymentDueLabel = (value: string): string => {
  if (!value || value === "—") return "—";
  try {
    const d = parseISO(value);
    if (isValid(d)) return format(d, "dd MMM yyyy · h:mm a");
  } catch {
    /* ignore */
  }
  const parsed = parsePaymentDate(value);
  if (parsed) return format(parsed, "dd MMM yyyy · h:mm a");
  return value;
};

function LandlordRentRowActionsMenu({
  row,
  onMarkPaid,
  isMarkingPaid,
}: {
  row: LandlordRentRow;
  onMarkPaid: (rentId: string) => void;
  isMarkingPaid: boolean;
}) {
  const router = useRouter();
  const alreadyPaid = row.status === "paid";
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex rounded-lg p-1.5 text-brand-main hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-brand-main/25"
          aria-label="Open row actions"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-[100] min-w-[192px] rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
        >
          <DropdownMenu.Item
            disabled={!row.tenantId}
            className="flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm text-gray-900 outline-none hover:bg-gray-50 focus:bg-gray-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-40"
            onSelect={() => {
              if (row.tenantId) {
                router.push(`/dashboard/tenants/${row.tenantId}`);
              }
            }}
          >
            Tenant details
          </DropdownMenu.Item>
          <DropdownMenu.Item
            disabled={alreadyPaid || isMarkingPaid}
            className="flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm text-gray-900 outline-none hover:bg-gray-50 focus:bg-gray-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-40"
            onSelect={() => {
              if (!alreadyPaid && !isMarkingPaid) {
                onMarkPaid(row.id);
              }
            }}
          >
            {isMarkingPaid ? "Marking…" : "Mark rent as paid"}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// Tenant Payment History Component
const TenantPaymentHistory = () => {
  const { user } = useUser();
  const router = useRouter();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [tenantPayments, setTenantPayments] = React.useState<
    TenantPaymentRow[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [payingRentId, setPayingRentId] = React.useState<string | null>(null);
  const paymentHistoryLoadGenRef = React.useRef(0);

  React.useEffect(() => {
    if (!user?.id || user.role !== "tenant") {
      setTenantPayments([]);
      setIsLoading(false);
      return;
    }

    const gen = ++paymentHistoryLoadGenRef.current;
    setIsLoading(true);

    const storedLeaseId =
      typeof window !== "undefined" ? localStorage.getItem("leaseId") : null;

    void (async () => {
      try {
        const tenantResult = await getTenantByUser(String(user.id));
        if (gen !== paymentHistoryLoadGenRef.current) return;
        if (!tenantResult.success) {
          setTenantPayments([]);
          return;
        }

        const activeLeaseId = resolveTenantActiveLeaseId(
          tenantResult.data.leases as
            | Array<Record<string, unknown>>
            | undefined,
          storedLeaseId,
        );
        if (!activeLeaseId) {
          setTenantPayments([]);
          return;
        }
        if (typeof window !== "undefined") {
          localStorage.setItem("leaseId", activeLeaseId);
        }

        const rentsResult = await getRentsByLease(activeLeaseId);
        if (gen !== paymentHistoryLoadGenRef.current) return;
        if (!rentsResult.success) {
          setTenantPayments([]);
          return;
        }
        const rows = rentsResult.data.map(
          (rent): TenantPaymentRow => ({
            id: rent.id,
            type: "Rent",
            date: rent.dueDate || "—",
            method:
              (rent.status || "").toLowerCase() === "paid"
                ? "Completed"
                : undefined,
            confirmationNumber: rent.id,
            amount: rent.totalAmount ?? rent.amount ?? 0,
            status:
              (rent.status || "").toLowerCase() === "paid" ? "paid" : "pending",
          }),
        );

        setTenantPayments(rows);
      } catch (e) {
        console.error("[TenantPaymentHistory] load failed:", e);
        if (gen === paymentHistoryLoadGenRef.current) setTenantPayments([]);
      } finally {
        if (gen === paymentHistoryLoadGenRef.current) setIsLoading(false);
      }
    })();
  }, [user?.id, user?.role]);

  const summary = React.useMemo(() => {
    const paidPayments = tenantPayments.filter((p) => p.status === "paid");
    const pendingPayments = tenantPayments.filter(
      (p) => p.status === "pending",
    );
    const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const averagePayment =
      paidPayments.length > 0 ? totalPaid / paidPayments.length : 0;
    const outstandingAmount = pendingPayments.reduce(
      (sum, p) => sum + p.amount,
      0,
    );
    return {
      totalPaid,
      totalPaidCount: paidPayments.length,
      averagePayment,
      outstandingAmount,
    };
  }, [tenantPayments]);

  const filteredPayments = tenantPayments.filter(
    (payment) =>
      payment.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.method || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      payment.confirmationNumber
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const handlePayRentRow = React.useCallback(
    async (rentId: string) => {
      const idempotencyKey = generateRentPaymentIdempotencyKey();
      const requestBody = { rentId };
      console.log("[rent-payment] request", {
        method: "POST",
        path: "/rent-payment",
        body: requestBody,
        headers: { "Idempotency-Key": idempotencyKey },
      });
      setPayingRentId(rentId);
      let result: Awaited<ReturnType<typeof createRentPayment>>;
      try {
        result = await createRentPayment(rentId, { idempotencyKey });
      } catch (e) {
        console.error("[rent-payment] request failed (network/throw)", e);
        setPayingRentId(null);
        showToast("Payment request failed", "error");
        return;
      }
      setPayingRentId(null);
      console.log("[rent-payment] response", result);
      if (!result.success) {
        showToast(result.error || "Failed to initialize rent payment", "error");
        return;
      }
      const payload = result.data;
      if (payload && typeof payload === "object") {
        const root = payload as Record<string, unknown>;
        const nested = root.data as Record<string, unknown> | undefined;
        const url =
          (typeof root.authorizationUrl === "string" &&
            root.authorizationUrl) ||
          (typeof root.checkoutUrl === "string" && root.checkoutUrl) ||
          (nested &&
            typeof nested.authorizationUrl === "string" &&
            nested.authorizationUrl) ||
          (nested &&
            typeof nested.checkoutUrl === "string" &&
            nested.checkoutUrl) ||
          null;
        if (url) {
          window.location.href = url;
          return;
        }
      }
      showToast("Payment initialized", "success");
      router.push("/dashboard/rent/payment-success");
    },
    [router, showToast],
  );

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Payment History
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-600">
          View all your rent payment transactions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-lg p-4 sm:p-6 shadow-sm"
          style={{ backgroundColor: ADMIN_STAT_BG.green }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p
                className="text-xs sm:text-sm font-medium"
                style={{ color: ADMIN_STAT_LABEL.green }}
              >
                Total Paid
              </p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalPaid)}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                {summary.totalPaidCount} payments
              </p>
            </div>
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/90 flex-shrink-0">
              <DollarSign
                className="h-5 w-5 sm:h-6 sm:w-6"
                style={{ color: ADMIN_STAT_LABEL.green }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-lg p-4 sm:p-6 shadow-sm"
          style={{ backgroundColor: ADMIN_STAT_BG.blue }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p
                className="text-xs sm:text-sm font-medium"
                style={{ color: ADMIN_STAT_LABEL.blue }}
              >
                Average Payment
              </p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900">
                {formatCurrency(Math.round(summary.averagePayment))}
              </p>
              <p className="mt-1 text-xs text-gray-600">Per month</p>
            </div>
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/90 flex-shrink-0">
              <FileText
                className="h-5 w-5 sm:h-6 sm:w-6"
                style={{ color: ADMIN_STAT_LABEL.blue }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-lg bg-red-50 p-4 sm:p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Outstanding Amount
              </p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900">
                {formatCurrency(summary.outstandingAmount)}
              </p>
              <p className="mt-1 text-xs text-gray-600">Pending payments</p>
            </div>
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-red-100 flex-shrink-0">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by date, method, or confirmation number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 sm:h-12 rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
        />
      </div>

      {/* Payment Transaction List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            Loading payment history...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-600 space-y-2">
            <p>No rent charges for your active lease yet.</p>
            <p className="text-gray-500">
              After your landlord creates rent, it appears here. Use{" "}
              <span className="font-medium text-gray-700">Pay</span> on a
              pending row to start checkout.
            </p>
          </div>
        ) : (
          filteredPayments.map((payment, index) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div
                  className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full flex-shrink-0 ${
                    payment.status === "paid" ? "bg-green-100" : "bg-yellow-100"
                  }`}
                >
                  {payment.status === "paid" ? (
                    <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm sm:text-base font-medium text-gray-900">
                      {payment.type}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        payment.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {payment.status === "paid" ? "Paid" : "Pending"}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <span
                      className="tabular-nums"
                      title={payment.date !== "—" ? payment.date : undefined}
                    >
                      Due {formatTenantPaymentDueLabel(payment.date)}
                    </span>
                    {payment.method && (
                      <>
                        <span>•</span>
                        <span>{payment.method}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{payment.confirmationNumber}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="text-sm sm:text-base font-semibold text-gray-900">
                  {formatCurrency(payment.amount)}
                </span>
                {payment.status !== "paid" && (
                  <button
                    type="button"
                    onClick={() => void handlePayRentRow(payment.id)}
                    disabled={payingRentId !== null}
                    className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {payingRentId === payment.id ? "Processing…" : "Pay"}
                  </button>
                )}
                {payment.status === "paid" && (
                  <button
                    type="button"
                    className="p-2 text-gray-400 hover:text-gray-600 transition"
                    title="Download receipt"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
};

// Landlord/Manager Rent Page (existing)
const LandlordRentPage = () => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedPeriod, setSelectedPeriod] = React.useState("all");
  const [rows, setRows] = React.useState<LandlordRentRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [tenantOptions, setTenantOptions] = React.useState<TenantOption[]>([]);
  const [selectedTenantId, setSelectedTenantId] = React.useState("");
  const [isCreatingRent, setIsCreatingRent] = React.useState(false);
  const [landlordRefreshKey, setLandlordRefreshKey] = React.useState(0);
  const [markingPaidRentId, setMarkingPaidRentId] = React.useState<
    string | null
  >(null);

  const handleMarkRentPaid = React.useCallback(
    async (rentId: string) => {
      setMarkingPaidRentId(rentId);
      const result = await markRentAsPaid(rentId);
      setMarkingPaidRentId(null);
      if (result.success) {
        showToast("Rent marked as paid", "success");
        setLandlordRefreshKey((k) => k + 1);
      } else {
        showToast(result.error ?? "Could not update rent status", "error");
      }
    },
    [showToast],
  );

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    const BATCH = 12;

    void (async () => {
      const [tenantListResult, rentsResult] = await Promise.all([
        getTenantList({ page: 1, limit: 200 }),
        getAggregatedRents(),
      ]);
      if (cancelled) return;

      const allRents = rentsResult.success ? rentsResult.data : [];

      if (!tenantListResult.success) {
        setRows([]);
        setTenantOptions([]);
        setIsLoading(false);
        return;
      }

      const picks: LandlordTenantPick[] = [];
      const needDetail: TenantRecordDTO[] = [];
      const seenPickIds = new Set<string>();

      for (const t of tenantListResult.data) {
        const rec = t as unknown as Record<string, unknown>;
        const id = String(rec.id ?? "");
        const leases = rec.leases;

        if (Array.isArray(leases) && leases.length > 0) {
          if (
            !leases.some((l) => isLeaseActiveFlag(l as Record<string, unknown>))
          ) {
            continue;
          }
          const quick = landlordPickFromListRecord(rec, id);
          if (quick) {
            if (!seenPickIds.has(quick.id)) {
              seenPickIds.add(quick.id);
              picks.push(quick);
            }
          } else {
            needDetail.push(t);
          }
        } else {
          needDetail.push(t);
        }
      }

      for (let i = 0; i < needDetail.length; i += BATCH) {
        if (cancelled) return;
        const chunk = needDetail.slice(i, i + BATCH);
        const details = await Promise.all(
          chunk.map((row) =>
            getTenant(String((row as unknown as Record<string, unknown>).id)),
          ),
        );
        for (let j = 0; j < chunk.length; j++) {
          const detail = details[j];
          if (!detail.success) continue;
          const tr = detail.data as unknown as Record<string, unknown>;
          const tid = String(tr.id ?? "");
          const pick = tenantDetailToLandlordPick(tr, tid);
          if (pick && !seenPickIds.has(pick.id)) {
            seenPickIds.add(pick.id);
            picks.push(pick);
          }
        }
      }

      const leaseIdsManaged = new Set(picks.map((p) => p.activeLeaseId));
      const leaseIdToPick = new Map(
        picks.map((p) => [p.activeLeaseId, p] as const),
      );

      const tableRows = allRents
        .filter((r) => leaseIdsManaged.has(r.leaseId))
        .map((r) => mapRentItemToLandlordRow(r, leaseIdToPick.get(r.leaseId)));

      const forDropdown = picks.filter(
        (p) => !leaseHasUnpaidRent(allRents, p.activeLeaseId),
      );

      forDropdown.sort((a, b) => a.label.localeCompare(b.label));
      tableRows.sort((a, b) => {
        const da = parsePaymentDate(a.dueDate)?.getTime() ?? 0;
        const db = parsePaymentDate(b.dueDate)?.getTime() ?? 0;
        return db - da;
      });

      if (!cancelled) {
        setRows(tableRows);
        setTenantOptions(
          forDropdown.map((p) => ({ id: p.id, label: p.label })),
        );
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [landlordRefreshKey]);

  React.useEffect(() => {
    if (
      selectedTenantId &&
      !tenantOptions.some((o) => o.id === selectedTenantId)
    ) {
      setSelectedTenantId("");
    }
  }, [tenantOptions, selectedTenantId]);

  const handleCreateRent = React.useCallback(async () => {
    if (!selectedTenantId) {
      showToast("Select a tenant", "error");
      return;
    }
    setIsCreatingRent(true);
    const tenantResult = await getTenant(selectedTenantId);
    if (!tenantResult.success) {
      showToast(tenantResult.error || "Failed to fetch tenant", "error");
      setIsCreatingRent(false);
      return;
    }
    const tenant = tenantResult.data as unknown as Record<string, unknown>;
    const leases = Array.isArray(tenant.leases)
      ? (tenant.leases as Array<Record<string, unknown>>)
      : [];
    const activeLease =
      leases.find((l) => isLeaseActiveFlag(l)) ??
      leases.find((l) => typeof l.id === "string") ??
      null;
    if (!activeLease) {
      showToast("Tenant has no active lease", "error");
      setIsCreatingRent(false);
      return;
    }

    const dueDate = addDays(new Date(), 7);
    const payload = {
      leaseId: String(activeLease.id),
      startDate: String(activeLease.startDate ?? ""),
      endDate: String(activeLease.endDate ?? ""),
      dueDate: dueDate.toISOString(),
      amount: Number(activeLease.rentAmount ?? 0),
    };
    if (
      !payload.leaseId ||
      !payload.startDate ||
      !payload.endDate ||
      !payload.amount
    ) {
      showToast("Active lease is missing required rent fields", "error");
      setIsCreatingRent(false);
      return;
    }

    const createResult = await createRent(payload);
    if (!createResult.success) {
      showToast(createResult.error || "Failed to create rent", "error");
      setIsCreatingRent(false);
      return;
    }
    showToast("Rent created successfully", "success");
    setIsCreatingRent(false);
    setSelectedTenantId("");
    setLandlordRefreshKey((k) => k + 1);
  }, [selectedTenantId, showToast]);

  const availableYears = React.useMemo(() => {
    const years = new Set<string>();
    rows.forEach((row) => {
      const date = parsePaymentDate(row.dueDate);
      if (date) years.add(String(date.getFullYear()));
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [rows]);

  const periodFiltered = React.useMemo(() => {
    if (selectedPeriod === "all") return rows;
    return rows.filter((row) => {
      const date = parsePaymentDate(row.dueDate);
      return date ? String(date.getFullYear()) === selectedPeriod : false;
    });
  }, [rows, selectedPeriod]);

  const filteredPayments = periodFiltered.filter(
    (payment) =>
      payment.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.unit.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Calculate summary stats from API-backed rows
  const collectedThisMonth = periodFiltered
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.rentAmount, 0);

  const pendingPayments = periodFiltered.filter((p) => p.status === "due");
  const pendingAmount = pendingPayments.reduce(
    (sum, p) => sum + p.rentAmount,
    0,
  );

  const overduePayments = periodFiltered.filter((p) => p.status === "overdue");
  const overdueAmount = overduePayments.reduce(
    (sum, p) => sum + (p.balance || 0),
    0,
  );

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: LandlordRentStatus) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            <CheckCircle2 className="h-3 w-3" />
            Paid
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
            <AlertCircle className="h-3 w-3" />
            Overdue
          </span>
        );
      case "due":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
            <Clock className="h-3 w-3" />
            Due
          </span>
        );
    }
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Rent</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-600">
            Monitor rent payments and manage collection
          </p>
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full lg:w-auto h-10 rounded-lg bg-gray-900 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-gray-800 flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Download className="h-4 w-4" />
          <span className="hidden lg:inline">Export Data</span>
          <span className="lg:hidden">Export</span>
        </motion.button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-main/10 text-brand-main">
              <UserRound className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-gray-900">
                Create rent
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Bill a tenant using their active rent/lease. Amount and period
                come from the lease; no extra fields required. Tenants with an
                active lease and{" "}
                <span className="font-medium text-gray-800">
                  no unpaid rent charge yet
                </span>{" "}
                appear in the list.
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
                <CalendarClock className="h-3.5 w-3.5 text-brand-main" />
                Due date:{" "}
                <span className="text-gray-900">
                  {format(addDays(new Date(), 7), "dd MMM yyyy")}{" "}
                </span>
                <span className="font-normal text-gray-500">
                  (one week from today)
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="create-rent-tenant"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500"
              >
                Tenant
              </label>
              <select
                id="create-rent-tenant"
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm transition focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main/20"
              >
                <option value="">Choose a tenant…</option>
                {tenantOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleCreateRent}
              disabled={isCreatingRent || tenantOptions.length === 0}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-brand-main px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-main/90 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[160px]"
            >
              {isCreatingRent ? "Creating…" : "Create rent"}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-lg p-4 lg:p-6 shadow-sm overflow-hidden"
          style={{ backgroundColor: ADMIN_STAT_BG.blue }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold uppercase tracking-wide truncate"
                style={{ color: ADMIN_STAT_LABEL.blue }}
              >
                Collected This Month
              </p>
              <p className="mt-1 lg:mt-2 text-xl lg:text-2xl font-bold text-gray-900 break-words leading-tight">
                {formatCurrency(collectedThisMonth)}
              </p>
            </div>
            <div className="flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-white/90 flex-shrink-0">
              <CheckCircle2
                className="h-4 w-4 lg:h-5 lg:w-5"
                style={{ color: ADMIN_STAT_LABEL.blue }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-lg p-4 lg:p-6 shadow-sm overflow-hidden"
          style={{ backgroundColor: ADMIN_STAT_BG.green }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold uppercase tracking-wide truncate"
                style={{ color: ADMIN_STAT_LABEL.green }}
              >
                Pending Payments
              </p>
              <p className="mt-1 lg:mt-2 text-xl lg:text-2xl font-bold text-gray-900 break-words leading-tight">
                {formatCurrency(pendingAmount)}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                {pendingPayments.length} tenants
              </p>
            </div>
            <div className="flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-white/90 flex-shrink-0">
              <Clock
                className="h-4 w-4 lg:h-5 lg:w-5"
                style={{ color: ADMIN_STAT_LABEL.green }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-lg p-4 lg:p-6 shadow-sm overflow-hidden"
          style={{ backgroundColor: ADMIN_STAT_BG.orange }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold uppercase tracking-wide truncate"
                style={{ color: ADMIN_STAT_LABEL.orange }}
              >
                Overdue
              </p>
              <p className="mt-1 lg:mt-2 text-xl lg:text-2xl font-bold text-gray-900 break-words leading-tight">
                {formatCurrency(overdueAmount)}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                {overduePayments.length} tenant
              </p>
            </div>
            <div className="flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-white/90 flex-shrink-0">
              <AlertCircle
                className="h-4 w-4 lg:h-5 lg:w-5"
                style={{ color: ADMIN_STAT_LABEL.orange }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2">
            <label
              htmlFor="period"
              className="text-sm font-medium text-gray-700"
            >
              Period:
            </label>
            <select
              id="period"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="h-[38px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
            >
              <option value="all">All</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="relative min-w-[300px] max-w-[2048px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tenant, property, or unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[38px] w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-x-auto">
        <table className="w-full table-auto min-w-[900px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Tenant
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Property
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Rent Amount
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Last Payment
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-3 lg:px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-14">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-10 text-center text-sm text-gray-500"
                >
                  Loading rent payments...
                </td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-10 text-center text-sm text-gray-500"
                >
                  No rent payments found.
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment, index) => (
                <motion.tr
                  key={payment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  whileHover={{ x: 4, transition: { duration: 0.2 } }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white flex-shrink-0">
                        {getInitials(payment.tenantName)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {payment.tenantName}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {payment.propertyName}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {payment.unit}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {formatCurrency(payment.rentAmount)}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {payment.dueDate}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {payment.lastPayment || "—"}
                  </td>
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                    {payment.balance ? formatCurrency(payment.balance) : "—"}
                  </td>
                  <td className="px-3 lg:px-6 py-4 text-right whitespace-nowrap">
                    <LandlordRentRowActionsMenu
                      row={payment}
                      onMarkPaid={handleMarkRentPaid}
                      isMarkingPaid={markingPaidRentId === payment.id}
                    />
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

// Main Rent Page Component
const RentPage: NextPageWithLayout = () => {
  const { user, isLoading } = useUser();

  // Show loading state while checking user
  if (isLoading) {
    return (
      <>
        <Head>
          <title>Rent | DWELLA NG</title>
        </Head>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">Loading...</p>
        </div>
      </>
    );
  }

  // Determine which view to show based on role
  const renderRentPage = () => {
    if (!user) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p>Please log in to view your rent information</p>
        </div>
      );
    }

    if (user.role === "tenant") {
      return <TenantPaymentHistory />;
    } else {
      // Landlord, manager, and super_admin see landlord view
      return <LandlordRentPage />;
    }
  };

  return (
    <>
      <Head>
        <title>Rent | DWELLA NG</title>
      </Head>
      {renderRentPage()}
    </>
  );
};

RentPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default RentPage;
