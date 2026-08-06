import axios from "axios";
import { createUrl } from "@/utils/createUrl";

export const REFRESH_TOKEN_STORAGE_KEY = "refreshToken";

/** Fired after `persistAccessToken` updates storage (keep React user/socket consumers in sync). */
export const AUTH_ACCESS_TOKEN_UPDATED_EVENT = "dwella:access-token-updated";

/**
 * "Keep me logged in" preference, set at login time. Controls *where* the
 * refresh token is persisted:
 *  - true  -> localStorage (survives closing the browser/tab — the access
 *             token keeps silently renewing indefinitely, like today).
 *  - false -> sessionStorage only (cleared when the tab/browser closes, so
 *             once the current access token expires the user is signed out
 *             for real instead of being silently kept alive).
 * Defaults to `true` when unset so flows without an explicit checkbox
 * (social login, signup auto-login) keep the previous always-persisted
 * behavior.
 */
const REMEMBER_ME_STORAGE_KEY = "keepLoggedIn";

export function setRememberMePreference(remember: boolean): void {
  if (typeof window === "undefined") return;
  if (remember) {
    localStorage.setItem(REMEMBER_ME_STORAGE_KEY, "true");
  } else {
    localStorage.removeItem(REMEMBER_ME_STORAGE_KEY);
  }
}

export function getRememberMePreference(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(REMEMBER_ME_STORAGE_KEY);
  return stored === null ? true : stored === "true";
}

/**
 * Extract refresh token from common login response shapes (email + social login).
 */
export function extractRefreshTokenFromAuthPayload(
  raw: unknown,
): string | null {
  const r = raw as {
    refreshToken?: unknown;
    data?: { refreshToken?: unknown };
  };
  const refresh =
    (typeof r?.data?.refreshToken === "string" && r.data.refreshToken) ||
    (typeof r?.refreshToken === "string" && r.refreshToken) ||
    null;
  return refresh;
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) ||
    localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
  );
}

export function setStoredRefreshToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (!token) {
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    return;
  }
  if (getRememberMePreference()) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
    sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  } else {
    sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }
}

/**
 * Persist new access token after login or refresh (localStorage + cookies + user JSON).
 */
export function persistAccessToken(accessToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("authToken", accessToken);
  const maxAge = 60 * 60 * 24 * 7;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `accessToken=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  document.cookie = `authToken=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw) as { token?: string };
      u.token = accessToken;
      localStorage.setItem("user", JSON.stringify(u));
    }
  } catch {
    /* ignore */
  }

  try {
    window.dispatchEvent(new Event(AUTH_ACCESS_TOKEN_UPDATED_EVENT));
  } catch {
    /* ignore */
  }
}

export function persistLoginSessionTokens(
  accessToken: string,
  refreshToken?: string | null,
): void {
  persistAccessToken(accessToken);
  if (refreshToken) {
    setStoredRefreshToken(refreshToken);
  }
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * GET /auth/refresh-token with credentials + x-refresh-token header.
 * Returns true if a new access token was stored.
 */
export async function tryRefreshAccessToken(
  refreshTokenOverride?: string | null,
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const refresh = refreshTokenOverride || getStoredRefreshToken();
  if (!refresh) return false;

  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const url = createUrl("/auth/refresh-token");
      const currentAccessToken =
        localStorage.getItem("authToken") || localStorage.getItem("accessToken");
      const res = await axios.get(url, {
        withCredentials: true,
        headers: {
          "ngrok-skip-browser-warning": "true",
          "x-refresh-token": refresh,
          ...(currentAccessToken
            ? { Authorization: `Bearer ${currentAccessToken}` }
            : {}),
        },
        validateStatus: () => true,
        maxRedirects: 0,
      });

      if (res.status < 200 || res.status >= 300) {
        return false;
      }

      const data = res.data as Record<string, unknown>;
      const inner = data?.data as Record<string, unknown> | undefined;
      const accessToken =
        (typeof inner?.accessToken === "string" && inner.accessToken) ||
        (typeof data?.accessToken === "string" && data.accessToken) ||
        (typeof inner?.token === "string" && inner.token);

      if (!accessToken || typeof accessToken !== "string") {
        console.warn("Refresh response missing accessToken");
        return false;
      }

      persistAccessToken(accessToken);

      const headerRefresh = res.headers["x-refresh-token"];
      const newRefresh =
        (typeof headerRefresh === "string" && headerRefresh) ||
        (typeof inner?.refreshToken === "string" && inner.refreshToken) ||
        (typeof data?.refreshToken === "string" && data.refreshToken);
      if (newRefresh) {
        setStoredRefreshToken(newRefresh);
      }

      return true;
    } catch (e) {
      console.warn("Token refresh failed:", e);
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}
