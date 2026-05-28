import { apiPost } from "@/lib/apiClient";

export type BulkUploadPropertiesResult =
  | { success: true; data: unknown }
  | { success: false; error: string; statusCode?: number };

export const bulkUploadProperties = async (
  landlordId: string,
  file: File,
): Promise<BulkUploadPropertiesResult> => {
  const formData = new FormData();
  formData.append("file", file);

  return apiPost<unknown>(
    `/property/bulk-upload/${encodeURIComponent(landlordId)}`,
    formData,
  );
};
