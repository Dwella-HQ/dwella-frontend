import { apiDelete } from "@/lib/apiClient";

export type DeleteUserResult =
  | { success: true; data: boolean | unknown }
  | { success: false; error: string; statusCode?: number };

export const deleteUser = async (id: string): Promise<DeleteUserResult> => {
  return apiDelete<boolean | unknown>(`/user/${encodeURIComponent(id)}`);
};
