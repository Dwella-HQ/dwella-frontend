import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import { Home, ArrowRight } from "lucide-react";

import { AuthLayout } from "@/components/AuthLayout";
import { SignUpProgress } from "@/components/SignUpProgress";
import logo from "@/assets/logo.png";

import type { NextPageWithLayout } from "../../_app";

const LandlordOnboardingCompletePage: NextPageWithLayout = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleProceedToDashboard = React.useCallback(async () => {
    setIsSubmitting(true);
    await router.push("/dashboard");
    setIsSubmitting(false);
  }, [router]);

  return (
    <>
      <Head>
        <title>DWELLA NG · You&apos;re all set!</title>
      </Head>

      <div className="mx-auto w-full max-w-4xl">
        <nav className="relative mb-6 flex flex-col items-center justify-between gap-4 sm:mb-8 sm:flex-row sm:gap-0">
          <div className="flex w-full items-center justify-center gap-2 sm:w-auto sm:justify-start">
            <Image
              src={logo}
              alt="DWELLA NG logo"
              width={32}
              height={32}
              className="object-contain"
            />
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-brand-main">DWELLA</span>
              <span className="text-lg font-bold text-blue-400">NG</span>
            </div>
          </div>

          <div className="w-full sm:absolute sm:left-1/2 sm:w-auto sm:-translate-x-1/2">
            <SignUpProgress currentStep={3} />
          </div>

          <div className="hidden w-[200px] sm:block"></div>
        </nav>

        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
              <Home className="h-10 w-10 text-brand-main" />
            </div>
          </div>

          <h1 className="mb-4 text-3xl font-bold text-gray-900">
            You&apos;re all set!
          </h1>

          <p className="mb-4 text-sm text-gray-600">
            Your landlord account is registered. You can explore the dashboard
            while we review your documents.
          </p>

          <div className="mx-auto mb-8 max-w-lg rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
            <strong className="font-semibold">Property creation:</strong> You
            cannot add a new property until your account is approved. We&apos;ll
            notify you when you can list properties.
          </div>

          <div className="flex justify-center border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={handleProceedToDashboard}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Proceed to dashboard
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

LandlordOnboardingCompletePage.getLayout = (page) => (
  <AuthLayout showImage={false}>{page}</AuthLayout>
);

export default LandlordOnboardingCompletePage;
