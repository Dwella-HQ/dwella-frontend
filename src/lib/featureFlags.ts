/**
 * Feature flags for environment-specific UI.
 *
 * Guest self-signup is enabled on the test/dev API and local, and hidden on
 * production unless explicitly overridden.
 */
export const isGuestSignupEnabled = (): boolean => {
  if (process.env.NEXT_PUBLIC_ENABLE_GUEST_SIGNUP === "true") return true;
  if (process.env.NEXT_PUBLIC_ENABLE_GUEST_SIGNUP === "false") return false;
  const api = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  return /api-dev|localhost|127\.0\.0\.1/i.test(api);
};
