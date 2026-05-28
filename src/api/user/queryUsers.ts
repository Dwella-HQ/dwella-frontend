import { apiGet } from "@/lib/apiClient";

export type QueryUsersParams = {
  name?: string;
  userId?: string;
  email?: string;
  search?: string;
  isActive?: string | boolean;
  isVerified?: string | boolean;
  roleName?: string;
  phoneNumber?: string;
  page?: number;
  limit?: number;
};

export type QueryUsersResult =
  | { success: true; data: unknown }
  | { success: false; error: string; statusCode?: number };

export const queryUsers = async (
  params: QueryUsersParams = {},
): Promise<QueryUsersResult> => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return apiGet<unknown>(`/user/query${qs ? `?${qs}` : ""}`);
};
