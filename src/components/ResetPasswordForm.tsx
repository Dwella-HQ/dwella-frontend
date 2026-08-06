import * as React from "react";
import * as Label from "@radix-ui/react-label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff, Key } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo_blue_vertical.png";

const resetPasswordFormSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Please confirm your password."),
    token: z.string().min(1, "Reset token is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

export type ResetPasswordFormProps = {
  onSubmit?: (values: { password: string; token: string }) => Promise<void> | void;
  error?: string | null;
  isLoading?: boolean;
  success?: boolean;
  successMessage?: string;
  email?: string;
  defaultToken?: string;
};

export const ResetPasswordForm = ({
  onSubmit,
  error,
  isLoading,
  success,
  successMessage,
  email,
  defaultToken,
}: ResetPasswordFormProps) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const loading = isLoading || isSubmitting;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      token: defaultToken || "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleFormSubmit = handleSubmit(async (values) => {
    try {
      setIsSubmitting(true);
      // Exclude confirmPassword from the API call
      const { confirmPassword, ...apiValues } = values;
      await onSubmit?.(apiValues);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
        {/* Logo and Name */}
        <div className="flex flex-col items-center justify-center mb-6">
          <Image
            src={logo}
            alt="Dwelliva logo"
            width={150}
            height={118}
            priority
            className="h-auto w-36 object-contain"
          />
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Reset Password
          </h2>
          <p className="text-sm text-gray-600">
            Enter your reset token and set a new password for your account.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-green-50 border border-green-200 p-4 flex flex-col items-center gap-3"
          >
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <p className="text-sm text-green-700 text-center font-medium">
              {successMessage || "Password reset successful!"}
            </p>
            {email && (
              <p className="text-xs text-green-600 text-center">
                Account: {email}
              </p>
            )}
            <Link
              href="/auth/login"
              className="mt-2 inline-flex items-center gap-2 text-sm text-brand-main hover:text-brand-main/80 hover:underline font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </motion.div>
        )}

        {/* Error Message */}
        {error && !success && (
          <div
            className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {/* Form Fields */}
        {!success && (
          <>
            {/* Reset Token Field */}
            <fieldset className="flex flex-col gap-2">
              <Label.Root
                className="text-sm font-medium text-gray-700"
                htmlFor="token"
              >
                Reset Token
              </Label.Root>
              <input
                id="token"
                type="text"
                placeholder="Enter reset token from email"
                readOnly={!!defaultToken}
                className={`h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-brand-main ${
                  defaultToken ? "bg-gray-50 cursor-not-allowed" : ""
                }`}
                aria-required="true"
                aria-invalid={!!errors.token}
                aria-describedby={errors.token ? "token-error" : undefined}
                {...register("token")}
              />
              {defaultToken && (
                <p className="text-xs text-gray-500">
                  Reset code loaded from email link
                </p>
              )}
              {errors.token && (
                <p id="token-error" className="text-xs text-red-600" role="alert">
                  {errors.token.message}
                </p>
              )}
            </fieldset>

            {/* Password Field */}
            <fieldset className="flex flex-col gap-2">
              <Label.Root
                className="text-sm font-medium text-gray-700"
                htmlFor="password"
              >
                New Password
              </Label.Root>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-brand-main"
                  aria-required="true"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-main rounded"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Eye className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs text-red-600" role="alert">
                  {errors.password.message}
                </p>
              )}
            </fieldset>

            {/* Confirm Password Field */}
            <fieldset className="flex flex-col gap-2">
              <Label.Root
                className="text-sm font-medium text-gray-700"
                htmlFor="confirmPassword"
              >
                Confirm New Password
              </Label.Root>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-brand-main"
                  aria-required="true"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-main rounded"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Eye className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="text-xs text-red-600" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </fieldset>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="h-11 w-full rounded-lg bg-gray-900 text-sm font-semibold text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Resetting Password...
                </span>
              ) : (
                "Reset Password"
              )}
            </motion.button>

            {/* Back to Login Link */}
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm text-brand-main hover:text-brand-main/80 hover:underline font-medium justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </>
        )}
      </form>
    </div>
  );
};
