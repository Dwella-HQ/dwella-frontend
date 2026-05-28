import { apiGet } from "@/lib/apiClient";

export type GetLoggedInUserResult =
  | { success: true; data: unknown }
  | { success: false; error: string; statusCode?: number };

export const getLoggedInUser = async (): Promise<GetLoggedInUserResult> => {
  return apiGet<unknown>("/user/me");
};
