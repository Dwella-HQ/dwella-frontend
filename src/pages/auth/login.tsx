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
import { getPropertyManagerPostAuthPath } from "@/lib/propertyManagerOnboardingFlow";
import { persistFreshAuth, resetClientSession } from "@/lib/clientSession";
import { setRememberMePreference } from "@/lib/authRefresh";

import type { NextPageWithLayout } from "../_app";

const LoginPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { setUser } = useUser();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [postRegisterHint, setPostRegisterHint] = React.useState<string | null>(
    null,
  );

  React.useEffect(() => {
    if (!router.isReady || typeof window === "undefined") return;
    const hint = sessionStorage.getItem("postRegisterLoginHint");
    if (hint) {
      setPostRegisterHint(hint);
      sessionStorage.removeItem("postRegisterLoginHint");
    }
  }, [router.isReady]);

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
      if (roleName === "guest" || roleName === "user") {
        return "guest";
      }
      return "landlord";
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

      setUser(user);
      persistFreshAuth(String(apiUser.id), accessToken);

      if (typeof window !== "undefined") {
        // Defensive: ensure role-specific stale identifiers are reset.
        localStorage.removeItem("tenantId");
        localStorage.removeItem("landlordId");
        localStorage.removeItem("leaseId");
      }

      if (role === "property_manager") {
        await router.push(getPropertyManagerPostAuthPath());
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

      if (role === "guest") {
        await router.push(consumePostLoginRedirect() ?? "/guest");
        return;
      }

      await router.push(consumePostLoginRedirect() ?? "/dashboard");
    },
    [mapRoleNameToUserRole, persistLandlordId, router, setUser],
  );

  const handleLogin = React.useCallback(
    async (values: { email: string; password: string; keepLoggedIn?: boolean }) => {
      setError(null);
      setIsLoading(true);

      // Clear any stale session/cache from a previous login *before*
      // calling `login()` — that call persists the new refresh token as
      // part of its own flow, and resetting afterwards (as this used to
      // do, inside `completeLogin`) would wipe the token right back out.
      resetClientSession();
      // Decide *before* logging in where the refresh token will be kept —
      // same reasoning as above.
      setRememberMePreference(Boolean(values.keepLoggedIn));

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
        <title>Dwelliva · Sign in</title>
      </Head>
      {postRegisterHint ? (
        <div className="mx-auto w-full max-w-md px-4 pt-6">
          <div
            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"
            role="status"
          >
            {postRegisterHint}
          </div>
        </div>
      ) : null}
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
