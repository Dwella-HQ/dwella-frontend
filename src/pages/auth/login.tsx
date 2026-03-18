import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

import { LoginForm } from "@/components/LoginForm";
import { AuthLayout } from "@/components/AuthLayout";
import { useUser, type UserRole } from "@/contexts/UserContext";
import { googleLogin, login } from "@/api/auth";
import { getLandlordByUser } from "@/api/landlord";
import { getTenantByUser } from "@/api/tenants";

import type { NextPageWithLayout } from "../_app";

const LoginPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { setUser } = useUser();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [googleRole, setGoogleRole] = React.useState<
    "tenant" | "landlord" | "manager" | null
  >(null);

  const mapRoleNameToUserRole = React.useCallback(
    (roleName: string): UserRole => {
      if (roleName === "super_admin" || roleName === "admin") {
        return "super_admin";
      }
      if (roleName === "property_manager" || roleName === "manager") {
        return "property_manager";
      }
      if (roleName === "tenant") {
        return "tenant";
      }
      return "landlord";
    },
    [],
  );

  const completeLogin = React.useCallback(
    async (
      apiUser: {
        id: string;
        email: string;
        fullName?: string;
        name?: string;
        role?: { name?: string };
      },
      accessToken: string,
      fallbackName?: string,
    ) => {
      const roleName = apiUser.role?.name || "";
      const role = mapRoleNameToUserRole(roleName);

      const user = {
        id: apiUser.id,
        name:
          apiUser.fullName ||
          apiUser.name ||
          fallbackName ||
          apiUser.email.split("@")[0],
        email: apiUser.email,
        role,
        token: accessToken,
      };

      setUser(user);

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("landlordOnboardingDetails");
        sessionStorage.removeItem("landlordOnboardingDocumentIds");
        sessionStorage.removeItem("landlordOnboardingProfilePictureId");
        sessionStorage.removeItem("landlordOnboardingStarted");
      }

      if (role === "property_manager") {
        await router.push("/dashboard/select-landlord");
        return;
      }

      if (role === "landlord") {
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

        setError(
          landlordResult.error || "Unable to verify landlord onboarding",
        );
        return;
      }

      if (role === "tenant") {
        const tenantResult = await getTenantByUser(apiUser.id);
        if (
          tenantResult.success &&
          tenantResult.data?.id &&
          typeof window !== "undefined"
        ) {
          localStorage.setItem("tenantId", tenantResult.data.id);
        }
      }

      await router.push("/dashboard");
    },
    [mapRoleNameToUserRole, router, setUser],
  );

  const handleLogin = React.useCallback(
    async (values: { email: string; password: string }) => {
      setError(null);
      setIsLoading(true);

      try {
        const result = await login({
          email: values.email,
          password: values.password,
        });

        if (!result.success) {
          setError(result.error);
          setIsLoading(false);
          return;
        }

        // Map API response to User type
        const apiUser = result.data.data.user;
        await completeLogin(
          apiUser,
          result.data.data.accessToken,
          values.email.split("@")[0],
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [completeLogin],
  );

  const handleGoogleRoleSelected = React.useCallback(
    async (role: "tenant" | "landlord" | "manager") => {
      setError(null);
      setGoogleRole(role);
    },
    [],
  );

  const handleGoogleCredential = React.useCallback(
    async (cred: CredentialResponse) => {
      if (!googleRole) {
        setError("Please choose an account type for Google sign in.");
        return;
      }

      const idToken = cred.credential;
      if (!idToken) {
        setError("Google sign-in failed. Please try again.");
        return;
      }

      try {
        setError(null);
        setIsLoading(true);

        const roleNameMap: Record<
          "tenant" | "landlord" | "manager",
          "tenant" | "landlord" | "property_manager"
        > = {
          tenant: "tenant",
          landlord: "landlord",
          manager: "property_manager",
        };

        console.log("Google credential acquired:", {
          role: googleRole,
          idToken: `${idToken.slice(0, 10)}…${idToken.slice(-8)}`,
        });

        const result = await googleLogin({
          token: idToken,
          roleName: roleNameMap[googleRole],
        });

        if (!result.success) {
          console.log("Google login failed:", result);
          setError(result.error);
          return;
        }

        console.log("Google login succeeded (parsed):", {
          userId: result.data.data.user?.id,
          roleName: result.data.data.user?.role?.name,
          accessToken: result.data.data.accessToken
            ? `${result.data.data.accessToken.slice(0, 6)}…${result.data.data.accessToken.slice(-4)}`
            : "",
        });

        await completeLogin(
          result.data.data.user,
          result.data.data.accessToken,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Google sign-in failed. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [completeLogin, googleRole],
  );

  return (
    <>
      <Head>
        <title>DWELLA NG · Sign in</title>
      </Head>
      <LoginForm
        onSubmit={handleLogin}
        onGoogleSignIn={handleGoogleRoleSelected}
        error={error}
        isLoading={isLoading}
      />
      {/* Render the Google button only after role is chosen */}
      {googleRole && (
        <div className="mx-auto mt-4 w-full max-w-md">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
              Continue with Google as{" "}
              {googleRole === "manager" ? "property manager" : googleRole}
            </p>
            <GoogleLogin
              onSuccess={handleGoogleCredential}
              onError={() =>
                setError("Google sign-in failed. Please try again.")
              }
              useOneTap={false}
            />
          </div>
        </div>
      )}
    </>
  );
};

LoginPage.getLayout = (page) => <AuthLayout>{page}</AuthLayout>;

export default LoginPage;
