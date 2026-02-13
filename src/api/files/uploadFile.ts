import { apiPost } from "@/lib/apiClient";

import type { UploadFileRequest, FileUploadResponseDTO, FileDTO } from "./files.schema";
import { fileUploadResponseSchema } from "./files.schema";

type UploadFileResult = 
  | { success: true; data: FileDTO }
  | { success: false; error: string };

export const uploadFile = async (
  request: UploadFileRequest & { onProgress?: (percent: number) => void }
): Promise<UploadFileResult> => {
  const formData = new FormData();
  formData.append("file", request.file);
  if (request.folder) {
    formData.append("folder", request.folder);
  }
  if (request.label) {
    formData.append("label", request.label);
  }

  const result = await apiPost<FileUploadResponseDTO>("/file", formData, {
    token: request.token,
    onUploadProgress: (event) => {
      if (!request.onProgress || !event.total) {
        return;
      }
      const percent = Math.round((event.loaded / event.total) * 100);
      request.onProgress(percent);
    },
  });

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = fileUploadResponseSchema.parse(result.data);
    // Handle both direct file object and object with data property
    const file = parsed.data || (parsed as unknown as FileDTO);
    if (!file.filename && (file as { fileName?: string }).fileName) {
      file.filename = (file as { fileName?: string }).fileName;
    }
    return { success: true, data: file };
  } catch (parseError) {
    console.error("Upload file schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





