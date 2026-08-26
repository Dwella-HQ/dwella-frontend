import * as React from "react";
import * as Label from "@radix-ui/react-label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo_blue_vertical.png";

const securityLoginSchema = z.object({
  username: z.string().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
  keepLoggedIn: z.boolean().optional(),
});

export type SecurityLoginFormValues = z.infer<typeof securityLoginSchema>;

export type SecurityLoginFormProps = {
  onSubmit?: (values: SecurityLoginFormValues) => Promise<void> | void;
  error?: string | null;
  isLoading?: boolean;
};

export const SecurityLoginForm = ({
  onSubmit,
  error,
  isLoading,
}: SecurityLoginFormProps) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const loading = isLoading || isSubmitting;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SecurityLoginFormValues>({
    resolver: zodResolver(securityLoginSchema),
    defaultValues: {
      username: "",
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

  return (
    <div className="mx-auto w-full max-w-md">
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
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Security Sign In
          </h1>
          <p className="text-sm text-gray-600">
            Please login to continue to your account.
          </p>
        </div>

        {error ? (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        ) : null}

        <fieldset className="flex flex-col gap-2">
          <Label.Root
            className="text-sm font-medium text-gray-900"
            htmlFor="security-username"
          >
            Username
          </Label.Root>
          <input
            id="security-username"
            type="text"
            autoComplete="username"
            placeholder="Username"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
            aria-required="true"
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? "username-error" : undefined}
            {...register("username")}
          />
          {errors.username ? (
            <p id="username-error" className="text-xs text-red-600" role="alert">
              {errors.username.message}
            </p>
          ) : null}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <Label.Root
            className="text-sm font-medium text-gray-900"
            htmlFor="security-password"
          >
            Password
          </Label.Root>
          <div className="relative">
            <input
              id="security-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 pr-10 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
              aria-required="true"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-main"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.password ? (
            <p
              id="password-error"
              className="text-xs text-red-600"
              role="alert"
            >
              {errors.password.message}
            </p>
          ) : null}
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
      </form>
    </div>
  );
};
