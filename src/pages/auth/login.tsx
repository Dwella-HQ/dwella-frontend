import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import { LoginForm } from "@/components/LoginForm";
import { AuthLayout } from "@/components/AuthLayout";
import { useUser, type UserRole } from "@/contexts/UserContext";
import { login } from "@/api/auth";
import { getLandlordByUser } from "@/api/landlord";

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

      try {
        // Use email if provided, otherwise use username as email
        const email = values.email || values.username;

        const result = await login({
          email,
          password: values.password,
        });

        if (!result.success) {
          setError(result.error);
          setIsLoading(false);
          return;
        }

        // Map API response to User type
        const apiUser = result.data.data.user;
        const roleName = apiUser.role?.name || "";

        // Map API role names to our UserRole type
        let role: UserRole = "landlord";
        if (roleName === "super_admin" || roleName === "admin") {
          role = "super_admin";
        } else if (roleName === "property_manager") {
          role = "property_manager";
        } else if (roleName === "tenant") {
          role = "tenant";
        } else {
          role = "landlord";
        }

        const user = {
          id: apiUser.id,
          name: apiUser.fullName || apiUser.name || email.split("@")[0],
          email: apiUser.email,
          role,
          token: result.data.data.accessToken,
        };

        // Set user in context and localStorage
        setUser(user);

        // Reset any stale onboarding data so new logins don't reuse old IDs
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("landlordOnboardingDetails");
          sessionStorage.removeItem("landlordOnboardingDocumentIds");
          sessionStorage.removeItem("landlordOnboardingProfilePictureId");
          sessionStorage.removeItem("landlordOnboardingStarted");
        }

        // Redirect based on role
        if (role === "property_manager") {
          // Property managers need to select a landlord first
          await router.push("/dashboard/select-landlord");
          return;
        }

        if (role === "landlord") {
          // Check if landlord has been onboarded (lookup by user id)
          const landlordResult = await getLandlordByUser(apiUser.id);
          if (landlordResult.success) {
            if (typeof window !== "undefined" && landlordResult.data?.id) {
              localStorage.setItem("landlordId", landlordResult.data.id);
            }
            await router.push("/dashboard");
            return;
          }

          if (landlordResult.statusCode === 404) {
            await router.push("/onboarding/landlord/details");
            return;
          }

          setError(landlordResult.error || "Unable to verify landlord onboarding");
          return;
        }

        // Super admins and tenants go directly to dashboard
        await router.push("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
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
