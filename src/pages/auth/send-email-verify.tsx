import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";

import { AuthLayout } from "@/components/AuthLayout";
import { useToast } from "@/components/Toast";
import logo from "@/assets/logo.png";

import type { NextPageWithLayout } from "../_app";

const SendEmailVerifyPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = React.useState<string>("");
  const [actualEmail, setActualEmail] = React.useState<string>("");
  const [isResending, setIsResending] = React.useState(false);

  React.useEffect(() => {
    const emailParam = router.query.email as string;
    if (emailParam) {
      // Decode URL-encoded email
      const decodedEmail = decodeURIComponent(emailParam);
      setEmail(decodedEmail);
    }

    // Get actual email from sessionStorage (for resend functionality)
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem("pendingVerificationEmail");
      if (storedEmail) {
        setActualEmail(storedEmail);
      }
    }
  }, [router.query.email]);

  const handleResendLink = async () => {
    if (!actualEmail) {
      showToast("Email not found. Please sign up again.", "error");
      router.push("/auth/signup");
      return;
    }

    setIsResending(true);
    try {
      // TODO: Implement resend verification email API call
      // For now, we'll just show a success message
      // const result = await resendVerificationEmail({ email: actualEmail });
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      showToast("Verification email sent successfully!", "success");
    } catch (error) {
      showToast("Failed to resend email. Please try again.", "error");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <Head>
        <title>DWELLA NG · Check your email</title>
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

        {/* Verification Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm w-full text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Check your email</h1>
          
          <div className="mb-6 space-y-2">
            <p className="text-sm text-gray-600">
              We've sent you a verification link to{" "}
              <span className="font-medium text-gray-900">{email || "your email"}</span>.
            </p>
            <p className="text-sm text-gray-600">
              Click the link in the email to verify your account and finish setting things up.
            </p>
          </div>

          {/* Resend Link Button */}
          <button
            type="button"
            onClick={handleResendLink}
            disabled={isResending}
            className="w-full rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? "Sending..." : "Resend Link"}
          </button>

          {/* Go Back Link */}
          <div className="text-sm text-gray-600">
            <Link
              href="/auth/signup"
              className="font-medium text-brand-main hover:text-brand-main/80 underline"
            >
              Go back
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

SendEmailVerifyPage.getLayout = (page) => <AuthLayout>{page}</AuthLayout>;

export default SendEmailVerifyPage;

