// TODO: Set API base URL when backend is ready
// const DEFAULT_BASE_URL = "https://api.dwella.ng/api/v1";
const DEFAULT_BASE_URL = "";

type QueryValue = string | number | boolean | null | undefined;

type QueryParams = Record<string, QueryValue | QueryValue[]>;

/**
 * Get the API base URL
 * Priority:
 * 1. NEXT_PUBLIC_API_BASE_URL from process.env (build-time)
 * 2. Runtime injected value from window (for Heroku)
 * 3. DEFAULT_BASE_URL (fallback)
 *
 * Note: In Next.js, NEXT_PUBLIC_* env vars are embedded at BUILD time.
 * If not set during build, we need runtime injection via _document.tsx
 */
const getBaseUrl = () => {
  // Check for build-time env var (Next.js replaces this at build time)
  // On client side, process.env.NEXT_PUBLIC_* is available but replaced at build time
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) {
    const buildTimeEnv = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (buildTimeEnv && buildTimeEnv.length > 0) {
      return buildTimeEnv;
    }
  }

  // Check for runtime injection (for Heroku/post-build env vars)
  // This will be set by _document.tsx script tag
  if (typeof window !== "undefined") {
    const windowWithEnv = window as typeof window & {
      __NEXT_PUBLIC_API_BASE_URL__?: string;
    };
    const runtimeEnv = windowWithEnv.__NEXT_PUBLIC_API_BASE_URL__;
    if (runtimeEnv && runtimeEnv.length > 0) {
      return runtimeEnv;
    }

    // DO NOT fallback to window.location.origin - that's wrong for API calls
    // This was the bug - it was using the Heroku app URL instead of the backend URL
  }

  return DEFAULT_BASE_URL;
};

/**
 * Get the base URL for API calls
 * This can be used to display the base URL in the UI
 */
export const getApiBaseUrl = () => {
  return getBaseUrl();
};

export const createUrl = (path: string, params?: QueryParams) => {
  const baseUrl = getBaseUrl();

  // Remove leading slash from path if present to avoid replacing the base URL path
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  // Ensure baseUrl ends with / for proper URL joining
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  const url = new URL(cleanPath, normalizedBase);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item === undefined || item === null) {
            return;
          }

          url.searchParams.append(key, String(item));
        });
        return;
      }

      if (value === undefined || value === null) {
        return;
      }

      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
};
