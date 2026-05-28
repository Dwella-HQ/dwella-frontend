import { apiGet } from "@/lib/apiClient";

export type RespondTenantInviteResult =
  | { success: true; data: unknown }
  | { success: false; error: string; statusCode?: number };

const respondTenantInvite = (
  action: "accept-invite" | "reject-invite",
  token: string,
): Promise<RespondTenantInviteResult> => {
  const qs = new URLSearchParams({ token });
  return apiGet<unknown>(`/tenant/invite/${action}?${qs.toString()}`);
};

export const acceptTenantInvite = (
  token: string,
): Promise<RespondTenantInviteResult> =>
  respondTenantInvite("accept-invite", token);

export const rejectTenantInvite = (
  token: string,
): Promise<RespondTenantInviteResult> =>
  respondTenantInvite("reject-invite", token);
