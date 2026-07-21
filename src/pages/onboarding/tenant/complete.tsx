import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import { Home, ArrowRight } from "lucide-react";

import { AuthLayout } from "@/components/AuthLayout";
import { SignUpProgress } from "@/components/SignUpProgress";
import logo from "@/assets/logo_blue_horizontal.png";

import type { NextPageWithLayout } from "../../_app";
import {
  markTenantOnboardingComplete,
  tenantFlowSteps,
} from "@/lib/tenantOnboardingFlow";

const TenantOnboardingCompletePage: NextPageWithLayout = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleDone = React.useCallback(async () => {
    setIsSubmitting(true);
    markTenantOnboardingComplete();
    await router.push("/dashboard");
    setIsSubmitting(false);
  }, [router]);

  return (
    <>
      <Head>
        <title>Dwelliva · You&apos;re all set!</title>
      </Head>

      <div className="mx-auto w-full max-w-4xl">
        <nav className="relative mb-6 flex flex-col items-center justify-between gap-4 sm:mb-8 sm:flex-row sm:gap-0">
          <div className="flex w-full items-center justify-center gap-2 sm:w-auto sm:justify-start">
            <Image
              src={logo}
              alt="Dwelliva logo"
              width={170}
              height={40}
              className="h-8 w-auto object-contain"
            />
          </div>

          <div className="w-full sm:absolute sm:left-1/2 sm:w-auto sm:-translate-x-1/2">
            <SignUpProgress currentStep={3} steps={tenantFlowSteps} />
          </div>

          <div className="hidden w-[200px] sm:block" />
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

          <p className="mb-8 text-sm text-gray-600">
            Your tenant account is ready. You can now access your dashboard,
            lease details, and messages.
          </p>

          <div className="flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => router.push("/onboarding/tenant/documents")}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleDone}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Done
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

TenantOnboardingCompletePage.getLayout = (page) => (
  <AuthLayout showImage={false}>{page}</AuthLayout>
);

export default TenantOnboardingCompletePage;
