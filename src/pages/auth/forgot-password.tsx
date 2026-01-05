import * as React from "react";
import Head from "next/head";

import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { AuthLayout } from "@/components/AuthLayout";
import { requestPasswordReset } from "@/api/auth/passwordReset";

import type { NextPageWithLayout } from "../_app";

const ForgotPasswordPage: NextPageWithLayout = () => {
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string>("");

  const handlePasswordReset = React.useCallback(
    async (values: { email: string }) => {
      setError(null);
      setSuccess(false);
      setIsLoading(true);

      const result = await requestPasswordReset(values);

      if (result.success) {
        setSuccess(true);
        setSuccessMessage(result.data.message);
      } else {
        setError(result.error);
      }

      setIsLoading(false);
    },
    []
  );

  return (
    <>
      <Head>
        <title>NESCO Partners · Forgot Password</title>
      </Head>
      <ForgotPasswordForm
        onSubmit={handlePasswordReset}
        error={error}
        isLoading={isLoading}
        success={success}
        successMessage={successMessage}
      />
    </>
  );
};

ForgotPasswordPage.getLayout = (page) => <AuthLayout>{page}</AuthLayout>;

export default ForgotPasswordPage;

