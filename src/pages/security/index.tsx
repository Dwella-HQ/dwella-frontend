import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { AuthLayout } from "@/components/AuthLayout";
import {
  SecurityLoginForm,
  type SecurityLoginFormValues,
} from "@/components/security/SecurityLoginForm";
import {
  createSecuritySession,
  getSecuritySession,
  saveSecuritySession,
} from "@/lib/securitySession";
import type { NextPageWithLayout } from "../_app";

const SecurityLoginPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (getSecuritySession()) {
      void router.replace("/security/home");
    }
  }, [router]);

  const handleLogin = React.useCallback(
    async (values: SecurityLoginFormValues) => {
      setIsLoading(true);
      try {
        const session = createSecuritySession(values.username);
        saveSecuritySession(session, Boolean(values.keepLoggedIn));
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
      <SecurityLoginForm onSubmit={handleLogin} isLoading={isLoading} />
    </>
  );
};

SecurityLoginPage.getLayout = (page) => <AuthLayout>{page}</AuthLayout>;

export default SecurityLoginPage;
