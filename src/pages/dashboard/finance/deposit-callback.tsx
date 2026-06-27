import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import * as React from "react";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import type { NextPageWithLayout } from "../../_app";
import { DashboardLayout } from "@/components/DashboardLayout";

function firstQueryString(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    return decodeURIComponent(raw.trim());
  } catch {
    return raw.trim();
  }
}

const DepositCallbackPage: NextPageWithLayout = () => {
  const router = useRouter();

  const status = React.useMemo(
    () => firstQueryString(router.query.status)?.toLowerCase() ?? null,
    [router.query.status],
  );
  const reference = React.useMemo(() => {
    return (
      firstQueryString(router.query.tx_ref) ??
      firstQueryString(router.query.reference) ??
      firstQueryString(router.query.trxref)
    );
  }, [router.query.reference, router.query.trxref, router.query.tx_ref]);
  const transactionId = React.useMemo(
    () => firstQueryString(router.query.transaction_id),
    [router.query.transaction_id],
  );

  const failed = status === "failed" || status === "cancelled";
  const successful = status === "successful" || status === "completed";

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void router.push("/dashboard/finance");
    }, 9000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <>
      <Head>
        <title>Deposit status | Dwelliva</title>
      </Head>

      <section className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-xl">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
              failed
                ? "bg-red-100 text-red-600"
                : successful
                  ? "bg-green-100 text-green-600"
                  : "bg-blue-100 text-blue-600"
            }`}
          >
            {failed ? (
              <XCircle className="h-9 w-9" />
            ) : successful ? (
              <CheckCircle2 className="h-9 w-9" />
            ) : (
              <Clock3 className="h-9 w-9" />
            )}
          </div>

          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            {failed
              ? "Deposit was not completed"
              : successful
                ? "Deposit submitted"
                : "Deposit processing"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            {failed
              ? "The payment gateway did not complete this deposit. You can try again from Finance."
              : "Your deposit has been sent for confirmation. Your wallet balance will update once processing is complete."}
          </p>

          {reference || transactionId ? (
            <div className="mt-5 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-left text-xs text-gray-600">
              {reference ? (
                <p className="break-all">
                  Reference:{" "}
                  <span className="font-mono text-gray-800">{reference}</span>
                </p>
              ) : null}
              {transactionId ? (
                <p className={reference ? "mt-2 break-all" : "break-all"}>
                  Transaction ID:{" "}
                  <span className="font-mono text-gray-800">
                    {transactionId}
                  </span>
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-7">
            <Link
              href="/dashboard/finance"
              className="inline-flex items-center justify-center rounded-lg bg-brand-main px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-main/90"
            >
              Back to finance
            </Link>
          </div>

          <p className="mt-5 text-xs text-gray-500">
            You will be redirected to Finance in a few seconds.
          </p>
        </div>
      </section>
    </>
  );
};

DepositCallbackPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default DepositCallbackPage;
