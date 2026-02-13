import { apiDelete } from "@/lib/apiClient";

type DeletePropertyResult = 
  | { success: true }
  | { success: false; error: string };

export const deleteProperty = async (id: string): Promise<DeletePropertyResult> => {
  const result = await apiDelete<{ success: boolean; message: string }>(`/property/${id}`);

  if (!result.success) {
    return result;
  }

  return { success: true };
};





