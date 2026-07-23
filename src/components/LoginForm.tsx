import * as React from "react";
import * as Label from "@radix-ui/react-label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Eye, EyeOff, Key } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo_blue_vertical.png";

const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, "Username is required.")
    .email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  keepLoggedIn: z.boolean().optional(),
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
      keepLoggedIn: false,
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
        <div className="mb-2 flex flex-col items-center justify-center">
          <Image
            src={logo}
            alt="Dwelliva logo"
            width={150}
            height={118}
            priority
            className="h-auto w-36 object-contain"
          />
        </div>

        <div className="mb-2 text-center">
          <h2 className="mb-2 text-3xl font-bold text-gray-900">Sign in</h2>
          <p className="text-sm text-gray-600">
            Please login to continue to your account.
          </p>
        </div>

        {error && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        <fieldset className="flex flex-col gap-2">
          <Label.Root
            className="text-sm font-medium text-gray-900"
            htmlFor="email"
          >
            Username
          </Label.Root>
          <input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="you@email.com"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-main"
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

        <fieldset className="flex flex-col gap-2">
          <Label.Root
            className="text-sm font-medium text-gray-900"
            htmlFor="password"
          >
            Password
          </Label.Root>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-main"
              aria-required="true"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-main"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={0}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
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

        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-brand-main focus:ring-brand-main"
            {...register("keepLoggedIn")}
          />
          Keep me logged in
        </label>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="h-11 w-full rounded-lg bg-gray-900 text-sm font-semibold text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Logging in...
            </span>
          ) : (
            "Log In"
          )}
        </motion.button>

        <div className="text-center text-sm text-gray-600">
          Don&apos;t Have account?{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-brand-main hover:text-brand-main/80 hover:underline"
          >
            Sign Up
          </Link>
        </div>
      </form>
    </div>
  );
};
