import * as React from "react";
import Head from "next/head";

import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { AuthLayout } from "@/components/AuthLayout";
import { resetPassword } from "@/api/auth/resetPassword";

import type { NextPageWithLayout } from "../_app";

const ResetPasswordPage: NextPageWithLayout = () => {
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");

  const handleResetPassword = React.useCallback(
    async (values: { token: string; password: string }) => {
      setError(null);
      setSuccess(false);
      setIsLoading(true);

      const result = await resetPassword(values);

      if (result.success) {
        setSuccess(true);
        setSuccessMessage(result.data.message);
        setEmail(result.data.data.email);
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
        <title>NESCO Partners · Reset Password</title>
      </Head>
      <ResetPasswordForm
        onSubmit={handleResetPassword}
        error={error}
        isLoading={isLoading}
        success={success}
        successMessage={successMessage}
        email={email}
      />
    </>
  );
};

ResetPasswordPage.getLayout = (page) => <AuthLayout>{page}</AuthLayout>;

export default ResetPasswordPage;

