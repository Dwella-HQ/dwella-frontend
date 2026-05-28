import { tryRefreshAccessToken } from "@/lib/authRefresh";

export type RefreshTokenResult =
  | { success: true }
  | { success: false; error: string };

/** GET /auth/refresh-token through the shared auth refresh helper. */
export const refreshToken = async (
  refreshTokenOverride?: string | null,
): Promise<RefreshTokenResult> => {
  const refreshed = await tryRefreshAccessToken(refreshTokenOverride);
  return refreshed
    ? { success: true }
    : { success: false, error: "Unable to refresh session" };
};
