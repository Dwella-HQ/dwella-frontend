import * as React from "react";
import * as Label from "@radix-ui/react-label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Eye, EyeOff, Key } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export type LoginFormProps = {
  onSubmit?: (values: LoginFormValues) => Promise<void> | void;
  error?: string | null;
  isLoading?: boolean;
};

export const LoginForm = ({
  onSubmit,
  error,
  isLoading,
}: LoginFormProps) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const loading = isLoading || isSubmitting;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
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

  const togglePasswordVisibility = React.useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
        {/* Logo and Name */}
        <div className="flex flex-col items-center justify-center mb-6">
          <Image
            src={logo}
            alt="DWELLA NG logo"
            width={64}
            height={64}
            priority
            className="object-contain mb-2"
          />
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-brand-main">DWELLA</span>
            <span className="text-lg font-bold text-blue-400">NG</span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign in</h2>
          <p className="text-sm text-gray-600">
            Please login to continue to your account.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {/* Email Field */}
        <fieldset className="flex flex-col gap-2">
          <Label.Root
            className="text-sm font-medium text-gray-700"
            htmlFor="email"
          >
            Email
          </Label.Root>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="e.g. you@example.com"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-red-600" role="alert">
              {errors.email.message}
            </p>
          )}
        </fieldset>

        {/* Password Field */}
        <fieldset className="flex flex-col gap-2">
          <Label.Root
            className="text-sm font-medium text-gray-700"
            htmlFor="password"
          >
            Password
          </Label.Root>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
              aria-required="true"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
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
            <p
              id="password-error"
              className="text-xs text-red-600"
              role="alert"
            >
              {errors.password.message}
            </p>
          )}
        </fieldset>

        {/* Forgot password link */}
        <div className="flex items-center justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-brand-main hover:text-brand-main/80 hover:underline font-medium"
          >
            Forgot password?
          </Link>
        </div>

        {/* Log In Button */}
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
              Logging in...
            </span>
          ) : (
            "Log In"
          )}
        </motion.button>

        {/* Sign Up Link */}
        <div className="text-center text-sm text-gray-600">
          Don't Have account?{" "}
          <Link
            href="/auth/signup"
            className="text-brand-main hover:text-brand-main/80 hover:underline font-medium"
          >
            Sign Up
          </Link>
        </div>
      </form>
    </div>
  );
};
