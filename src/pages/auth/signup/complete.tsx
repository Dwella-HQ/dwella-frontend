import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import { Home, ArrowRight } from "lucide-react";

import { AuthLayout } from "@/components/AuthLayout";
import { SignUpProgress } from "@/components/SignUpProgress";
import logo from "@/assets/logo.png";

import type { NextPageWithLayout } from "../../_app";

const SignUpCompletePage: NextPageWithLayout = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleAddProperty = React.useCallback(async () => {
    setIsSubmitting(true);
    // Mock API call - complete signup
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Clear signup data from sessionStorage
    sessionStorage.removeItem("signupStep1");
    sessionStorage.removeItem("signupDocuments");

    // Set mock auth token and redirect to dashboard
    localStorage.setItem("authToken", "mock-auth-token");
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: 1,
        name: "New User",
        email: "user@dwella.ng",
        role: "landlord",
      })
    );

    router.push("/dashboard");
    setIsSubmitting(false);
  }, [router]);

  const handleDoLater = React.useCallback(async () => {
    setIsSubmitting(true);
    // Mock API call - complete signup
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Clear signup data from sessionStorage
    sessionStorage.removeItem("signupStep1");
    sessionStorage.removeItem("signupDocuments");

    // Set mock auth token and redirect to dashboard
    localStorage.setItem("authToken", "mock-auth-token");
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: 1,
        name: "New User",
        email: "user@dwella.ng",
        role: "landlord",
      })
    );

    router.push("/dashboard");
    setIsSubmitting(false);
  }, [router]);

  return (
    <>
      <Head>
        <title>DWELLA NG · You're all set!</title>
      </Head>

      <div className="w-full max-w-4xl mx-auto">
        {/* Navigation Bar with Logo and Progress Steps */}
        <nav className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 relative">
          {/* Logo - Far Left */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
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

          {/* Progress Indicator - Centered like Nav Links */}
          <div className="w-full sm:w-auto sm:absolute sm:left-1/2 sm:-translate-x-1/2">
            <SignUpProgress currentStep={3} />
          </div>

          {/* Spacer for right side balance - Hidden on mobile */}
          <div className="hidden sm:block w-[200px]"></div>
        </nav>

        {/* Completion Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-12 shadow-sm text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
              <Home className="h-10 w-10 text-brand-main" />
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-4 text-3xl font-bold text-gray-900">
            You're all set!
          </h1>

          {/* Description */}
          <p className="mb-8 text-sm text-gray-600">
            Now let's add your first property to get started with managing your
            rental business.
          </p>

          {/* Action Buttons */}
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={handleDoLater}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              I'll do this later
            </button>
            <button
              type="button"
              onClick={handleAddProperty}
              disabled={isSubmitting}
              className="rounded-lg bg-brand-main px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand-main/90 focus:outline-none focus:ring-2 focus:ring-brand-main focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
            >
              Add My First Property
            </button>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleDoLater}
              disabled={isSubmitting}
              className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 flex items-center gap-2"
            >
              Done <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

SignUpCompletePage.getLayout = (page) => (
  <AuthLayout showImage={false}>{page}</AuthLayout>
);

export default SignUpCompletePage;
