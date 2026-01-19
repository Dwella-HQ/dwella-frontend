import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import { LoginForm } from "@/components/LoginForm";
import { AuthLayout } from "@/components/AuthLayout";
import { useUser, type UserRole } from "@/contexts/UserContext";

import type { NextPageWithLayout } from "../_app";

const LoginPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { setUser } = useUser();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = React.useCallback(
    async (values: { username: string; password: string; email?: string }) => {
      setError(null);
      setIsLoading(true);

      // Mock login - determine role based on username
      // TODO: Replace with actual API call when backend is ready
      try {
        const username = values.username.toLowerCase().trim();
        let role: UserRole = "landlord";
        let name = "Favoudoh LandLord";
        let id = 1;

        // Determine role based on username
        if (username === "manager" || username.includes("manager")) {
          role = "manager";
          name = "Property Manager";
          id = 2;
        } else if (username === "tenant" || username.includes("tenant")) {
          role = "tenant";
          name = "John Tenant";
          id = 3;
        } else {
          role = "landlord";
          name = "Favoudoh LandLord";
          id = 1;
        }

        const email = values.username.includes("@") 
          ? values.username 
          : `${values.username}@dwella.ng`;

        const mockToken = `mock-auth-token-${role}-${id}`;

        const user = {
          id,
          name,
          email,
          role,
          token: mockToken,
        };

        // Set user in context and localStorage
        setUser(user);

        // Redirect based on role
        if (role === "manager") {
          // Managers need to select a landlord first
          await router.push("/dashboard/select-landlord");
        } else {
          // Landlords and tenants go directly to dashboard
          await router.push("/dashboard");
        }
      } catch (err) {
        setError("An error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [router, setUser]
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
