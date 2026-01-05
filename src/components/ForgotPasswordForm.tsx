import * as React from "react";
import * as Label from "@radix-ui/react-label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

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
            Forgot Password?
          </h2>
          <h3 className="text-sm text-brand-ash font-normal -mt-2 lg:text-base">
            Enter your email to receive a password reset OTP
          </h3>
        </span>
      </header>

      <div className="w-full flex flex-col items-center justify-center gap-6">
        {success ? (
          <div className="w-full rounded-lg bg-brand-green/10 border border-brand-green/30 p-4 flex flex-col items-center justify-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-brand-green" />
            <p className="text-sm text-brand-green text-center">
              {successMessage || "Password reset OTP has been sent to your email and phone."}
            </p>
            <p className="text-xs text-brand-green text-center">
              The OTP expires in 30 minutes.
            </p>
            <Link
              href="/auth/reset-password"
              className="mt-2 inline-flex h-10 items-center justify-center px-6 rounded-lg bg-brand-main text-sm font-semibold text-brand-white transition hover:bg-brand-main/80"
            >
              Enter OTP & Reset Password
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
                htmlFor="email"
              >
                Business Email
              </Label.Root>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-12 w-full rounded-lg border-[0.3px] border-brand-border-light bg-brand-light-bg px-3 text-sm text-brand-black transition focus:ring-2 focus:ring-brand-main"
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-xs text-rose-400">{errors.email.message}</p>
              ) : null}
            </fieldset>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand-main text-sm font-semibold text-brand-white transition hover:bg-brand-main/80 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-main disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Sending OTP..." : "Send Reset OTP"}
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            </button>
          </>
        )}

        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-brand-main hover:underline font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
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

