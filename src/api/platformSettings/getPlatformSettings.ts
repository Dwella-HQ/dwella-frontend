import { apiGet } from "@/lib/apiClient";

function unwrapData(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const inner = o.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return inner as Record<string, unknown>;
  }
  return o;
}

type Result =
  | { success: true; data: Record<string, unknown> }
  | { success: false; error: string };

/** `GET /settings` — platform / account preferences (ENDPOINTS.md). */
export const getPlatformSettings = async (): Promise<Result> => {
  const result = await apiGet<unknown>("/settings");
  if (!result.success) {
    return result;
  }
  return { success: true, data: unwrapData(result.data) };
};
