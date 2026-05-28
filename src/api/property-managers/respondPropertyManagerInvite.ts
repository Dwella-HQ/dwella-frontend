import { apiGet } from "@/lib/apiClient";

export type RespondPropertyManagerInviteResult =
  | { success: true; data: unknown }
  | { success: false; error: string; statusCode?: number };

const respondPropertyManagerInvite = (
  action: "accept-invite" | "reject-invite",
  token: string,
): Promise<RespondPropertyManagerInviteResult> => {
  const qs = new URLSearchParams({ token });
  return apiGet<unknown>(`/property-manager/invite/${action}?${qs.toString()}`);
};

export const acceptPropertyManagerInvite = (
  token: string,
): Promise<RespondPropertyManagerInviteResult> =>
  respondPropertyManagerInvite("accept-invite", token);

export const rejectPropertyManagerInvite = (
  token: string,
): Promise<RespondPropertyManagerInviteResult> =>
  respondPropertyManagerInvite("reject-invite", token);
