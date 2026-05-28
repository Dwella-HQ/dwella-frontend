import { apiGet } from "@/lib/apiClient";

export type GetUserResult =
  | { success: true; data: unknown }
  | { success: false; error: string; statusCode?: number };

export const getUser = async (id: string): Promise<GetUserResult> => {
  return apiGet<unknown>(`/user/${encodeURIComponent(id)}`);
};
