import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import { LoginForm } from "@/components/LoginForm";
import { AuthLayout } from "@/components/AuthLayout";

import type { NextPageWithLayout } from "../_app";

const LoginPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = React.useCallback(
    async (values: { username: string; password: string; email?: string }) => {
      setError(null);
      setIsLoading(true);

      // Mock login - no API call, just redirect to dashboard
      // TODO: Replace with actual API call when backend is ready
      try {
        // Set a mock token so dashboard doesn't redirect back to login
        localStorage.setItem("authToken", "mock-auth-token");
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: 1,
            name: "Favoudoh LandLord",
            email: values.username.includes("@") ? values.username : `${values.username}@dwella.ng`,
            role: "landlord",
          })
        );

        // Redirect to landlord dashboard
        await router.push("/dashboard");
      } catch (err) {
        setError("An error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  return (
    <>
      <Head>
        <title>DWELLA NG · Sign in</title>
      </Head>
      <LoginForm 
        onSubmit={handleLogin} 
        error={error}
        isLoading={isLoading}
      />
    </>
  );
};

LoginPage.getLayout = (page) => <AuthLayout>{page}</AuthLayout>;

export default LoginPage;
