/**
 * Feature flags for environment-specific UI.
 *
 * Guest self-signup is hidden on production (`main` / Vercel Production for that
 * branch) and shown on the test/dev deploy and local development.
 */
export const isGuestSignupEnabled = (): boolean => {
  if (process.env.NEXT_PUBLIC_ENABLE_GUEST_SIGNUP === "true") return true;
  if (process.env.NEXT_PUBLIC_ENABLE_GUEST_SIGNUP === "false") return false;

  // Branch-based deploys: main = prod (hide), dev = test (show).
  const branch = process.env.VERCEL_GIT_COMMIT_REF || "";
  if (branch === "main" || branch === "master") return false;
  if (branch === "dev") return true;

  // Local `next dev` / non-production builds.
  if (process.env.NODE_ENV !== "production") return true;

  // Fallback for other hosts: only enable against the test API.
  const api = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  return /api-dev|localhost|127\.0\.0\.1/i.test(api);
};
