import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import { LoginForm } from "@/components/LoginForm";
import { AuthLayout } from "@/components/AuthLayout";
import { useUser, type UserRole } from "@/contexts/UserContext";
import { login } from "@/api/auth";
import { getLandlordByUser } from "@/api/landlord";
import { getTenantByUser } from "@/api/tenants";
import { resolveTenantActiveLeaseId } from "@/api/rent";
import { ensureLandlordWallet } from "@/api/wallet";
import { consumePostLoginRedirect } from "@/utils/postLoginRedirect";

import type { NextPageWithLayout } from "../_app";

const LoginPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { setUser } = useUser();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

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

  const resetClientSession = React.useCallback(() => {
    if (typeof window === "undefined") return;

    const localKeysToClear = [
      "user",
      "authToken",
      "accessToken",
      "userId",
      "landlordId",
      "tenantId",
      "leaseId",
      "selectedLandlord",
      "selectedLandlordId",
      "lastCreatedPropertyId",
    ];
    localKeysToClear.forEach((k) => localStorage.removeItem(k));

    const sessionKeysToClear = [
      "landlordOnboardingDetails",
      "landlordOnboardingDocumentIds",
      "landlordOnboardingProfilePictureId",
      "landlordOnboardingStarted",
    ];
    sessionKeysToClear.forEach((k) => sessionStorage.removeItem(k));

    const expired = "Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = `selectedLandlord=; Path=/; Expires=${expired}; SameSite=Lax`;
    document.cookie = `selectedLandlordId=; Path=/; Expires=${expired}; SameSite=Lax`;
    document.cookie = `accessToken=; Path=/; Expires=${expired}; SameSite=Lax`;
    document.cookie = `authToken=; Path=/; Expires=${expired}; SameSite=Lax`;
    document.cookie = `landlordId=; Path=/; Expires=${expired}; SameSite=Lax`;
  }, []);

  const persistFreshAuth = React.useCallback(
    (userId: string, accessToken: string) => {
      if (typeof window === "undefined") return;

      localStorage.setItem("userId", userId);
      localStorage.setItem("accessToken", accessToken);

      const maxAge = 60 * 60 * 24 * 7; // 7 days
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `accessToken=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
      document.cookie = `authToken=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
    },
    [],
  );

  const persistLandlordId = React.useCallback((landlordId: string) => {
    if (typeof window === "undefined" || !landlordId) return;
    localStorage.setItem("landlordId", landlordId);
    const maxAge = 60 * 60 * 24 * 7;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `landlordId=${encodeURIComponent(landlordId)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  }, []);

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

      // Always clear stale cache/cookies before storing the new session.
      resetClientSession();
      setUser(user);
      persistFreshAuth(String(apiUser.id), accessToken);

      if (typeof window !== "undefined") {
        // Defensive: ensure role-specific stale identifiers are reset.
        localStorage.removeItem("tenantId");
        localStorage.removeItem("landlordId");
        localStorage.removeItem("leaseId");
      }

      if (role === "property_manager") {
        await router.push("/dashboard/select-landlord");
        return;
      }

      if (role === "landlord") {
        const landlordResult = await getLandlordByUser(apiUser.id);
        if (landlordResult.success) {
          if (typeof window !== "undefined" && landlordResult.data?.id) {
            persistLandlordId(landlordResult.data.id);
            // Landlord login should not depend on selected landlord cache.
            localStorage.removeItem("selectedLandlord");
            localStorage.removeItem("selectedLandlordId");
            const expired = "Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = `selectedLandlord=; Path=/; Expires=${expired}; SameSite=Lax`;
            document.cookie = `selectedLandlordId=; Path=/; Expires=${expired}; SameSite=Lax`;
          }
          // Ensure a wallet exists after login too (fallback in case onboarding wallet creation wasn't triggered).
          if (typeof window !== "undefined" && landlordResult.data?.id) {
            try {
              await ensureLandlordWallet(String(landlordResult.data.id), "NGN");
            } catch (e) {
              console.warn("ensureLandlordWallet failed:", e);
            }
          }
          await router.push(consumePostLoginRedirect() ?? "/dashboard");
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
        if (typeof window !== "undefined") {
          if (tenantResult.success && tenantResult.data?.id) {
            localStorage.setItem("tenantId", tenantResult.data.id);
            const activeLeaseId = resolveTenantActiveLeaseId(
              tenantResult.data.leases as
                | Array<Record<string, unknown>>
                | undefined,
              null,
            );
            if (activeLeaseId) {
              localStorage.setItem("leaseId", activeLeaseId);
            } else {
              localStorage.removeItem("leaseId");
            }
          } else {
            localStorage.removeItem("leaseId");
          }
        }
      }

      await router.push(consumePostLoginRedirect() ?? "/dashboard");
    },
    [
      mapRoleNameToUserRole,
      persistLandlordId,
      persistFreshAuth,
      resetClientSession,
      router,
      setUser,
    ],
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

  return (
    <>
      <Head>
        <title>DWELLA NG · Sign in</title>
      </Head>
      <LoginForm onSubmit={handleLogin} error={error} isLoading={isLoading} />
    </>
  );
};

LoginPage.getLayout = (page) => <AuthLayout>{page}</AuthLayout>;

export default LoginPage;
