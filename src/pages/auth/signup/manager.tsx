import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";

import { AuthLayout } from "@/components/AuthLayout";
import { PhoneInputWithCountry } from "@/components/PhoneInputWithCountry";
import { register, type RegisterRequestDTO } from "@/api/auth";
import { persistFreshAuth, resetClientSession } from "@/lib/clientSession";
import { useUser, type UserRole } from "@/contexts/UserContext";
import { consumePostLoginRedirect } from "@/utils/postLoginRedirect";
import { loginAfterInviteRegistration } from "@/utils/invitePostRegisterAuth";
import { getPropertyManagerInviteIdFromQuery } from "@/lib/propertyManagerInviteFromQuery";
import {
  isValidInternationalPhoneNumber,
  normalizePhoneNumberForApi,
} from "@/utils/phoneNumber";
import logo from "@/assets/logo_blue_vertical.png";

import type { NextPageWithLayout } from "../../_app";

const propertyManagerSignUpSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    fullName: z.string().min(1, "Full name is required"),
    phoneNumber: z
      .string()
      .min(1, "Phone number is required")
      .refine(isValidInternationalPhoneNumber, {
        message: "Enter a valid phone number.",
      }),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PropertyManagerSignUpValues = z.infer<
  typeof propertyManagerSignUpSchema
>;

const PropertyManagerSignUpPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { setUser } = useUser();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const {
    register: registerField,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PropertyManagerSignUpValues>({
    resolver: zodResolver(propertyManagerSignUpSchema),
    defaultValues: {
      email: "",
      fullName: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

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

  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const propertyManagerId = getPropertyManagerInviteIdFromQuery(
        router.query,
      );
      const isInvitedManagerSignup = propertyManagerId.length > 0;

      // Prepare request payload - always include these fields
      const payload: RegisterRequestDTO = {
        email: data.email,
        password: data.password,
        roleName: "property_manager",
        fullName: data.fullName,
        phoneNumber: normalizePhoneNumberForApi(data.phoneNumber),
        registrationType: "EMAIL",
      };

      // Include propertyManagerId ONLY if it exists in the URL query params
      // Do NOT include tenantId (it's optional and not needed for property managers)
      if (propertyManagerId) {
        payload.propertyManagerId = propertyManagerId;
      }

      const result = await register(payload);

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (isInvitedManagerSignup) {
        const regUser = result.data.data;
        const tokenFromRegister = result.registerAccessToken;

        const applyPmSession = async (
          accessToken: string,
          apiUser: {
            id: string;
            email: string;
            fullName?: string;
            name?: string;
            role?: { name?: string };
          },
        ) => {
          resetClientSession();
          setUser({
            id: apiUser.id,
            name:
              apiUser.fullName ||
              apiUser.name ||
              data.fullName ||
              apiUser.email.split("@")[0],
            email: apiUser.email,
            role: mapRoleNameToUserRole(apiUser.role?.name || ""),
            token: accessToken,
          });
          persistFreshAuth(String(apiUser.id), accessToken);
          await router.push(
            consumePostLoginRedirect() ?? "/dashboard/select-landlord",
          );
        };

        if (tokenFromRegister) {
          await applyPmSession(tokenFromRegister, regUser);
          return;
        }

        const loginResult = await loginAfterInviteRegistration(
          data.email,
          data.password,
        );

        if (loginResult.success) {
          await applyPmSession(
            loginResult.data.data.accessToken,
            loginResult.data.data.user,
          );
          return;
        }

        sessionStorage.setItem(
          "postRegisterLoginHint",
          "Your account is ready. Please sign in with the password you just created.",
        );
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("propertyManagerSignupSuccess", "true");
      }

      await router.push({
        pathname: "/auth/login",
        query: { email: data.email },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <>
      <Head>
        <title>Dwelliva · Property Manager Sign Up</title>
      </Head>

      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Image
            src={logo}
            alt="Dwelliva logo"
            width={150}
            height={118}
            className="h-auto w-32 object-contain"
          />
        </div>

        {/* Sign Up Form Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm w-full">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Property Manager Sign Up
          </h1>
          <p className="mb-6 text-sm text-gray-600">
            Create your account to start managing properties.
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
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="user@example.com"
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
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="John Doe"
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
                Phone Number <span className="text-red-500">*</span>
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
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  {...registerField("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
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
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={
                    errors.confirmPassword ? "confirmPassword-error" : undefined
                  }
                  {...registerField("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition ${
                isSubmitting
                  ? "cursor-not-allowed bg-gray-400"
                  : "hover:bg-gray-800"
              }`}
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-brand-main hover:text-brand-main/80 transition"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

PropertyManagerSignUpPage.getLayout = (page) => <AuthLayout>{page}</AuthLayout>;

export default PropertyManagerSignUpPage;
