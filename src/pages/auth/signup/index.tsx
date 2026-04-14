import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import {
  BriefcaseBusiness,
  Building2,
  Eye,
  EyeOff,
  Key,
  UserRound,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";

import { AuthLayout } from "@/components/AuthLayout";
import { PhoneInputWithCountry } from "@/components/PhoneInputWithCountry";
import { register, googleLogin } from "@/api/auth";
import {
  formatRegistrationErrorForUser,
  isDuplicateEmailRegistrationError,
  maskEmailForDisplay,
} from "@/utils/registrationErrors";
import { useUser, type UserRole } from "@/contexts/UserContext";
import { getLandlordByUser } from "@/api/landlord";
import { getTenantByUser } from "@/api/tenants";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import logo from "@/assets/logo.png";

import type { NextPageWithLayout } from "../../_app";

const signUpSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    fullName: z.string().min(1, "Full name is required"),
    phoneNumber: z.string().min(1, "Phone number is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpValues = z.infer<typeof signUpSchema>;

const SignUpPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { setUser } = useUser();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<
    "tenant" | "landlord" | "manager" | null
  >(null);

  // Read role from query params; when absent we show the role chooser
  React.useEffect(() => {
    if (!router.isReady) return;
    const role = router.query.role as string;
    if (role && ["tenant", "landlord", "manager"].includes(role)) {
      setSelectedRole(role as "tenant" | "landlord" | "manager");
    } else {
      setSelectedRole(null);
    }
  }, [router.isReady, router.query.role]);

  const {
    register: registerField,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      fullName: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    if (!selectedRole) {
      setError("Please choose how you want to get started.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Map role to API roleName
      const roleNameMap: Record<
        "tenant" | "landlord" | "manager",
        "tenant" | "landlord" | "property_manager"
      > = {
        tenant: "tenant",
        landlord: "landlord",
        manager: "property_manager",
      };

      const tenantIdFromQuery = router.query["tenant-id"] as string | undefined;

      const payload: Parameters<typeof register>[0] = {
        email: data.email,
        password: data.password,
        roleName: roleNameMap[selectedRole],
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        registrationType: "EMAIL",
      };

      if (selectedRole === "tenant" && tenantIdFromQuery) {
        payload.tenantId = tenantIdFromQuery;
      }

      const result = await register(payload);

      if (!result.success) {
        const duplicateEmail =
          isDuplicateEmailRegistrationError(result.error) ||
          result.statusCode === 409;

        if (duplicateEmail && typeof window !== "undefined") {
          sessionStorage.setItem("pendingVerificationEmail", data.email);
          const maskedEmail = maskEmailForDisplay(data.email);
          await router.push({
            pathname: "/auth/send-email-verify",
            query: { email: maskedEmail, existing: "1" },
          });
          setIsSubmitting(false);
          return;
        }

        setError(formatRegistrationErrorForUser(result.error));
        setIsSubmitting(false);
        return;
      }

      // Store actual email in sessionStorage for resend functionality
      sessionStorage.setItem("pendingVerificationEmail", data.email);

      // Create masked email for display
      const maskedEmail = maskEmailForDisplay(data.email);

      // Redirect to "check your email" page
      router.push({
        pathname: "/auth/send-email-verify",
        query: { email: maskedEmail },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again.",
      );
      setIsSubmitting(false);
    }
  });

  // Map backend role name to frontend UserRole
  const mapRoleNameToUserRole = React.useCallback(
    (roleName: string): UserRole => {
      if (roleName === "super_admin" || roleName === "admin")
        return "super_admin";
      if (roleName === "property_manager" || roleName === "manager")
        return "property_manager";
      if (roleName === "tenant") return "tenant";
      return "landlord";
    },
    [],
  );

  const handleGoogleCredential = React.useCallback(
    async (cred: CredentialResponse) => {
      try {
        if (!selectedRole) {
          setError("Please choose how you want to get started.");
          return;
        }

        const roleNameMap: Record<
          "tenant" | "landlord" | "manager",
          "tenant" | "landlord" | "property_manager"
        > = {
          tenant: "tenant",
          landlord: "landlord",
          manager: "property_manager",
        };

        const idToken = cred.credential;
        if (!idToken) {
          setError("Google sign-in failed. Please try again.");
          return;
        }

        // Full JWT for backend debugging — remove or gate behind env when no longer needed.
        console.log("[Dwella] Google ID token (full JWT for backend):", idToken);

        console.log("Google credential acquired:", {
          role: selectedRole,
          idToken: `${idToken.slice(0, 10)}…${idToken.slice(-8)}`,
          fullStuff: cred,
        });

        const socialResult = await googleLogin({
          token: idToken,
          roleName: roleNameMap[selectedRole],
        });

        if (!socialResult.success) {
          console.log("Google signup/login failed:", socialResult);
          setError(socialResult.error);
          return;
        }

        console.log("Google signup/login succeeded (parsed):", {
          userId: socialResult.data.data.user?.id,
          roleName: socialResult.data.data.user?.role?.name,
          accessToken: socialResult.data.data.accessToken
            ? `${socialResult.data.data.accessToken.slice(0, 6)}…${socialResult.data.data.accessToken.slice(-4)}`
            : "",
        });

        const loginData = socialResult.data.data;
        const apiUser = loginData.user;
        const roleName = apiUser.role?.name || roleNameMap[selectedRole];
        const role: UserRole = mapRoleNameToUserRole(roleName);

        if (typeof window !== "undefined" && loginData.accessToken) {
          localStorage.setItem("accessToken", loginData.accessToken);
          localStorage.setItem("authToken", loginData.accessToken);
          if (apiUser.id) {
            localStorage.setItem("userId", apiUser.id);
          }
        }

        const user = {
          id: apiUser.id,
          name:
            apiUser.fullName ||
            apiUser.name ||
            apiUser.email?.split("@")[0] ||
            "",
          email: apiUser.email,
          role,
          token: loginData.accessToken,
        };

        setUser(user);

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
          await router.push("/dashboard");
          return;
        }

        await router.push("/dashboard");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Google sign-in failed. Please try again.",
        );
      }
    },
    [mapRoleNameToUserRole, router, selectedRole, setUser],
  );

  const handleSelectRole = React.useCallback(
    async (role: "tenant" | "landlord" | "manager") => {
      setError(null);
      const nextQuery: Record<string, string> = { role };
      const tenantIdFromQuery = router.query["tenant-id"];
      if (typeof tenantIdFromQuery === "string" && role === "tenant") {
        nextQuery["tenant-id"] = tenantIdFromQuery;
      }
      await router.push({
        pathname: "/auth/signup",
        query: nextQuery,
      });
    },
    [router],
  );

  const handleChangeRole = React.useCallback(async () => {
    setError(null);
    await router.push("/auth/signup");
  }, [router]);

  if (!selectedRole) {
    return (
      <>
        <Head>
          <title>DWELLA NG · Get Started As</title>
        </Head>

        <div className="w-full max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Image
              src={logo}
              alt="DWELLA NG logo"
              width={48}
              height={48}
              className="object-contain"
            />
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-brand-main">DWELLA</span>
              <span className="text-2xl font-bold text-blue-400">NG</span>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900">Get Started As</h1>
            <p className="mt-2 text-sm text-gray-600">
              Choose the account type that best describes you.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <button
                type="button"
                onClick={() => void handleSelectRole("tenant")}
                className="rounded-xl border border-gray-200 bg-white p-5 text-left transition hover:border-brand-main hover:bg-blue-50"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-brand-main">
                  <UserRound className="h-6 w-6" />
                </div>
                <p className="text-lg font-semibold text-gray-900">Tenant</p>
                <p className="mt-2 text-sm text-gray-600">
                  Find and manage your rented home, requests, and payments.
                </p>
              </button>

              <button
                type="button"
                onClick={() => void handleSelectRole("landlord")}
                className="rounded-xl border border-gray-200 bg-white p-5 text-left transition hover:border-brand-main hover:bg-blue-50"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-brand-main">
                  <Building2 className="h-6 w-6" />
                </div>
                <p className="text-lg font-semibold text-gray-900">Landlord</p>
                <p className="mt-2 text-sm text-gray-600">
                  List properties, manage tenants, and track rent and
                  maintenance.
                </p>
              </button>

              <button
                type="button"
                onClick={() => void handleSelectRole("manager")}
                className="rounded-xl border border-gray-200 bg-white p-5 text-left transition hover:border-brand-main hover:bg-blue-50"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-brand-main">
                  <BriefcaseBusiness className="h-6 w-6" />
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  Property Manager
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Manage properties and operations on behalf of landlords.
                </p>
              </button>
            </div>

            <div className="mt-8 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-brand-main hover:text-brand-main/80"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>DWELLA NG · Sign Up</title>
      </Head>

      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Image
            src={logo}
            alt="DWELLA NG logo"
            width={48}
            height={48}
            className="object-contain"
          />
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-brand-main">DWELLA</span>
            <span className="text-2xl font-bold text-blue-400">NG</span>
          </div>
        </div>

        {/* Sign Up Form Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm w-full">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Sign Up</h1>
          <p className="mb-6 text-sm text-gray-600">
            Create your{" "}
            {selectedRole === "manager" ? "property manager" : selectedRole}{" "}
            account.
          </p>
          <button
            type="button"
            onClick={() => void handleChangeRole()}
            className="mb-6 text-sm font-medium text-brand-main hover:text-brand-main/80"
          >
            Change role
          </button>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Placeholder"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...registerField("email")}
              />
              {errors.email && (
                <p
                  id="email-error"
                  className="mt-1 text-xs text-red-600"
                  role="alert"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Placeholder"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                aria-invalid={!!errors.fullName}
                aria-describedby={
                  errors.fullName ? "fullName-error" : undefined
                }
                {...registerField("fullName")}
              />
              {errors.fullName && (
                <p
                  id="fullName-error"
                  className="mt-1 text-xs text-red-600"
                  role="alert"
                >
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label
                htmlFor="phoneNumber"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <PhoneInputWithCountry
                    id="phoneNumber"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="801 234 5678"
                    aria-invalid={!!errors.phoneNumber}
                    aria-describedby={
                      errors.phoneNumber ? "phoneNumber-error" : undefined
                    }
                  />
                )}
              />
              {errors.phoneNumber && (
                <p
                  id="phoneNumber-error"
                  className="mt-1 text-xs text-red-600"
                  role="alert"
                >
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="************"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  {...registerField("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  className="mt-1 text-xs text-red-600"
                  role="alert"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="************"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={
                    errors.confirmPassword ? "confirmPassword-error" : undefined
                  }
                  {...registerField("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p
                  id="confirmPassword-error"
                  className="mt-1 text-xs text-red-600"
                  role="alert"
                >
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing up..." : "Sign Up"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500 bg-white">or</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Google Sign Up (ID token) */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleCredential}
              onError={() =>
                setError("Google sign-in failed. Please try again.")
              }
              useOneTap={false}
            />
          </div>
        </div>

        {/* Login Link */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Already Have account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-brand-main hover:text-brand-main/80"
          >
            Sign In
          </Link>
        </div>
      </div>
    </>
  );
};

SignUpPage.getLayout = (page) => <AuthLayout>{page}</AuthLayout>;

export default SignUpPage;
