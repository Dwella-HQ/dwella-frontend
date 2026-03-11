import { apiDelete } from "@/lib/apiClient";

type DeleteMaintenanceRequestResult =
  | { success: true }
  | { success: false; error: string };

export const deleteMaintenanceRequest = async (
  id: string,
): Promise<DeleteMaintenanceRequestResult> => {
  const result = await apiDelete<{ success?: boolean; message?: string }>(
    `/maintenance-request/${id}`,
  );

  if (!result.success) {
    return result;
  }

  return { success: true };
};
