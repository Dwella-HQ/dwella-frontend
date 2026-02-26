import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import { Eye, EyeOff, Key } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";

import { AuthLayout } from "@/components/AuthLayout";
import { PhoneInputWithCountry } from "@/components/PhoneInputWithCountry";
import { register } from "@/api/auth";
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
  const [selectedRole, setSelectedRole] = React.useState<"tenant" | "landlord" | "manager" | null>(null);

  // Get role from query params (wait for router to be ready – query is empty on first paint)
  React.useEffect(() => {
    if (!router.isReady) return;
    const role = router.query.role as string;
    if (role && ["tenant", "landlord", "manager"].includes(role)) {
      setSelectedRole(role as "tenant" | "landlord" | "manager");
    } else {
      router.push("/");
    }
  }, [router.isReady, router.query.role, router]);

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
      router.push("/");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Map role to API roleName
      const roleNameMap: Record<"tenant" | "landlord" | "manager", "tenant" | "landlord" | "property_manager"> = {
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
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Store actual email in sessionStorage for resend functionality
      sessionStorage.setItem("pendingVerificationEmail", data.email);

      // Create masked email for display
      const maskedEmail = data.email.replace(
        /(.{2})(.*)(@.*)/,
        (_, start, middle, domain) => `${start}${"*".repeat(Math.min(middle.length, 4))}${domain}`
      );

      // Redirect to "check your email" page
      router.push({
        pathname: "/auth/send-email-verify",
        query: { email: maskedEmail },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  });

  const handleGoogleSignUp = React.useCallback(() => {
    // TODO: Implement Google sign-up
    console.log("Google sign-up clicked");
  }, []);

  if (!selectedRole) {
    return null; // Will redirect
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
            Please login to continue to your account.
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
                <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">
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
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
                {...registerField("fullName")}
              />
              {errors.fullName && (
                <p id="fullName-error" className="mt-1 text-xs text-red-600" role="alert">
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
                    aria-describedby={errors.phoneNumber ? "phoneNumber-error" : undefined}
                  />
                )}
              />
              {errors.phoneNumber && (
                <p id="phoneNumber-error" className="mt-1 text-xs text-red-600" role="alert">
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
                  aria-describedby={errors.password ? "password-error" : undefined}
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
                <p id="password-error" className="mt-1 text-xs text-red-600" role="alert">
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
                  aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
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
                <p id="confirmPassword-error" className="mt-1 text-xs text-red-600" role="alert">
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

          {/* Google Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
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
