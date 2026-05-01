import Head from "next/head";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CheckCircle2 } from "lucide-react";
import type { NextPageWithLayout } from "../../_app";

/**
 * Tenant-facing page after Paystack (or similar) completes a rent payment.
 *
 * Configure your backend / Paystack `callback_url` to redirect here, e.g.:
 *   `${origin}/dashboard/rent/payment-success`
 * Paystack often appends `reference` and `trxref` query params.
 */
const PaymentSuccessPage: NextPageWithLayout = () => {
  const router = useRouter();

  const reference = React.useMemo(() => {
    const r = router.query.reference;
    const t = router.query.trxref;
    if (typeof r === "string" && r) return r;
    if (typeof t === "string" && t) return t;
    return null;
  }, [router.query.reference, router.query.trxref]);

  const amountLabel = React.useMemo(() => {
    const raw = router.query.amount;
    if (typeof raw !== "string" || !raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return `₦${n.toLocaleString("en-NG")}`;
  }, [router.query.amount]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void router.push("/dashboard/rent");
    }, 8000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <>
      <Head>
        <title>Payment successful | DWELLA NG</title>
      </Head>

      <section className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-xl sm:p-12"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 sm:h-20 sm:w-20"
            >
              <CheckCircle2 className="h-10 w-10 text-green-600 sm:h-12 sm:w-12" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-2xl font-bold text-gray-900 sm:text-3xl"
            >
              Payment successful
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-4 text-sm text-gray-600 sm:text-base"
            >
              Your rent payment has been submitted. If the amount was debited,
              your landlord will see the update once processing finishes.
              {amountLabel ? (
                <>
                  {" "}
                  <span className="font-semibold text-gray-900">
                    Amount: {amountLabel}
                  </span>
                </>
              ) : null}
            </motion.p>

            {reference ? (
              <p className="mt-3 break-all text-xs text-gray-500">
                Reference:{" "}
                <span className="font-mono text-gray-700">{reference}</span>
              </p>
            ) : null}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"
            >
              <Link
                href="/dashboard/rent"
                className="inline-flex items-center justify-center rounded-lg bg-brand-main px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-main/90"
              >
                Back to rent
              </Link>
            </motion.div>

            <p className="mt-6 text-xs text-gray-500">
              You will be redirected to your rent page in a few seconds…
            </p>
          </div>
        </motion.div>
      </section>
    </>
  );
};

PaymentSuccessPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default PaymentSuccessPage;
