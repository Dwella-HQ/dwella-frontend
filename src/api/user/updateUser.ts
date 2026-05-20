import { apiPatch } from "@/lib/apiClient";

/** `PATCH /user/{id}` — shape depends on role; send only fields you intend to update. */
export type UpdateUserBody = {
  fullName?: string;
  name?: string;
  email?: string;
  phoneNumber?: string | null;
  phone?: string;
} & Record<string, unknown>;

type Result = { success: true } | { success: false; error: string };

export const updateUser = async (
  userId: string,
  body: UpdateUserBody,
): Promise<Result> => {
  const result = await apiPatch<unknown>(
    `/user/${encodeURIComponent(userId)}`,
    body,
  );
  if (!result.success) {
    return result;
  }
  return { success: true };
};
