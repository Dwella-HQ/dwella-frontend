import Head from "next/head";
import * as React from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ArrowLeft, Building2, Wallet, Shield } from "lucide-react";
import { mockTenantRentalInfo } from "@/data/mockTenantData";
import type { NextPageWithLayout } from "../../_app";

const PayRentPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = React.useState<
    "bank" | "card" | "mobile"
  >("bank");
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleProceed = React.useCallback(async () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      router.push("/dashboard/rent/payment-success");
    }, 1500);
  }, [router]);

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  return (
    <>
      <Head>
        <title>Pay Rent | DWELLA NG</title>
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm sm:text-base font-medium text-white/90">
                Amount Due
              </p>
              <p className="mt-2 text-3xl sm:text-4xl font-bold">
                {formatCurrency(mockTenantRentalInfo.amountDue)}
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
                {mockTenantRentalInfo.property.name}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-white/80">Unit</p>
              <p className="mt-1 text-sm sm:text-base font-semibold">
                {mockTenantRentalInfo.unit.number}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-white/80">Due Date</p>
              <p className="mt-1 text-sm sm:text-base font-semibold">
                {mockTenantRentalInfo.dueDate}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-white/80">Landlord</p>
              <p className="mt-1 text-sm sm:text-base font-semibold">
                {mockTenantRentalInfo.landlord.name}
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
              disabled={isProcessing}
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
                  Proceed to Pay {formatCurrency(mockTenantRentalInfo.amountDue)}
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
                {formatCurrency(mockTenantRentalInfo.amountDue)}
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
                {formatCurrency(mockTenantRentalInfo.amountDue)}
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

