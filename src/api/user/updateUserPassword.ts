import { apiPatch } from "@/lib/apiClient";

/** `PATCH /user/{id}/password` (ENDPOINTS.md) */
export type UpdateUserPasswordBody = {
  currentPassword: string;
  newPassword: string;
};

type Result = { success: true } | { success: false; error: string };

export const updateUserPassword = async (
  userId: string,
  body: UpdateUserPasswordBody,
): Promise<Result> => {
  const result = await apiPatch<unknown>(
    `/user/${encodeURIComponent(userId)}/password`,
    body,
  );
  if (!result.success) {
    return result;
  }
  return { success: true };
};
