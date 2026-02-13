import { apiDelete } from "@/lib/apiClient";

type DeleteTenantResult = 
  | { success: true }
  | { success: false; error: string };

export const deleteTenant = async (id: string | number): Promise<DeleteTenantResult> => {
  const result = await apiDelete<{ success: boolean; message: string }>(`/user/${id}`);

  if (!result.success) {
    return result;
  }

  return { success: true };
};





