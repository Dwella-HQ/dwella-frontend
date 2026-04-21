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
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";

import { AuthLayout } from "@/components/AuthLayout";
import { PhoneInputWithCountry } from "@/components/PhoneInputWithCountry";
import { register } from "@/api/auth";
import {
  formatRegistrationErrorForUser,
  isDuplicateEmailRegistrationError,
  maskEmailForDisplay,
} from "@/utils/registrationErrors";
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
    const tenantIdFromQuery = router.query["tenant-id"];
    const hasTenantInvite =
      typeof tenantIdFromQuery === "string" && tenantIdFromQuery.trim().length > 0;
    const isTenantInviteRole = role === "tenant" && hasTenantInvite;
    const isAllowedSelfSignupRole = role === "landlord" || role === "manager";
    if (role && (isTenantInviteRole || isAllowedSelfSignupRole)) {
      setSelectedRole(role as "tenant" | "landlord" | "manager");
    } else {
      setSelectedRole(null);
    }
  }, [router.isReady, router.query.role, router.query]);

  const {
    register: registerField,
    control,
    handleSubmit,
    setValue,
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

  React.useEffect(() => {
    if (!router.isReady) return;
    const pick = (keys: string[]): string => {
      for (const key of keys) {
        const raw = router.query[key];
        if (typeof raw === "string" && raw.trim()) return raw.trim();
      }
      return "";
    };
    const prefillEmail = pick(["email", "tenantEmail", "inviteEmail"]);
    const prefillName = pick(["fullName", "name", "tenantName"]);
    const prefillPhone = pick(["phoneNumber", "phone", "tenantPhone"]);

    if (prefillEmail) setValue("email", prefillEmail);
    if (prefillName) setValue("fullName", prefillName);
    if (prefillPhone) setValue("phoneNumber", prefillPhone);
  }, [router.isReady, router.query, setValue]);

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
              Choose how you want to use Dwella.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
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
