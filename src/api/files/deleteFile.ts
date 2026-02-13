import { apiDelete } from "@/lib/apiClient";

import type { FileDeleteResponseDTO } from "./files.schema";
import { fileDeleteResponseSchema } from "./files.schema";

type DeleteFileResult = 
  | { success: true; message: string }
  | { success: false; error: string };

export const deleteFile = async (id: string): Promise<DeleteFileResult> => {
  const result = await apiDelete<FileDeleteResponseDTO>(`/file/${id}`);

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = fileDeleteResponseSchema.parse(result.data);
    return { success: true, message: parsed.message };
  } catch (parseError) {
    console.error("Delete file schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





