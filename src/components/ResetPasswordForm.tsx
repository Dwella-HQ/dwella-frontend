import * as React from "react";
import * as Label from "@radix-ui/react-label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";

const resetPasswordFormSchema = z.object({
  token: z.string().min(1, "OTP is required"),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(8, "Please confirm your password."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

export type ResetPasswordFormProps = {
  onSubmit?: (values: Omit<ResetPasswordFormValues, "confirmPassword">) => Promise<void> | void;
  error?: string | null;
  isLoading?: boolean;
  success?: boolean;
  successMessage?: string;
  email?: string;
};

export const ResetPasswordForm = ({
  onSubmit,
  error,
  isLoading,
  success,
  successMessage,
  email,
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
      token: "",
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
    <form
      onSubmit={handleFormSubmit}
      className="w-full max-w-xl flex flex-col items-center justify-center gap-10 rounded-2xl bg-brand-white p-8 shadow-xl shadow-slate-950/40 backdrop-blur"
    >
      <header className="flex flex-col items-center justify-center gap-5">
        <h1 className="text-4xl font-bold text-brand-main p-2 rounded-lg lg:text-5xl">
          NESCO
        </h1>
        <span className="flex flex-col items-center justify-center text-center">
          <h2 className="text-xl font-bold text-brand-black p-2 rounded-lg lg:text-2xl">
            Reset Password
          </h2>
          <h3 className="text-sm text-brand-ash font-normal -mt-2 lg:text-base">
            Enter the OTP sent to your email and set a new password
          </h3>
        </span>
      </header>

      <div className="w-full flex flex-col items-center justify-center gap-6">
        {success ? (
          <div className="w-full rounded-lg bg-brand-green/10 border border-brand-green/30 p-4 flex flex-col items-center justify-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-brand-green" />
            <p className="text-sm text-brand-green text-center font-medium">
              {successMessage || "Password reset successful!"}
            </p>
            {email && (
              <p className="text-xs text-brand-green text-center">
                Account: {email}
              </p>
            )}
            <Link
              href="/auth/login"
              className="mt-2 inline-flex items-center gap-2 text-sm text-brand-main hover:underline font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="w-full rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-600">
                {error}
              </div>
            )}

            <fieldset className="w-full flex flex-col gap-2">
              <Label.Root
                className="text-sm font-medium text-brand-black"
                htmlFor="token"
              >
                OTP Code
              </Label.Root>
              <input
                id="token"
                type="text"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="h-12 w-full rounded-lg border-[0.3px] border-brand-border-light bg-brand-light-bg px-3 text-sm text-brand-black transition focus:ring-2 focus:ring-brand-main"
                {...register("token")}
              />
              {errors.token ? (
                <p className="text-xs text-rose-400">{errors.token.message}</p>
              ) : null}
            </fieldset>

            <fieldset className="w-full flex flex-col gap-2">
              <Label.Root
                className="text-sm font-medium text-brand-black"
                htmlFor="password"
              >
                New Password
              </Label.Root>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  className="h-12 w-full rounded-lg border-[0.3px] border-brand-border-light bg-brand-light-bg px-3 pr-10 text-sm text-brand-black transition focus:ring-2 focus:ring-brand-main"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-ash hover:text-brand-black transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password ? (
                <p className="text-xs text-rose-400">{errors.password.message}</p>
              ) : null}
            </fieldset>

            <fieldset className="w-full flex flex-col gap-2">
              <Label.Root
                className="text-sm font-medium text-brand-black"
                htmlFor="confirmPassword"
              >
                Confirm New Password
              </Label.Root>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  className="h-12 w-full rounded-lg border-[0.3px] border-brand-border-light bg-brand-light-bg px-3 pr-10 text-sm text-brand-black transition focus:ring-2 focus:ring-brand-main"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-ash hover:text-brand-black transition"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword ? (
                <p className="text-xs text-rose-400">{errors.confirmPassword.message}</p>
              ) : null}
            </fieldset>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand-main text-sm font-semibold text-brand-white transition hover:bg-brand-main/80 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-main disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            </button>

            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm text-brand-main hover:underline font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </>
        )}
      </div>

      <footer className="w-full flex flex-col items-center justify-center gap-2 text-sm text-brand-ash font-normal lg:flex-row lg:text-base">
        By continuing you agree to our{" "}
        <span>
          <Link href="/terms" className="text-brand-main hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-brand-main hover:underline">
            Privacy Policy
          </Link>
        </span>
      </footer>
    </form>
  );
};

