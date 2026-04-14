/**
 * Normalizes noisy backend errors (e.g. Postgres unique violations) for signup UX.
 */

const EMAIL_KEY_PATTERN = /Key\s*\(\s*email\s*\)\s*=/i;

export function maskEmailForDisplay(email: string): string {
  return email.replace(
    /(.{2})(.*)(@.*)/,
    (_full, start: string, middle: string, domain: string) =>
      `${start}${"*".repeat(Math.min(middle.length, 4))}${domain}`,
  );
}

/** True when the server error clearly refers to duplicate email, not e.g. phone. */
export function isDuplicateEmailRegistrationError(raw: string): boolean {
  if (!raw || typeof raw !== "string") return false;
  return EMAIL_KEY_PATTERN.test(raw);
}

/**
 * User-safe message for inline display (when we do not redirect).
 */
export function formatRegistrationErrorForUser(raw: string): string {
  if (!raw || typeof raw !== "string") {
    return "Something went wrong. Please try again.";
  }
  if (isDuplicateEmailRegistrationError(raw)) {
    return "An account with this email already exists.";
  }
  const lower = raw.toLowerCase();
  if (
    lower.includes("already exists") &&
    (lower.includes("email") || lower.includes("@"))
  ) {
    return "An account with this email already exists.";
  }
  if (lower.includes("network error")) {
    return raw;
  }
  if (lower.includes("key (") || lower.includes("violates unique constraint")) {
    return "This information is already in use. Try signing in, or use a different email.";
  }
  return raw.length > 200
    ? "Something went wrong. Please try again."
    : raw;
}
