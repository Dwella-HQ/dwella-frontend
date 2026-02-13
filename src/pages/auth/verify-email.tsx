import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

import { AuthLayout } from "@/components/AuthLayout";
import { useToast } from "@/components/Toast";
import { getApiBaseUrl } from "@/utils/createUrl";
import logo from "@/assets/logo.png";

import type { NextPageWithLayout } from "../_app";

type VerificationStatus = "idle" | "verifying" | "success" | "error";

const VerifyEmailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [status, setStatus] = React.useState<VerificationStatus>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string>("");

  // Get query params
  const token = router.query.token as string | undefined;
  const emailParam = router.query.email as string | undefined;
  const verified = router.query.verified as string | undefined; // From backend redirect
  const isReady = router.isReady;

  // Handle server-side verification (backend redirects with verified=true)
  // This is a fallback if backend redirects browser navigation (not API calls)
  React.useEffect(() => {
    if (verified === "true") {
      setStatus("success");
      showToast("Email verified successfully!", "success");
      
      // Clear pending verification email from sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("pendingVerificationEmail");
      }

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
      return; // Don't proceed with API call
    }
  }, [verified, router, showToast]);

  // Main flow when backend only supports redirect-based verification:
  // Email link → Frontend → Frontend redirects to Backend → Backend redirects back with verified=true
  React.useEffect(() => {
    if (isReady && token && emailParam && verified !== "true" && status === "idle") {
      setStatus("verifying");
      setErrorMessage("");

      const backendUrl = getApiBaseUrl();
      const backendVerifyUrl = `${backendUrl}/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(emailParam)}`;

      // Redirect to backend in the browser (no XHR), so CORS is not involved
      window.location.href = backendVerifyUrl;
    }
  }, [isReady, token, emailParam, verified, status]);

  React.useEffect(() => {
    if (isReady && verified === "false" && status === "idle") {
      setStatus("error");
      setErrorMessage("Verification failed. Please request a new link.");
      showToast("Verification failed", "error");
    }
  }, [isReady, verified, status, showToast]);

  React.useEffect(() => {
    if (isReady && !verified && (!token || !emailParam) && status === "idle") {
      setStatus("error");
      setErrorMessage("Invalid verification link. Please request a new link.");
      showToast("Invalid verification link", "error");
    }
  }, [isReady, verified, token, emailParam, status, showToast]);

  return (
    <>
      <Head>
        <title>DWELLA NG · Verifying Email</title>
      </Head>

      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Image
            src={logo}
            alt="DWELLA NG logo"
            width={48}
            height={48}
            className="object-contain"
          />
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-brand-main">DWELLA</span>
            <span className="text-2xl font-bold text-blue-400">NG</span>
          </div>
        </div>

        {/* Verification Status Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm w-full text-center">
          {status === "verifying" && (
            <>
              <Loader2 className="w-16 h-16 text-brand-main animate-spin mx-auto mb-4" />
              <h1 className="mb-2 text-2xl font-bold text-gray-900">Verifying your email</h1>
              <p className="text-sm text-gray-600">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="mb-2 text-2xl font-bold text-gray-900">Email Verified!</h1>
              <p className="mb-6 text-sm text-gray-600">
                Your email has been successfully verified. You can now sign in to your account.
              </p>
              <Link
                href="/auth/login"
                className="inline-block w-full rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
              >
                Go to Sign In
              </Link>
              <p className="mt-4 text-xs text-gray-500">
                Redirecting to sign in page...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="mb-2 text-2xl font-bold text-gray-900">Verification Failed</h1>
              <p className="mb-6 text-sm text-gray-600">
                {errorMessage || "The verification link is invalid or has expired."}
              </p>
              <div className="space-y-3">
                <Link
                  href="/auth/login"
                  className="inline-block w-full text-center rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                >
                  Go to Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="inline-block w-full text-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                >
                  Sign Up Again
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

VerifyEmailPage.getLayout = (page) => <AuthLayout>{page}</AuthLayout>;

export default VerifyEmailPage;
