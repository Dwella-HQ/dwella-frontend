import { login } from "@/api/auth/login";

type LoginResult = Awaited<ReturnType<typeof login>>;

/**
 * Reads access token from a register API JSON body (shape varies by backend).
 */
export function pickAccessTokenFromRegisterResponse(
  body: unknown,
): string | null {
  if (!body || typeof body !== "object") return null;
  const root = body as Record<string, unknown>;
  const nested = root.data;
  const data =
    nested && typeof nested === "object"
      ? (nested as Record<string, unknown>)
      : root;
  if (typeof data.accessToken === "string" && data.accessToken.trim()) {
    return data.accessToken.trim();
  }
  if (typeof data.token === "string" && data.token.trim()) {
    return data.token.trim();
  }
  return null;
}

/**
 * Invited users are email-verified server-side; login may lag briefly after register.
 */
export async function loginAfterInviteRegistration(
  email: string,
  password: string,
): Promise<LoginResult> {
  let last: LoginResult = { success: false, error: "Login failed" };
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 300 * attempt));
    }
    last = await login({ email, password });
    if (last.success) return last;
  }
  return last;
}
