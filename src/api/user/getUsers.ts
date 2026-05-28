import { apiGet } from "@/lib/apiClient";

export type GetUsersResult =
  | { success: true; data: unknown }
  | { success: false; error: string; statusCode?: number };

export const getUsers = async (): Promise<GetUsersResult> => {
  return apiGet<unknown>("/user");
};
