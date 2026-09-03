import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { AuthLayout } from "@/components/AuthLayout";
import {
  SecurityLoginForm,
  type SecurityLoginFormValues,
} from "@/components/security/SecurityLoginForm";
import { loginSecurity } from "@/api/security";
import {
  getSecuritySession,
  saveSecuritySession,
  sessionFromLogin,
} from "@/lib/securitySession";
import type { NextPageWithLayout } from "../_app";

const SecurityLoginPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (getSecuritySession()) {
      void router.replace("/security/home");
    }
  }, [router]);

  const handleLogin = React.useCallback(
    async (values: SecurityLoginFormValues) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await loginSecurity({
          phoneNumber: values.phoneNumber.trim(),
          password: values.password,
        });
        if (!result.success) {
          setError(result.error || "Could not sign in. Check your details.");
          return;
        }
        saveSecuritySession(
          sessionFromLogin(result.data),
          Boolean(values.keepLoggedIn),
        );
        await router.push("/security/home");
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  return (
    <>
      <Head>
        <title>Dwelliva · Security Sign In</title>
      </Head>
      <SecurityLoginForm
        onSubmit={handleLogin}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
};

SecurityLoginPage.getLayout = (page) => <AuthLayout>{page}</AuthLayout>;

export default SecurityLoginPage;
