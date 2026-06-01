import * as React from "react";
import * as Label from "@radix-ui/react-label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo_blue_vertical.png";

const forgotPasswordFormSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;

export type ForgotPasswordFormProps = {
  onSubmit?: (values: ForgotPasswordFormValues) => Promise<void> | void;
  error?: string | null;
  isLoading?: boolean;
  success?: boolean;
  successMessage?: string;
};

export const ForgotPasswordForm = ({
  onSubmit,
  error,
  isLoading,
  success,
  successMessage,
}: ForgotPasswordFormProps) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const loading = isLoading || isSubmitting;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleFormSubmit = handleSubmit(async (values) => {
    try {
      setIsSubmitting(true);
      await onSubmit?.(values);
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
            Forgot Password?
          </h2>
          <p className="text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
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
              {successMessage || "Password reset link has been sent to your email."}
            </p>
            <p className="text-xs text-green-600 text-center">
              Please check your inbox and follow the instructions to reset your password.
            </p>
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

        {/* Email Field */}
        {!success && (
          <>
            <fieldset className="flex flex-col gap-2">
              <Label.Root
                className="text-sm font-medium text-gray-700"
                htmlFor="email"
              >
                Email Address
              </Label.Root>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-xs text-red-600" role="alert">
                  {errors.email.message}
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
                  Sending...
                </span>
              ) : (
                "Send Reset Link"
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
