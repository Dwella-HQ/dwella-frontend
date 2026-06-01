import Head from "next/head";
import * as React from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { format, isValid, parseISO } from "date-fns";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ArrowLeft, Wallet, Shield } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { getTenantByUser } from "@/api/tenants";
import { getRentsByLease, resolveTenantActiveLeaseId } from "@/api/rent";
import {
  createRentPayment,
  extractRentPaymentCheckoutUrl,
  generateRentPaymentIdempotencyKey,
} from "@/api/rent-payment";
import { getProperty } from "@/api/properties";
import { useToast } from "@/components/Toast";
import type { NextPageWithLayout } from "../../_app";

function formatDueDateLabel(value: string): string {
  if (!value || value === "—") return "—";
  try {
    const d = parseISO(value);
    return isValid(d) ? format(d, "dd MMM yyyy") : value;
  } catch {
    return value;
  }
}

function landlordDisplayFromProperty(
  property: Record<string, unknown> | null,
): string {
  if (!property) return "Landlord";
  const landlordRecord = property.landlord as
    | Record<string, unknown>
    | undefined;
  const landlordUser = landlordRecord?.user as
    | Record<string, unknown>
    | undefined;
  const fullName =
    typeof landlordUser?.fullName === "string" ? landlordUser.fullName : "";
  const businessName =
    typeof landlordRecord?.businessName === "string"
      ? landlordRecord.businessName
      : "";
  const landLordName =
    typeof landlordRecord?.landLordName === "string"
      ? landlordRecord.landLordName
      : "";
  return (
    fullName.trim() || businessName.trim() || landLordName.trim() || "Landlord"
  );
}

const PayRentPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { user } = useUser();
  const { showToast } = useToast();
  const [paymentMethod, setPaymentMethod] = React.useState<
    "bank" | "card" | "mobile"
  >("bank");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [amountDue, setAmountDue] = React.useState(0);
  const [dueDate, setDueDate] = React.useState("—");
  const [propertyName, setPropertyName] = React.useState("—");
  const [unitName, setUnitName] = React.useState("—");
  const [landlordName, setLandlordName] = React.useState("—");
  const [selectedRentId, setSelectedRentId] = React.useState<string | null>(
    null,
  );
  const [rentLoadState, setRentLoadState] = React.useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [rentLoadMessage, setRentLoadMessage] = React.useState<string | null>(
    null,
  );
  const payPageLoadGenRef = React.useRef(0);

  React.useEffect(() => {
    if (!router.isReady || !user?.id || user.role !== "tenant") return;

    const gen = ++payPageLoadGenRef.current;
    setRentLoadState("loading");
    setRentLoadMessage(null);

    const rentIdFromQuery =
      typeof router.query.rentId === "string" ? router.query.rentId : undefined;
    const storedLeaseId =
      typeof window !== "undefined" ? localStorage.getItem("leaseId") : null;

    void (async () => {
      try {
        const tenantResult = await getTenantByUser(String(user.id));
        if (gen !== payPageLoadGenRef.current) return;
        if (!tenantResult.success) {
          setRentLoadState("error");
          setRentLoadMessage(
            tenantResult.error || "Could not load tenant profile",
          );
          return;
        }

        const leaseId = resolveTenantActiveLeaseId(
          tenantResult.data.leases as
            | Array<Record<string, unknown>>
            | undefined,
          storedLeaseId,
        );
        if (!leaseId) {
          setRentLoadState("error");
          setRentLoadMessage(
            "No active rent/lease found. Contact your landlord.",
          );
          return;
        }
        if (typeof window !== "undefined")
          localStorage.setItem("leaseId", leaseId);

        const propertyId = tenantResult.data.currentUnit?.property?.id;
        let propertyRecord: Record<string, unknown> | null = null;
        if (propertyId) {
          const propertyResult = await getProperty(String(propertyId));
          if (gen === payPageLoadGenRef.current && propertyResult.success) {
            propertyRecord = propertyResult.data as Record<string, unknown>;
          }
        }

        const rentsResult = await getRentsByLease(leaseId);
        if (gen !== payPageLoadGenRef.current) return;
        if (!rentsResult.success || rentsResult.data.length === 0) {
          setRentLoadState("error");
          setRentLoadMessage(
            !rentsResult.success
              ? rentsResult.error || "Could not load rent records"
              : "No rent records yet for this lease.",
          );
          return;
        }
        const byQuery = rentIdFromQuery
          ? rentsResult.data.find((r) => r.id === rentIdFromQuery)
          : undefined;
        if (rentIdFromQuery && !byQuery) {
          setRentLoadState("error");
          setRentLoadMessage("That rent item was not found for your lease.");
          return;
        }
        const pending =
          byQuery ||
          (rentsResult.data.find(
            (r) => (r.status || "").toLowerCase() !== "paid",
          ) ??
            rentsResult.data[0]);
        setSelectedRentId(pending.id);
        setAmountDue(pending.totalAmount ?? pending.amount ?? 0);
        setDueDate(formatDueDateLabel(pending.dueDate ?? "—"));
        setUnitName(tenantResult.data.currentUnit?.name ?? "—");
        setPropertyName(
          (propertyRecord?.name as string | undefined) ||
            tenantResult.data.currentUnit?.property?.name ||
            "—",
        );
        setLandlordName(landlordDisplayFromProperty(propertyRecord));
        setRentLoadState("ready");
      } catch (e) {
        console.error("[PayRentPage] load failed:", e);
        if (gen === payPageLoadGenRef.current) {
          setRentLoadState("error");
          setRentLoadMessage("Something went wrong loading rent.");
        }
      }
    })();
  }, [user?.id, user?.role, router.isReady, router.query.rentId]);

  const handleProceed = React.useCallback(async () => {
    if (!selectedRentId) {
      showToast("No pending rent found for payment", "error");
      return;
    }
    setIsProcessing(true);
    const idempotencyKey = generateRentPaymentIdempotencyKey();
    const result = await createRentPayment(selectedRentId, {
      idempotencyKey,
    });
    setIsProcessing(false);
    if (!result.success) {
      showToast(result.error || "Failed to initialize rent payment", "error");
      return;
    }
    const checkoutUrl = extractRentPaymentCheckoutUrl(result.data);
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
      return;
    }
    showToast(
      "Payment started, but no checkout link was returned. Try again, or contact support if this keeps happening.",
      "error",
      7000,
    );
  }, [router, selectedRentId, showToast]);

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  return (
    <>
      <Head>
        <title>Pay Rent | Dwelliva</title>
      </Head>

      <section className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Pay Rent
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">
              Make your monthly rent payment securely
            </p>
          </div>
        </div>

        {/* Amount Due Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl rounded-lg bg-green-600 p-6 sm:p-8 text-white shadow-lg"
        >
          {rentLoadState === "loading" && (
            <p className="mb-4 text-sm text-white/90">Loading your rent…</p>
          )}
          {rentLoadState === "error" && rentLoadMessage && (
            <p className="mb-4 rounded-md bg-white/15 px-3 py-2 text-sm text-white">
              {rentLoadMessage}
            </p>
          )}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm sm:text-base font-medium text-white/90">
                Amount Due
              </p>
              <p className="mt-2 text-3xl sm:text-4xl font-bold">
                {rentLoadState === "ready" ? formatCurrency(amountDue) : "—"}
              </p>
            </div>
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/20">
              <svg
                className="h-6 w-6 sm:h-7 sm:w-7 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Building outline - tall rectangle with flat roof */}
                <rect x="5" y="4" width="14" height="16" />
                {/* Windows - 3x3 grid of circles */}
                <circle cx="8" cy="8" r="1.2" fill="currentColor" />
                <circle cx="12" cy="8" r="1.2" fill="currentColor" />
                <circle cx="16" cy="8" r="1.2" fill="currentColor" />
                <circle cx="8" cy="12" r="1.2" fill="currentColor" />
                <circle cx="12" cy="12" r="1.2" fill="currentColor" />
                <circle cx="16" cy="12" r="1.2" fill="currentColor" />
                <circle cx="8" cy="16" r="1.2" fill="currentColor" />
                <circle cx="12" cy="16" r="1.2" fill="currentColor" />
                <circle cx="16" cy="16" r="1.2" fill="currentColor" />
                {/* Entrance - wider rectangle with inverted U at bottom */}
                <rect x="9.5" y="17" width="5" height="3" />
                <path d="M10.5 20 Q12 18.5 13.5 20" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-white/20">
            <div>
              <p className="text-xs sm:text-sm text-white/80">Property</p>
              <p className="mt-1 text-sm sm:text-base font-semibold">
                {propertyName}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-white/80">Unit</p>
              <p className="mt-1 text-sm sm:text-base font-semibold">
                {unitName}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-white/80">Due Date</p>
              <p className="mt-1 text-sm sm:text-base font-semibold">
                {dueDate}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-white/80">Landlord</p>
              <p className="mt-1 text-sm sm:text-base font-semibold">
                {landlordName}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Payment Method Section */}
        <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
            Payment Method
          </h2>
          <div className="space-y-3">
            <label className="flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-brand-main transition has-[:checked]:border-brand-main has-[:checked]:bg-brand-main/5">
              <input
                type="radio"
                name="paymentMethod"
                value="bank"
                checked={paymentMethod === "bank"}
                onChange={() => setPaymentMethod("bank")}
                className="h-4 w-4 text-brand-main focus:ring-brand-main"
              />
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <span className="text-sm sm:text-base font-medium text-gray-900">
                  Bank Transfer
                </span>
              </div>
            </label>

            <label className="flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-brand-main transition has-[:checked]:border-brand-main has-[:checked]:bg-brand-main/5">
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === "card"}
                onChange={() => setPaymentMethod("card")}
                className="h-4 w-4 text-brand-main focus:ring-brand-main"
              />
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <svg
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <span className="text-sm sm:text-base font-medium text-gray-900">
                  Card Payment
                </span>
              </div>
            </label>

            <label className="flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-brand-main transition has-[:checked]:border-brand-main has-[:checked]:bg-brand-main/5">
              <input
                type="radio"
                name="paymentMethod"
                value="mobile"
                checked={paymentMethod === "mobile"}
                onChange={() => setPaymentMethod("mobile")}
                className="h-4 w-4 text-brand-main focus:ring-brand-main"
              />
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span className="text-sm sm:text-base font-medium text-gray-900">
                  Mobile Money
                </span>
              </div>
            </label>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
            <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-green-600 font-medium">
              All payments are secured with bank-level encryption
            </p>
          </div>
          <div className="mt-6 flex flex-row gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 rounded-lg border border-gray-300 bg-white text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleProceed}
              disabled={
                isProcessing || rentLoadState !== "ready" || !selectedRentId
              }
              className="flex-1 px-6 py-3 rounded-lg bg-green-600 text-sm sm:text-base font-medium text-white hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <Wallet className="h-5 w-5" />
                  Proceed to Pay {formatCurrency(amountDue)}
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Payment Details Section */}
        <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Payment Details
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Rent Amount</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(amountDue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Service Fee</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(0)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="text-base font-semibold text-gray-900">
                Total Amount
              </span>
              <span className="text-base font-bold text-green-600">
                {formatCurrency(amountDue)}
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

PayRentPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default PayRentPage;
