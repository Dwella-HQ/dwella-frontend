const STORAGE_KEY = "dwella_postLoginRedirect";

/**
 * Remember the current URL so after session expiry the user can return here post-login.
 */
export function savePostLoginRedirect(): void {
  if (typeof window === "undefined") return;
  const path =
    window.location.pathname + window.location.search + window.location.hash;
  if (path.startsWith("/auth/login")) return;
  localStorage.setItem(STORAGE_KEY, path);
}

/**
 * Returns the saved path once, then clears it. Only same-origin app routes are allowed.
 */
export function consumePostLoginRedirect(): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  localStorage.removeItem(STORAGE_KEY);
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  const pathOnly = raw.split(/[?#]/)[0];
  if (
    !pathOnly.startsWith("/dashboard") &&
    !pathOnly.startsWith("/onboarding")
  ) {
    return null;
  }
  return raw;
}
