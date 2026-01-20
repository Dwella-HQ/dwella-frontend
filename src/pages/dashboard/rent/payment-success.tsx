import Head from "next/head";
import * as React from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CheckCircle2 } from "lucide-react";
import { mockTenantRentalInfo } from "@/data/mockTenantData";
import type { NextPageWithLayout } from "../../_app";

const PaymentSuccessPage: NextPageWithLayout = () => {
  const router = useRouter();

  React.useEffect(() => {
    // Redirect to payment history after 3 seconds
    const timer = setTimeout(() => {
      router.push("/dashboard/rent");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  return (
    <>
      <Head>
        <title>Payment Successful | DWELLA NG</title>
      </Head>

      <section className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 sm:p-12 shadow-xl"
        >
          <div className="text-center">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-green-100"
            >
              <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
            </motion.div>

            {/* Success Message */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-2xl sm:text-3xl font-bold text-gray-900"
            >
              Payment Successful!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-4 text-sm sm:text-base text-gray-600"
            >
              Your rent payment of{" "}
              <span className="font-semibold text-gray-900">
                {formatCurrency(mockTenantRentalInfo.amountDue)}
              </span>{" "}
              has been processed successfully.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-xs sm:text-sm text-gray-500"
            >
              Redirecting to payment history...
            </motion.p>
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

